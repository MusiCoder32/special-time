import { LunarType, SpecialDayType } from './emnu'
import { isLogin, saveSceneId } from './common'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash'


export const initStartDay = {
    start_time: dayjs().subtract(18, 'year').subtract(1, 'day').valueOf(),
    startType: 0,
    leap: true,
    end_time: dayjs().add(100, 'year').valueOf(),
    show_end_time: true,
}

export const initSpecialDay = [
    {
        name: '某某生日',
        time: dayjs().subtract(18, 'year').valueOf(),
        type: SpecialDayType['生日'],
        leap: false,
        lunar: LunarType['农历'],
    },
    {
        name: '国庆节',
        time: dayjs('1949-10-1').valueOf(),
        type: SpecialDayType['节日'],
        leap: false,
        lunar: LunarType['公历'],
    },
    {
        name: '元旦节',
        time: dayjs('1949-1-1').valueOf(),
        type: SpecialDayType['节日'],
        leap: false,
        lunar: LunarType['农历'],
    },
]

export async function loginAuto(e) {
    const db = uniCloud.database()
    console.log('开始自动登录', e)
    const { query } = e
    let inviteParams
    if (!isEmpty(query)) {

        const { inviteCode, userId, specialDayId, sceneId } = query
        inviteParams = { userId, specialDayId, sceneId }
        /**扫码进入的情况，无法直接获取userId, specialDayId, sceneId等信息，只有分享到聊天和朋友圈的情况才可以 */
        //代表扫码进入,邀请相关信息存在数据库中，需等待获取inviteCode再执行登录
        if (query.scene) {
            const scene = decodeURIComponent(query.scene)
            const scene_db = db.collection('scene')
            const sceneRes = await scene_db
                .where({
                    _id: scene,
                })
                .get()
            const sceneData = JSON.parse(sceneRes?.result?.data[0]?.details)
            //确认分享海报有效再执行
            if (sceneData) {
                uni.setStorageSync('sceneDetails', sceneRes?.result?.data[0]?.details)
                uni.$inviteCode = sceneData.inviteCode || '' //获取分享海报中的邀请码
                sceneData.sceneId = scene
                inviteParams = { sceneId: scene, userId: sceneData.userId, specialDayId: sceneData.specialDayId }
            } else {
                console.log('数据库中未查询到分享海报信息')
            }
        }
    }
    const time1 = +new Date()
    const { code } = await uni.login({
        provider: 'weixin',
        onlyAuthorize: true,
    })
    const time2 = +new Date()
    console.log('获取本次微信登录code耗时', time2 - time1)

    // 调用你自定义的云函数
    const time3 = +new Date()
    console.log('开始调用云函数时间', time3)
    const { result } = await uniCloud.callFunction({
        name: 'wx-login-self', // 你的云函数名
        data: { code, inviteCode: query }
    });

    console.log('login self', result)

    return result

}


// uni.$once('uni-id-pages-login-success', async () => {
//     await getStartEndTime()
//     if (!isLogin()) {
//         await initDay()
//         uni.setStorage({
//             key: 'setStartTip',
//             data: 2,
//         })
//     }
//     uni.$emit('getStartSuccess')
//     uni.$getStartSuccess = true
//     console.log('监听到登录成功')
//     if (uni.$inviteCode && inviteParams) {
//         saveSceneId(inviteParams) //统一在该处发放邀请新用户奖励
//     }
// })

async function initDay() {
    try {
        //提交数据
        uni.setStorageSync('startData', JSON.stringify(initStartDay))
        const db = uniCloud.database()
        db.collection('start-end-time').add(initStartDay)
        db.collection('special-days').add(initSpecialDay)
    } catch (e) {
        console.log(e)
    }
}

export async function getStartEndTime() {
    const db = uniCloud.database()
    try {
        const {
            result: { errCode, data },
        } = await db
            .collection('start-end-time')
            .where({
                user_id: db.getCloudEnv('$cloudEnv_uid'),
            })
            .get()

        if (errCode == 0) {
            if (data.length > 0) {
                const { start_time, startType, leap, end_time, show_end_time } = data[0]
                uni.setStorageSync(
                    'startData',
                    JSON.stringify({
                        start_time,
                        startType,
                        leap,
                    }),
                )
                uni.setStorageSync(
                    'endData',
                    JSON.stringify({
                        end_time,
                        show_end_time,
                    }),
                )
            }
        }
    } catch (e) {
        // loadingStatus.value = '加载失败，请退出小程序重试'
    }
}
