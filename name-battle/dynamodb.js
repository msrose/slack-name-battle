const aws = require('aws-sdk')
const util = require('util')

const dynamodbOptions = {
    region: process.env.AWS_REGION || 'us-east-1',
}

if (process.env.AWS_SAM_LOCAL) {
    dynamodbOptions.endpoint = 'http://dynamodb:8000'
}

const dynamodb = new aws.DynamoDB.DocumentClient(dynamodbOptions)

const query = util.promisify(dynamodb.query.bind(dynamodb))
const put = util.promisify(dynamodb.put.bind(dynamodb))

const TableName = process.env.NAME_BATTLE_TABLE_NAME

function getDocumentsBySlackId(id) {
    const now = Math.floor(Date.now() / 1000)
    return query({
        TableName,
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
    })
}

function putDocumentBySlackId(id, value, timestamp) {
    return put({
        TableName,
        Item: {
            slack_id: id,
            timestamp,
            lifeForce: value,
        },
    })
}

exports.getDocumentsBySlackId = getDocumentsBySlackId
exports.putDocumentBySlackId = putDocumentBySlackId
