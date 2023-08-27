'use strict'
const openapi = require('mp-cloud-openapi')

const openapiWeixin = openapi.initWeixin({
    appId: 'wxaa7dc591ce7b3ea0',
    secret: 'ff481854d47c9dfcb93528231464ab21',
})

async function getAccessToken() {
    try {
        const { accessToken, expiresIn, errCode, errMsg } = await openapiWeixin.auth.getAccessToken()
        if (errCode == 0) {
            return {
                accessToken,
                expiresIn,
                errCode,
                errMsg,
            }
        }
    } catch (e) {
        console.log(e)
    }
    return {}
}

exports.main = async (event, context) => {
    console.log('执行小程序码获取方法')
    const { scene, page } = event

    try {
        const { accessToken, expiresIn, errCode, errMsg } = await getAccessToken()

        if (errCode == 0) {
            return await openapiWeixin.wxacode.getUnlimited({
                accessToken,
                page,
                scene,
                width: 280,
            })
        } else {
            return { accessToken, expiresIn, errCode, errMsg }
        }
    } catch (err) {
        return err
    }
}
