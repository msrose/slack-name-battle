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
const update = util.promisify(dynamodb.update.bind(dynamodb))
const get = util.promisify(dynamodb.get.bind(dynamodb))

const BattleTableName = process.env.NAME_BATTLE_TABLE_NAME
const MetadataTableName = process.env.NAME_BATTLE_METADATA_TABLE_NAME

function getBattleDocumentsBySlackId(id) {
    const now = Math.floor(Date.now() / 1000)
    return query({
        TableName: BattleTableName,
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

function putBattleDocumentBySlackId(id, value, timestamp) {
    return put({
        TableName: BattleTableName,
        Item: {
            slack_id: id,
            timestamp,
            lifeForce: value,
        },
    })
}

function getMetadataDocumentBySlackId(id) {
    return get({
        TableName: MetadataTableName,
        Key: {
            slack_id: id,
        },
    })
}

function updateMetadataDocumentBySlackId(id, nameHash) {
    return update({
        TableName: MetadataTableName,
        Key: {
            slack_id: id,
        },
        UpdateExpression: 'set #nameHash = :nameHash',
        ExpressionAttributeNames: { '#nameHash': 'nameHash' },
        ExpressionAttributeValues: { ':nameHash': nameHash },
    })
}

exports.getBattleDocumentsBySlackId = getBattleDocumentsBySlackId
exports.putBattleDocumentBySlackId = putBattleDocumentBySlackId
exports.getMetadataDocumentBySlackId = getMetadataDocumentBySlackId
exports.updateMetadataDocumentBySlackId = updateMetadataDocumentBySlackId
