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

function getResponseBody(text, responseType, context) {
    return JSON.stringify({
        response_type: responseType,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text,
                },
            },
        ].concat(
            context
                ? [
                      {
                          type: 'context',
                          elements: [
                              {
                                  type: 'mrkdwn',
                                  text: context,
                              },
                          ],
                      },
                  ]
                : [],
        ),
    })
}

function getInChannelResponse(text, context) {
    return getResponseBody(text, 'in_channel', context)
}

function getEphemeralResponse(text) {
    return getResponseBody(text, 'ephemeral')
}

module.exports = {
    getRealName,
    extractUserId,
    getInChannelResponse,
    getEphemeralResponse,
}
