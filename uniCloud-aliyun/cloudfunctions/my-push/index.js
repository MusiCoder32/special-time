'use strict'
// exports.main = async (event, context) => {
// 	console.log('定时任务执行')
//     console.log(event)
//     const uniPush = uniCloud.getPushManager({ appId: '__UNI__FE05989' }) //注意这里需要传入你的应用appId
//     await uniPush.sendMessage({
//         user_id: ['63a57535daf2ed00015afd3b', '637b5646b653d60001700cb5', '637b5321865697000160649c'],
//         title: '我的第一次消息推送223332222',
//         content: '是时光丫测试功能开发中...'+ new Date().getMinutes(),
//         force_notification: true,
//         payload: {
//             event: 'alert',
//             specialDayId: '1234',
//         },
//     })
// 	return {}
// }



const calendar = require('calendar')
const openapi = require('mp-cloud-openapi')
const { lunar2solar } = require('../../../utils/calendar')

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

//获取重要日详情
function getDayDetails(dayDetails) {
    const { name, type, lunar, time } = dayDetails

    //纪念日0,生日1,提醒日2

    const obj = { name, type }
    const oneDayTime = 24 * 60 * 60 * 1000
    const currentDay = new Date()
    const nextDay = new Date(new Date().getTime() + oneDayTime)
    const specialDay = new Date(time)
    if (type === 2) {
        const remain = time - currentDay
        obj.isSendMessage = remain > 0 && remain < oneDayTime
        obj.time = `${currentDay.getFullYear()}-${currentDay.getMonth() + 1}-${currentDay.getDate()}`
    } else {
        if (!lunar) {
            obj.isSendMessage =
                nextDay.getMonth() === specialDay.getMonth() && nextDay.getDate() === specialDay.getDate()
            obj.time = `${specialDay.getFullYear()}-${specialDay.getMonth() + 1}-${specialDay.getDate()}`
        } else {
            const { cYear, cMonth, cDay } = lunar2solar(
                currentDay.getFullYear(),
                specialDay.getMonth() + 1,
                specialDay.getDate(),
            )
            obj.isSendMessage =
                cYear === nextDay.getFullYear() && cMonth === nextDay.getMonth() + 1 && cDay === nextDay.getDate()

            obj.time = `${cYear}-${cMonth}-${cDay}`
        }
    }
    return obj
}

exports.main = async (event, context) => {
	
    const uniPush = uniCloud.getPushManager({ appId: '__UNI__FE05989' }) //注意这里需要传入你的应用appId
    await uniPush.sendMessage({
        user_id: ['63a57535daf2ed00015afd3b', '637b5646b653d60001700cb5', '637b5321865697000160649c'],
        title: '我的第一次消息推送223332222',
        content: '是时光丫测试功能开发中...'+ new Date().getMinutes(),
        force_notification: true,
        payload: {
            event: 'alert',
            specialDayId: '1234',
        },
    })
	
    const dbJQL = uniCloud.databaseForJQL({
        event,
        context,
    })
    // const specialDayArr = await dbJQL.collection('special-days').get()

    const specialDay = {
        _id: '63a94c8ba8993700015055f5',
        type: 1,
        lunar: 1,
        leap: false,
        name: '宝宝',
        time: 657648000000,
        user_id: '63a57535daf2ed00015afd3b',
        sort: 0,
        update_date: 1673107418977,
        subscribed: true,
    }
    const { user_id, _id, subscribed } = specialDay
    const { name, type, time, isSendMessage } = getDayDetails(specialDay)
    console.log({ name, type, time, isSendMessage })

    if (isSendMessage && subscribed) {
        const { result } = await dbJQL
            .collection('uni-uni-id-users')
            .where({
                _id: user_id,
            })
            .field('wx_openid')
            .get()
        console.log(result)
        const openid = result.wx_openid.mp
        console.log('openid:' + openid)
        try {
            const { accessToken, expiresIn, errCode, errMsg } = await getAccessToken()
            if (errCode == 0) {
                const sendRes = await openapiWeixin.subscribeMessage.send({
                    touser: openid,
                    page: 'pages/home/loading?importantId=' + _id,
                    lang: 'zh_CN',
                    data: {
                        thing1: {
                            value: type,
                        },
                        date7: {
                            value: time,
                        },
                        thing6: {
                            value: name,
                        },
                    },
                    templateId: 'YCUygKSwPe-WwjScDVqArfbDgM6ZNmFXqg_S09wLwzc',
                    miniprogramState: 'developer', //trial为体验版；formal为正式版
                })
                console.log(sendRes)
            } else {
                console.log({ accessToken, expiresIn, errCode, errMsg })
            }
        } catch (err) {
            console.log(err)
        }
    }
	return {}
}


