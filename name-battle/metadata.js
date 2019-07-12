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
    const {
        Items: allMetadata,
        ScannedCount: total,
    } = await getAllMetadataDocuments()
    const leaders = allMetadata
        .slice(0, 10)
        .map(({ slack_id: slackId, kills = 0, deaths = 0, suicides = 0 }) => ({
            slackId,
            ratio: kills / (deaths + suicides),
        }))
        .sort((a, b) => b.ratio - a.ratio)
    return {
        leaders,
        total,
    }
}

exports.didNameChange = didNameChange
exports.recordBattle = recordBattle
exports.getStats = getStats
exports.getLeaderboard = getLeaderboard
