const {
    getBattleDocumentsBySlackId,
    putBattleDocumentBySlackId,
} = require('./dynamodb')

async function getTotalDebuffs(id) {
    const debuffs = await getBattleDocumentsBySlackId(id)
    return debuffs.Items.reduce(
        (total, { lifeForce: debuffForce = 0 }) => total + debuffForce,
        0,
    )
}

function putDebuff(id, value, duration = 5) {
    return putBattleDocumentBySlackId(
        id,
        value,
        Math.floor(Date.now() / 1000) + duration * 60,
    )
}

module.exports = {
    getTotalDebuffs,
    putDebuff,
}
