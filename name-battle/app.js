const { URLSearchParams } = require('url')

const nameBattle = require('name-battle')

const config = require('./config')
const { getTotalDebuffs, putDebuff } = require('./debuffs')
const { useManna, getUsedManna } = require('./manna')
const {
    didNameChange,
    recordBattle,
    getStats,
    getLeaderboard,
} = require('./metadata')
const {
    getRandomNumber,
    isRequestSignatureValid,
    logError,
} = require('./utils')
const { getRealName } = require('./slack')

function getResponse(
    attackerId,
    targetId,
    attackerName,
    targetName,
    lifeForce,
    didAttackerChangeName,
) {
    const lines = [
        `<@${attackerId}> challenges <@${targetId}> to a Name Battle! :collision: *_${attackerName}_* attacks *_${targetName}_* in a parallel universe...`,
    ]
    if (!didAttackerChangeName) {
        const fixedLifeForce = lifeForce.toFixed(2)
        let adjectives = []
        let emojis = []
        for (const messageConfig of config.messages) {
            if (messageConfig.test(lifeForce)) {
                adjectives = messageConfig.adjectives
                emojis = messageConfig.emojis
                lines.push(messageConfig.format(targetName, fixedLifeForce))
                break
            }
        }
        const adjective = adjectives[getRandomNumber(adjectives.length)]
        const emoji = emojis[getRandomNumber(emojis.length)]
        lines[lines.length - 1] += ` ${adjective} attack! ${emoji}`
    } else {
        lines.push(
            `:redsiren: ${attackerName} changed their name! For shame! ${targetName} is unaffected, and ${attackerName} dies instead! :redsiren:`,
        )
    }
    return lines.join('\n')
}

exports.lambdaHandler = async event => {
    let response

    try {
        const {
            'X-Slack-Request-Timestamp': timestamp,
            'X-Slack-Signature': signature,
        } = event.headers
        if (
            !process.env.AWS_SAM_LOCAL &&
            !isRequestSignatureValid(timestamp, event.body, signature)
        ) {
            throw new Error('Forbidden: signature mismatch')
        }

        const parameters = new URLSearchParams(event.body)

        const tokens = parameters.get('text').split(' ')

        const command = tokens[0]

        if (!command || command === 'help') {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    text:
                        'Usage: `/name-battle @<target> | status | stats | help | leaders`',
                }),
            }
        }

        if (command === 'leaders') {
            const { leaders, total } = await getLeaderboard()
            const leadersWithNames = await Promise.all(
                leaders.map(({ slackId, ratio }) =>
                    getRealName(slackId).then(name => ({ name, ratio })),
                ),
            )
            return {
                statusCode: 200,
                body: JSON.stringify({
                    response_type: 'in_channel',
                    text: `*Leaderboard* (_Top ${
                        leaders.length
                    } of ${total}_)\n${leadersWithNames
                        .map(
                            ({ name, ratio }, i) =>
                                `${i + 1}. *${name}*: ${ratio.toFixed(3)}`,
                        )
                        .join('\n')}`,
                }),
            }
        }

        const attackerUserId = parameters.get('user_id')

        if (command === 'stats') {
            const [realName, stats] = await Promise.all([
                getRealName(attackerUserId),
                getStats(attackerUserId),
            ])
            const getStat = stat => stats[stat] || 0
            return {
                statusCode: 200,
                body: JSON.stringify({
                    response_type: 'in_channel',
                    text: [
                        `Stats for *${realName}*:`,
                        [
                            `:trophy: Victories: *${getStat('kills')}*`,
                            `:skull: Defeats: *${getStat('deaths')}*`,
                            `:garbage_fire: Suicides: *${getStat('suicides')}*`,
                        ].join(' | '),
                    ].join('\n'),
                }),
            }
        }

        const [attackerDebuffs, attackerUsedManna] = await Promise.all([
            getTotalDebuffs(attackerUserId),
            getUsedManna(attackerUserId),
        ])

        if (command === 'status') {
            const getStatusBar = (max, value, length, unit, empty) => {
                const percentage = Math.max(max - value, 0) / max
                return Array(length)
                    .fill()
                    .map((_, i) => (i < length * percentage ? unit : empty))
                    .join('')
            }
            const healthBar = getStatusBar(
                100,
                attackerDebuffs,
                20,
                ':heart:',
                ':black_heart:',
            )
            const mannaBar = getStatusBar(
                5,
                attackerUsedManna,
                20,
                ':collision:',
                ':anger:',
            )
            const health = Math.max(100 - attackerDebuffs, 0) / 100
            const fixedHealth = (health * 100).toFixed(2)
            const manna = Math.max(5 - attackerUsedManna, 0) / 5
            const fixedManna = (manna * 100).toFixed(2)
            const attackerName = await getRealName(attackerUserId)
            return {
                statusCode: 200,
                body: JSON.stringify({
                    text: [
                        `Status for *${attackerName}*:`,
                        `\`${'Life Force'.padStart(
                            10,
                        )}\`: [${healthBar}] ${fixedHealth}%`,
                        `\`${'Attacks'.padStart(
                            10,
                        )}\`: [${mannaBar}] ${fixedManna}%`,
                    ].join('\n'),
                }),
            }
        }

        if (attackerDebuffs >= 100) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    text: "You can't Name Battle: you're dead!",
                }),
            }
        }

        if (attackerUsedManna >= 5) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    text: "You can't Name Battle: out of attacks!",
                }),
            }
        }

        const targetUserId = command.split('|')[0].replace(/[<@]/g, '')

        const [attacker, target, targetDebuffs] = await Promise.all([
            getRealName(attackerUserId),
            getRealName(targetUserId),
            getTotalDebuffs(targetUserId),
        ])

        let newLifeForce
        const didAttackerChangeName = await didNameChange(
            attackerUserId,
            attacker,
        )

        if (didAttackerChangeName) {
            await putDebuff(attackerUserId, 100, 15)
        } else {
            const lifeForce = nameBattle({ attacker, target })

            newLifeForce = lifeForce - targetDebuffs

            const isKill =
                newLifeForce <= 0 && newLifeForce + (100 - lifeForce) > 0

            if (newLifeForce > 0 || isKill) {
                // TODO: put these in a transaction
                await Promise.all([
                    putDebuff(targetUserId, 100 - lifeForce),
                    useManna(attackerUserId),
                    recordBattle(attackerUserId, targetUserId, isKill),
                ])
            } else {
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        text: "You can't Name Battle: target is already dead!",
                    }),
                }
            }
        }

        response = {
            statusCode: 200,
            body: JSON.stringify({
                response_type: 'in_channel',
                text: getResponse(
                    attackerUserId,
                    targetUserId,
                    attacker,
                    target,
                    newLifeForce,
                    didAttackerChangeName,
                ),
            }),
        }
    } catch (err) {
        logError(err)

        let errorMessage = err.message
        let statusCode = 400

        if (errorMessage === 'user_not_found') {
            errorMessage = 'Specified user is invalid'
            statusCode = 200
        }

        response = {
            statusCode,
            body: JSON.stringify({
                text: `Could not conduct Name Battle! Error: ${errorMessage}.`,
            }),
        }
    }

    return response
}
