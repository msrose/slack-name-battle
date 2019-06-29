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

describe('Slack name battle', () => {
    it.each([
        ['target', 'attacker'],
        ['michael', 'michael'],
        ['aaaaa', 'a'],
        ['aaaaa', 'aa'],
    ])('conducts a name battle between %s and %s', async (target, attacker) => {
        const result = await lambdaHandler({
            body: `text=${target}&user_id=${attacker}`,
        })
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })
})
