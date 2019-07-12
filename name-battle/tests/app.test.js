jest.mock('../dynamodb', () => ({
    getBattleDocumentsBySlackId: jest.fn(),
    putBattleDocumentBySlackId: () => {},
    getMetadataDocumentBySlackId: jest.fn(),
    updateMetadataDocumentBySlackId: () => {},
    incrementMetadataDocumentFieldsBySlackId: () => {},
    getAllMetadataDocuments: jest.fn(),
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
    getAllMetadataDocuments,
} = require('../dynamodb')

beforeEach(() => {
    getBattleDocumentsBySlackId.mockReset()
    getBattleDocumentsBySlackId.mockImplementation(() => ({ Items: [] }))
    getMetadataDocumentBySlackId.mockReset()
    getMetadataDocumentBySlackId.mockImplementation(() => ({}))
    getAllMetadataDocuments.mockReset()
    getAllMetadataDocuments.mockImplementation(() => ({ Items: [] }))
})

process.env.SLACK_SIGNING_SECRET = 'wowowow'
process.env.SLACK_TOKEN = 'moremore'

function getRequest(
    body,
    timestamp = 1241455,
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
        const result = await lambdaHandler(getRequest(body))
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
        getBattleDocumentsBySlackId.mockImplementation(() => ({
            Items: [{ lifeForce: 100 }],
        }))
        const body = `text=target&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('sends an error message if the target is dead', async () => {
        getBattleDocumentsBySlackId.mockImplementation(id => ({
            Items: id === 'target' ? [{ lifeForce: 100 }] : [],
        }))
        const body = `text=target&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('kills the attacker if they change their name', async () => {
        getMetadataDocumentBySlackId.mockImplementation(() => ({
            Item: { nameHash: 'lalala' },
        }))
        const body = `text=target&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it.each([[100], [77], [34], [0], [-22]])(
        'shows a health bar when the attacker is at %s%% health',
        async lifeForce => {
            getBattleDocumentsBySlackId.mockImplementation(() => ({
                Items: [{ lifeForce: 100 - lifeForce }],
            }))
            const body = `text=status&user_id=attacker`
            const result = await lambdaHandler(getRequest(body))
            expect(result.statusCode).toBe(200)
            expect(JSON.parse(result.body)).toMatchSnapshot()
        },
    )

    it.each([[6], [5], [2], [0]])(
        'shows a manna bar when the attacker has used %s manna',
        async manna => {
            getBattleDocumentsBySlackId.mockImplementation(() => ({
                Items: [{ manna }],
            }))
            const body = `text=status&user_id=attacker`
            const result = await lambdaHandler(getRequest(body))
            expect(result.statusCode).toBe(200)
            expect(JSON.parse(result.body)).toMatchSnapshot()
        },
    )

    it('shows a help message if no text is given', async () => {
        const body = `text=&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('shows a help message if help is given as the text', async () => {
        const body = `text=help&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('sends an errors message if the attacker is out of manna', async () => {
        getBattleDocumentsBySlackId.mockImplementation(() => ({
            Items: [{ manna: 5 }],
        }))
        const body = `text=target&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('shows stats when the stats command is given', async () => {
        getMetadataDocumentBySlackId.mockImplementation(() => ({
            Item: { kills: 2, deaths: 3, suicides: 4 },
        }))
        const body = `text=stats&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('shows a laederboard when the leaders command is given', async () => {
        getAllMetadataDocuments.mockImplementation(() => ({
            Items: [
                { kills: 25, deaths: 5, slack_id: 'michael' },
                { kills: 10, deaths: 1, slack_id: 'vikram' },
            ],
            ScannedCount: 12,
        }))
        const body = `text=leaders&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('counts suicides towards deaths on leaderboard', async () => {
        getAllMetadataDocuments.mockImplementation(() => ({
            Items: [
                { kills: 25, deaths: 5, slack_id: 'michael', suicides: 3 },
                { kills: 10, deaths: 1, slack_id: 'vikram', suicides: 10 },
            ],
            ScannedCount: 3,
        }))
        const body = `text=leaders&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })

    it('extracts slack IDs correctly from payload', async () => {
        const body = `text=<@target|targetusername>&user_id=attacker`
        const result = await lambdaHandler(getRequest(body))
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toMatchSnapshot()
    })
})
