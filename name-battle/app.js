const { URLSearchParams } = require('url')

const nameBattle = require('name-battle')

const config = require('./config')
const { getTotalDebuffs, putDebuff } = require('./debuffs')
const { didNameChange } = require('./metadata')
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
    let targetUserId
    let attackerUserId

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

        targetUserId = parameters
            .get('text')
            .split(' ')[0]
            .split('|')[0]
            .replace(/[<@]/g, '')

        attackerUserId = parameters.get('user_id')

        const attackerDebuffs = await getTotalDebuffs(attackerUserId)

        if (targetUserId === 'status') {
            const health = Math.max(100 - attackerDebuffs, 0) / 100
            const healthBarUnit = ':heart:'
            const healthBarEmpty = ':black_heart:'
            const healthBarLength = 20
            const healthBar = Array(healthBarLength)
                .fill()
                .map((_, i) =>
                    i < healthBarLength * health
                        ? healthBarUnit
                        : healthBarEmpty,
                )
                .join('')
            const fixedHealth = (health * 100).toFixed(2)
            const attackerName = await getRealName(attackerUserId)
            return {
                statusCode: 200,
                body: JSON.stringify({
                    text: `Status for *${attackerName}*:\n*_Life Force_*: [${healthBar}] ${fixedHealth}%`,
                }),
            }
        }

        if (attackerDebuffs >= 100) {
            throw new Error("You can't Name Battle: you're dead!")
        }

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

            if (newLifeForce > 0 || newLifeForce + (100 - lifeForce) > 0) {
                await putDebuff(targetUserId, 100 - lifeForce)
            } else {
                throw new Error('Target is already dead!')
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
            errorMessage = `${targetUserId} is not a valid user`
            statusCode = 200
        } else if (
            errorMessage === "You can't Name Battle: you're dead!" ||
            errorMessage === 'Target is already dead!'
        ) {
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
