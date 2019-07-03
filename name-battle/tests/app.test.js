const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const { URL } = require('url')

const mock = new MockAdapter(axios)

mock.onGet(/https:\/\/slack.com\/api\/users.info/).reply(config => [
    200,
    {
        ok: true,
        user: {
            profile: {
                real_name: new URL(config.url).searchParams.get('user'),
            },
        },
    },
])

const { lambdaHandler } = require('../app')
const { getSignature } = require('../utils')

process.env.SLACK_SIGNING_SECRET = 'wowowow'
process.env.SLACK_TOKEN = 'moremore'

jest.mock('../dynamodb', () => ({
    getDocumentsBySlackId: () => ({ Items: [] }),
    putDocumentBySlackId: () => {},
}))

jest.mock('../utils', () => {
    const utils = jest.requireActual('../utils')
    utils.getRandomNumber = () => 0
    return utils
})

describe('Slack name battle', () => {
    it.each([
        ['target', 'attacker'],
        ['michael', 'michael'],
        ['aaaaa', 'a'],
        ['aaaaa', 'aa'],
    ])('conducts a name battle between %s and %s', async (target, attacker) => {
        const body = `text=${target}&user_id=${attacker}`
        const timestamp = 1231251
        const result = await lambdaHandler({
            body,
            headers: {
                'X-Slack-Request-Timestamp': timestamp,
                'X-Slack-Signature': getSignature(timestamp, body),
            },
        })
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })
})
