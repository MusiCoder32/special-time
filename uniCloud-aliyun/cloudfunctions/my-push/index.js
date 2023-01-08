'use strict'
exports.main = async (event, context) => {
    console.log(event)
    const uniPush = uniCloud.getPushManager({ appId: '__UNI__FE05989' }) //注意这里需要传入你的应用appId
    await uniPush.sendMessage({
        user_id: ['63a57535daf2ed00015afd3b'],
        title: '我的第一次消息推送223332222',
        content: '是时光丫测试功能开发中...'+ new Date().getMinutes(),
        force_notification: true,
        payload: {
            event: 'alert',
            specialDayId: '1234',
        },
    })
	return {}
}
