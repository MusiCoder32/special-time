'use strict'

const calendar = require('calendar')
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
        obj.time = `${specialDay.getFullYear()}年${specialDay.getMonth() + 1}月${specialDay.getDate()}日`
    } else {
        if (!lunar) {
            obj.isSendMessage =
                nextDay.getMonth() === specialDay.getMonth() && nextDay.getDate() === specialDay.getDate()
            obj.time = `${specialDay.getFullYear()}年${specialDay.getMonth() + 1}月${specialDay.getDate()}日`
        } else {
            const { cYear, cMonth, cDay } = calendar.lunar2solar(
                currentDay.getFullYear(),
                specialDay.getMonth() + 1,
                specialDay.getDate(),
            )
            obj.isSendMessage =
                cYear === nextDay.getFullYear() && cMonth === nextDay.getMonth() + 1 && cDay === nextDay.getDate()

            obj.time = `${cYear}年${cMonth}月${cDay}日`
        }
    }
    return obj
}

exports.main = async (event, context) => {
	console.log(1234123)
	console.log(event)
	console.log(context)
    const dbJQL = uniCloud.databaseForJQL({
        event,
        context,
    })
    // const specialDayArr = await dbJQL.collection('special-days').get()

    const testData = {
        code: 0,
        errCode: 0,
        message: '',
        errMsg: '',
        systemInfo: [],
        affectedDocs: 1,
        data: [
            {
                _id: '63bf6410c7989d00016b2f1e',
                type: 2,
                lunar: 0,
                leap: false,
                subscribed: true,
                name: '测试提醒日',
                time: 1673539200000,
                user_id: '63a57535daf2ed00015afd3b',
            },
        ],
    }

    const specialDay = testData.data[0]
    const { user_id, _id, subscribed } = specialDay
    const { name, type, time, isSendMessage } = getDayDetails(specialDay)
    console.log({ isSendMessage, name, type, time })

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
                console.log('消息发送结果',sendRes)
            } else {
                console.log({ accessToken, expiresIn, errCode, errMsg })
            }
        } catch (err) {
            console.log(err)
        }
    }
    return { name, type, time, isSendMessage }
}
