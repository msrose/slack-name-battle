const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const mock = new MockAdapter(axios)

mock.onGet(/https:\/\/slack.com\/api\/users.info/).reply(config => [
    200,
    {
        ok: true,
        user: {
            profile: { real_name: config.url.split('?')[1].split('=')[1] },
        },
    },
])

const { lambdaHandler } = require('../app')

describe('Slack name battle', function() {
    it('conducts a name battle', async () => {
        const result = await lambdaHandler({
            body: 'text=target&user_id=attacker',
        })
        expect(result.statusCode).toBe(200)
    })
})
