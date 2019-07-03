const crypto = require('crypto')

function getRandomNumber(max) {
    return Math.floor(Math.random() * max)
}

function getSignature(timestamp, body) {
    const basestring = `v0:${timestamp}:${body}`
    const signature = `v0=${crypto
        .createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
        .update(basestring)
        .digest('hex')}`
    return signature
}

function isRequestSignatureValid(timestamp, body, requestSignature) {
    const signature = getSignature(timestamp, body)
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(requestSignature),
    )
}

function logError(err) {
    console.log(err)
}

exports.getRandomNumber = getRandomNumber
exports.getSignature = getSignature
exports.isRequestSignatureValid = isRequestSignatureValid
exports.logError = logError
