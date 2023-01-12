'use strict'

const calendar = require('calendar')
const openapi = require('mp-cloud-openapi')

const openapiWeixin = openapi.initWeixin({
    appId: 'wxaa7dc591ce7b3ea0',
    secret: 'ff481854d47c9dfcb93528231464ab21',
})

function getOffsetDate(time) {
    return new Date((time || Date.now()) + (new Date().getTimezoneOffset() + (8 || 0) * 60) * 60000)
}

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
    const currentDay8 = getOffsetDate()
    const nextDay = new Date(new Date().getTime() + oneDayTime)
    const specialDay = new Date(time)
    const specialDay8 = getOffsetDate(time)

    if (type === 2) {
        const remain = time - currentDay
        obj.isSendMessage = remain > 0 && remain < oneDayTime
        obj.time = `${specialDay8.getFullYear()}年${specialDay8.getMonth() + 1}月${specialDay8.getDate()}日`
    } else {
        if (!lunar) {
            obj.isSendMessage =
                nextDay.getMonth() === specialDay.getMonth() && nextDay.getDate() === specialDay.getDate()
            obj.time = `${specialDay8.getFullYear()}年${specialDay8.getMonth() + 1}月${specialDay8.getDate()}日`
        } else {
            const { cYear, cMonth, cDay } = calendar.lunar2solar(
                currentDay8.getFullYear(),
                currentDay8.getMonth() + 1,
                currentDay8.getDate(),
            )
            obj.isSendMessage =
                cYear === nextDay.getFullYear() && cMonth === nextDay.getMonth() + 1 && cDay === nextDay.getDate()

            obj.time = `${cYear}年${cMonth}月${cDay}日`
        }
    }
    return obj
}

let dbJQL
async function getSpecialDay(count) {
    const specialDayArr = await dbJQL.collection('special-days').skip(count).limit(100).get()
    for (let i = 0; i < specialDayArr.data.length; i++) {
        const specialDay = specialDayArr.data[i]
        const { user_id, _id, subscribed } = specialDay
        const { name, type, time, isSendMessage } = getDayDetails(specialDay)
        console.log({ subscribed, isSendMessage, name, type, time })
        if (subscribed && isSendMessage) {
            dbJQL.setUser({
                // 指定后续执行操作的用户信息，此虚拟用户将同时拥有传入的uid、role、permission
                role: ['admin'], // 指定当前执行用户的角色为admin。如果只希望指定为admin身份，可以删除uid和permission节点
            })

            const userRes = await dbJQL
                .collection('uni-id-users')
                .where({
                    _id: user_id,
                })
                .field('wx_openid')
                .get()
            const openid = userRes.data[0].wx_openid.mp
            try {
                const accessRes = await getAccessToken()
                const { accessToken, expiresIn, errCode, errMsg } = accessRes
                if (errCode == 0) {
                    const sendRes = await openapiWeixin.subscribeMessage.send({
                        accessToken,
                        touser: openid,
                        page: 'pages/home/loading?importantId=' + _id,
                        lang: 'zh_CN',
                        data: {
                            thing1: {
                                value: type === 1 ? name + '生日' : name,
                            },
                            time2: {
                                value: time,
                            },
                            thing3: {
                                value: '明天是个重要的日子',
                            },
                        },
                        templateId: 'BPJmCOQ_K1Qek_LCOgwekWhJ6jaZ6F2To2LmtfEZFSI',
                        miniprogramState: 'developer', //trial为体验版；formal为正式版
                    })
                    console.log('消息发送结果', sendRes)
                    dbJQL.collection('special-days').doc(_id).update({
                        subscribed: false,
                    })
                } else {
                    console.log({ accessToken, expiresIn, errCode, errMsg })
                }
            } catch (err) {
                console.log(err)
            }
        }
    }
    if (specialDayArr.data.length === 100) {
        await getSpecialDay(count + 100)
    }
}

exports.main = async (event, context) => {
    dbJQL = uniCloud.databaseForJQL({
        event,
        context,
    })
    await getSpecialDay(0)
    return {}
}
