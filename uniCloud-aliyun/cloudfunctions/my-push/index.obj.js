// 云对象名：todo
module.exports = {
    async sendMessage(obj) {
        const uniPush = uniCloud.getPushManager({ appId: '__UNI__FE05989' }) //注意这里需要传入你的应用appId
        return await uniPush.sendMessage({
            push_clientid: obj.pushClientId,
            title: obj.title,
            content: obj.content,
            force_notification:true,
            payload: {
                event: obj.event,
            },
        })
    },
}
