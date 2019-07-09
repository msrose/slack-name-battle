const crypto = require('crypto')

const {
    getMetadataDocumentBySlackId,
    updateMetadataDocumentBySlackId,
    incrementMetadataDocumentFieldsBySlackId,
    getAllMetadataDocuments,
} = require('./dynamodb')

async function didNameChange(slackId, name) {
    const { Item: item } = await getMetadataDocumentBySlackId(slackId, [
        'nameHash',
    ])
    const nameHash = crypto
        .createHash('md5')
        .update(name)
        .digest('hex')
    if (!item || !item.nameHash) {
        await updateMetadataDocumentBySlackId(slackId, nameHash)
        return false
    }
    const didChange = item.nameHash !== nameHash
    if (didChange) {
        await updateMetadataDocumentBySlackId(slackId, nameHash)
    }
    return didChange
}

function recordBattle(attackerId, targetId, isKill) {
    if (attackerId === targetId) {
        return incrementMetadataDocumentFieldsBySlackId(attackerId, [
            'suicides',
        ])
    }
    return Promise.all([
        incrementMetadataDocumentFieldsBySlackId(
            attackerId,
            ['attacks'].concat(isKill ? ['kills'] : []),
        ),
        incrementMetadataDocumentFieldsBySlackId(
            targetId,
            ['targeted'].concat(isKill ? ['deaths'] : []),
        ),
    ])
}

async function getStats(id) {
    const { Item: stats } = await getMetadataDocumentBySlackId(id)
    return stats || {}
}

async function getLeaderboard() {
    const { Items: allMetadata } = await getAllMetadataDocuments()
    return allMetadata
        .map(({ slack_id: slackId, kills = 0, deaths = 0 }) => ({
            slackId,
            ratio: kills / deaths,
        }))
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 5)
}

exports.didNameChange = didNameChange
exports.recordBattle = recordBattle
exports.getStats = getStats
exports.getLeaderboard = getLeaderboard
