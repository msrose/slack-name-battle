const crypto = require('crypto')

const {
    getMetadataDocumentBySlackId,
    updateMetadataDocumentBySlackId,
} = require('./dynamodb')

async function didNameChange(slackId, name) {
    const { Item: item } = await getMetadataDocumentBySlackId(slackId)
    const nameHash = crypto
        .createHash('md5')
        .update(name)
        .digest('hex')
    if (!item) {
        await updateMetadataDocumentBySlackId(slackId, nameHash)
        return false
    }
    const didChange = item.nameHash !== nameHash
    if (didChange) {
        await updateMetadataDocumentBySlackId(slackId, nameHash)
    }
    return didChange
}

exports.didNameChange = didNameChange
