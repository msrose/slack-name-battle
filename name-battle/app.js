const axios = require('axios')
const nameBattle = require('name-battle')

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
    let adjectives
    let emojis
    if (lifeForce >= 80) {
        lines.push(
            `${targetName} is barely affected, with *${fixedLifeForce}%* life force remaining!`,
        )
        adjectives = [
            'A paltry',
            'A pitiful',
            'A weak',
            'A pathetic',
            'A useless',
            'An insignificant',
            'An inconsequential',
        ]
        emojis = [
            ':joy:',
            ':feelsgoodman:',
            ':pogchamp:',
            ':partyparrot:',
            ':laughing:',
            ':ghost:',
        ]
    } else if (lifeForce >= 50) {
        lines.push(
            `${targetName} is wounded, with *${fixedLifeForce}%* life force remaining!`,
        )
        adjectives = [
            'A worrying',
            'A concerning',
            'An inflammatory',
            'A potent',
            'A bothersome',
            'A disquieting',
            'An agitating',
        ]
        emojis = [
            ':gun:',
            ':rage:',
            ':angry:',
            ':sad_parrot:',
            ':cry:',
            ':sob:',
            ':crying_cat_face:',
            ':feelsbadman:',
            ':biblethump:',
        ]
    } else if (lifeForce > 0) {
        lines.push(
            `${targetName} is critically injured, with *${fixedLifeForce}%* life force remaining!`,
        )
        adjectives = [
            'A destructive',
            'A vicious',
            'A merciless',
            'A cruel',
            'A ferocious',
            'A ruthless',
            'A fiendish',
        ]
        emojis = [
            ':face_with_head_bandage:',
            ':hospital:',
            ':knife:',
            ':dagger_knife:',
            ':crossed_swords:',
            ':hammer:',
            ':syringe:',
        ]
    } else {
        lines.push(`${targetName} is dead, with *0%* life force remaining!`)
        adjectives = [
            'A devastating',
            'A catastrophic',
            'An apocalyptic',
            'A calamitous',
            'A cataclysmic',
            'A ruinous',
            'A dire',
        ]
        emojis = [
            ':skull:',
            ':skull_and_crossbones:',
            ':coffin:',
            ':funeral_urn:',
        ]
    }
    const adjective = adjectives[getRandomNumber(adjectives.length)]
    const emoji = emojis[getRandomNumber(emojis.length)]
    lines[lines.length - 1] += ` ${adjective} attack! ${emoji}`
    return lines.join('\n')
}

// eslint-disable-next-line no-unused-vars
exports.lambdaHandler = async (event, context) => {
    let response
    let targetUserId
    let attackerUserId

    try {
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
