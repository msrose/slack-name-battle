const aws = require('aws-sdk')

const dynamodbOptions = {
    region: process.env.AWS_REGION || 'us-east-1',
}

if (process.env.AWS_SAM_LOCAL) {
    dynamodbOptions.endpoint = 'http://dynamodb:8000'
}

const dynamodb = new aws.DynamoDB.DocumentClient(dynamodbOptions)

function getTotalDebuffs(id) {
    return new Promise((res, rej) => {
        const now = Math.floor(Date.now() / 1000)
        dynamodb.query(
            {
                TableName: process.env.NAME_BATTLE_TABLE_NAME,
                KeyConditions: {
                    slack_id: {
                        ComparisonOperator: 'EQ',
                        AttributeValueList: [id],
                    },
                    timestamp: {
                        ComparisonOperator: 'GT',
                        AttributeValueList: [now],
                    },
                },
            },
            (err, data) => {
                if (err) return rej(err)
                res(
                    data.Items.reduce(
                        (total, { lifeForce: debuffForce }) =>
                            total + debuffForce,
                        0,
                    ),
                )
            },
        )
    })
}

function putDebuff(id, value) {
    return new Promise((res, rej) => {
        dynamodb.put(
            {
                TableName: process.env.NAME_BATTLE_TABLE_NAME,
                Item: {
                    slack_id: id,
                    timestamp: Math.floor(Date.now() / 1000) + 5 * 60,
                    lifeForce: value,
                },
            },
            (err, data) => {
                if (err) return rej(err)
                res(data)
            },
        )
    })
}

exports.getTotalDebuffs = getTotalDebuffs
exports.putDebuff = putDebuff
