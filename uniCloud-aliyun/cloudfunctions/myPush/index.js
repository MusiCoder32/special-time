'use strict'

const calendar = require('calendar')
const openapi = require('mp-cloud-openapi')

const openapiWeixin = openapi.initWeixin({
    appId: 'wx4a5ed7f7fc719f98',
    secret: 'd84b16d5dae43c848d7260e4d6e22159',
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
    const nextDay8 = getOffsetDate(new Date().getTime() + oneDayTime)
    const specialDay8 = getOffsetDate(time)


    if (type === 2) {
        const remain = time - currentDay
        obj.isSendMessage = remain > 0 && remain < oneDayTime
        obj.time = `${specialDay8.getFullYear()}年${specialDay8.getMonth() + 1}月${specialDay8.getDate()}日`
    } else {
        if (!lunar) {
            const month = specialDay8.getMonth()
            const date = specialDay8.getDate()
            obj.isSendMessage =
              nextDay8.getMonth() === month && nextDay8.getDate() === date
            obj.time = `${specialDay8.getFullYear()}年${month + 1}月${date}日`
        } else {
            const { cYear, cMonth, cDay } = calendar.lunar2solar(
                currentDay8.getFullYear(),
                currentDay8.getMonth() + 1,
                currentDay8.getDate(),
            )
            obj.isSendMessage =
                cYear === nextDay8.getFullYear() && cMonth === nextDay8.getMonth() + 1 && cDay === nextDay8.getDate()

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

        if (subscribed && isSendMessage) {
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
                        miniprogramState: 'formal', //trial为体验版；formal为正式版
                    })
                    console.log('消息发送结果', sendRes)
                    console.log({ subscribed, isSendMessage, name, type, time })
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
    dbJQL.setUser({
        // 指定后续执行操作的用户信息，此虚拟用户将同时拥有传入的uid、role、permission
        role: ['admin'], // 指定当前执行用户的角色为admin。如果只希望指定为admin身份，可以删除uid和permission节点
    })
    await getSpecialDay(0)
    return {}
}
