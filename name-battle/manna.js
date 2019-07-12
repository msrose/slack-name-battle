const {
    getBattleDocumentsBySlackId,
    putBattleDocumentBySlackId,
} = require('./dynamodb')

function useManna(id) {
    return putBattleDocumentBySlackId(
        id,
        0,
        Math.floor(Date.now() / 1000) + 2 * 60,
        1,
    )
}

async function getUsedManna(id) {
    const { Items: items } = await getBattleDocumentsBySlackId(id)
    return items.reduce((total, { manna = 0 }) => total + manna, 0)
}

module.exports = {
    useManna,
    getUsedManna,
}
