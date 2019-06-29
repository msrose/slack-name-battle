const axios = require('axios')
const nameBattle = require('name-battle')
const config = require('./config')
const crypto = require('crypto')

const { URLSearchParams } = require('url')

function getRandomNumber(max) {
    if (process.env.NODE_ENV === 'test') return 0
    return Math.floor(Math.random() * max)
}

async function getRealName(id) {
    const userResponse = await axios.get(
        `https://slack.com/api/users.info?user=${id}`,
        {
            headers: { Authorization: `Bearer ${process.env.SLACK_TOKEN}` },
        },
    )
    if (!userResponse.data.ok) {
        throw new Error(userResponse.data.error)
    }
    return userResponse.data.user.profile.real_name
}

function getResponse(
    attackerId,
    targetId,
    attackerName,
    targetName,
    lifeForce,
) {
    const lines = [
        `<@${attackerId}> challenges <@${targetId}> to a Name Battle! :collision: *_${attackerName}_* attacks *_${targetName}_* in a parallel universe...`,
    ]
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
    return lines.join('\n')
}

exports.getSignature = (timestamp, body) => {
    const basestring = `v0:${timestamp}:${body}`
    const signature = `v0=${crypto
        .createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
        .update(basestring)
        .digest('hex')}`
    return signature
}

// eslint-disable-next-line no-unused-vars
exports.lambdaHandler = async (event, context) => {
    let response
    let targetUserId
    let attackerUserId

    try {
        const slackRequestTimestamp = event.headers['X-Slack-Request-Timestamp']
        const signature = exports.getSignature(
            slackRequestTimestamp,
            event.body,
        )
        if (
            !crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(event.headers['X-Slack-Signature']),
            )
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

        const [attacker, target] = await Promise.all([
            getRealName(parameters.get('user_id')),
            getRealName(targetUserId),
        ])

        response = {
            statusCode: 200,
            body: JSON.stringify({
                response_type: 'in_channel',
                text: getResponse(
                    attackerUserId,
                    targetUserId,
                    attacker,
                    target,
                    nameBattle({ attacker, target }),
                ),
            }),
        }
    } catch (err) {
        console.log(err)

        let errorMessage = err.message
        let statusCode = 400

        if (errorMessage === 'user_not_found') {
            errorMessage = `${targetUserId} is not a valid user`
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
