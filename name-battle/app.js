const axios = require('axios')
const nameBattle = require('name-battle')

const { URLSearchParams } = require('url')

async function getRealName(id) {
  const userResponse = await axios.get(
    `https://slack.com/api/users.info?user=${id}`,
    {
      headers: { 'Authorization': `Bearer ${process.env.SLACK_TOKEN}` }
    }
  )
  if (!userResponse.data.ok) {
    throw new Error(userResponse.data.error)
  }
  return userResponse.data.user.profile.real_name
}

exports.lambdaHandler = async (event, context) => {
    let response
    let targetUserId

    try {
        const parameters = new URLSearchParams(event.body)

        targetUserId = parameters
            .get('text')
            .split(' ')[0]
            .split('|')[0]
            .replace(/[<@]/g, '')

        const [attacker, target] = await Promise.all([
            getRealName(parameters.get('user_id')),
            getRealName(targetUserId)
        ])

        response = {
            statusCode: 200,
            body: JSON.stringify({
                response_type: 'in_channel',
                text: JSON.stringify({
                    attacker,
                    target,
                  lifeForce: nameBattle({ attacker, target }),
                })
            })
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
                text: `Could not conduct Name Battle! Error: ${errorMessage}.`
            })
        }
    }

    return response
}
