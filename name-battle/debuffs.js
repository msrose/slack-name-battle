const { getDocumentsBySlackId, putDocumentBySlackId } = require('./dynamodb')

async function getTotalDebuffs(id) {
    const debuffs = await getDocumentsBySlackId(id)
    return debuffs.Items.reduce(
        (total, { lifeForce: debuffForce }) => total + debuffForce,
        0,
    )
}

function putDebuff(id, value) {
    return putDocumentBySlackId(
        id,
        value,
        Math.floor(Date.now() / 1000) + 5 * 60,
    )
}

exports.getTotalDebuffs = getTotalDebuffs
exports.putDebuff = putDebuff
