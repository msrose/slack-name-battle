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

exports.getRealName = getRealName
exports.extractUserId = extractUserId
