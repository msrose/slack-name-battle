jest.mock('../dynamodb', () => ({
    getBattleDocumentsBySlackId: jest.fn(() => ({ Items: [] })),
    putBattleDocumentBySlackId: () => {},
    getMetadataDocumentBySlackId: jest.fn(() => ({ Item: undefined })),
    updateMetadataDocumentBySlackId: () => {},
}))

jest.mock('../utils', () => {
    const utils = jest.requireActual('../utils')
    utils.getRandomNumber = () => 0
    utils.logError = () => {}
    return utils
})

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
const {
    getBattleDocumentsBySlackId,
    getMetadataDocumentBySlackId,
} = require('../dynamodb')

process.env.SLACK_SIGNING_SECRET = 'wowowow'
process.env.SLACK_TOKEN = 'moremore'

function getRequest(
    body,
    timestamp,
    signature = getSignature(timestamp, body),
) {
    return {
        body,
        headers: {
            'X-Slack-Request-Timestamp': timestamp,
            'X-Slack-Signature': signature,
        },
    }
}

describe('Slack name battle', () => {
    it.each([
        ['target', 'attacker'],
        ['michael', 'michael'],
        ['aaaaa', 'a'],
        ['aaaaa', 'aa'],
    ])('conducts a name battle between %s and %s', async (target, attacker) => {
        const body = `text=${target}&user_id=${attacker}`
        const timestamp = 1231251
        const result = await lambdaHandler(getRequest(body, timestamp))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('sends an error when there is a signature mismatch', async () => {
        const body = `text=target&user_id=attacker`
        const timestamp = 141251513
        const signature = getSignature(timestamp, body)
        const result = await lambdaHandler(
            getRequest(body, timestamp, 'a'.repeat(signature.length)),
        )
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('sends an error message if the attacker is dead', async () => {
        getBattleDocumentsBySlackId.mockImplementationOnce(() => ({
            Items: [{ lifeForce: 100 }],
        }))
        const body = `text=target&user_id=attacker`
        const timestamp = 1231251
        const result = await lambdaHandler(getRequest(body, timestamp))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('sends an error message if the target is dead', async () => {
        getBattleDocumentsBySlackId.mockImplementation(id => ({
            Items: id === 'target' ? [{ lifeForce: 100 }] : [],
        }))
        const body = `text=target&user_id=attacker`
        const timestamp = 1231251
        const result = await lambdaHandler(getRequest(body, timestamp))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('kills the attacker if they change their name', async () => {
        getMetadataDocumentBySlackId.mockImplementationOnce(() => ({
            Item: { nameHash: 'lalala' },
        }))
        const body = `text=target&user_id=attacker`
        const timestamp = 1231251
        const result = await lambdaHandler(getRequest(body, timestamp))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })
})
