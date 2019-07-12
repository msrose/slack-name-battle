const axios = require('axios')

async function getRealName(id) {
    if (process.env.AWS_SAM_LOCAL) return id
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

function extractUserId(token) {
    return token.split('|')[0].replace(/[<@]/g, '')
}

function getResponseBody(text, responseType) {
    return JSON.stringify({
        response_type: responseType,
        text,
    })
}

function getInChannelResponse(text) {
    return getResponseBody(text, 'in_channel')
}

function getEphemeralResponse(text) {
    return getResponseBody(text, 'ephemeral')
}

exports.getRealName = getRealName
exports.extractUserId = extractUserId
exports.getInChannelResponse = getInChannelResponse
exports.getEphemeralResponse = getEphemeralResponse
