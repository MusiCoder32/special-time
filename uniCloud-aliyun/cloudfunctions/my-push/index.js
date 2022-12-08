'use strict'
exports.main = async (event, context) => {
    console.log(event)
    const uniPush = uniCloud.getPushManager({ appId: '__UNI__FE05989' }) //注意这里需要传入你的应用appId
    await uniPush.sendMessage({
        user_id: ['63885162c7989d000164fb38', '637b5646b653d60001700cb5', '637b5321865697000160649c'],
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
