import { LunarType, SpecialDayType } from './emnu'
import dayjs from 'dayjs'


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

export async function loginAuto(e, _id) {
    console.log('开始自动登录', e)
    const result = { _id }
    const { query } = e || {}
    const { userId: inviteUserId, specialDayId, sceneId, scene } = query

    /**扫码进入的情况，无法直接获取userId, specialDayId, sceneId等信息，只有分享到聊天和朋友圈的情况才可以 */
    //代表扫码进入,邀请相关信息存在数据库中，需等待获取inviteCode再执行登录
    if (scene) {
        scene = decodeURIComponent(scene)
    }
    let code
    if (!_id) {
        const res = await uni.login({
            provider: 'weixin',
            onlyAuthorize: true,
        })``
        code = res.code
        //调用wx-login-self，若为新用户，则创建用户，发放邀请奖励
        //若非新用户，wx-login-self里获取完整用户信息
        const { code, newUser, userInfo } = await uniCloud.callFunction({
            name: 'wx-login-self', // 你的云函数名
            data: { code, inviteCode, scene, specialDayId, sceneId, inviteUserId }
        });
        if (code != 0) {
            return { code, msg: '登录失败' }
        }
        if (newUser) {
            //新用户，初始化数据
            await initDay()
        } else {
            await getStartEndTime()
        }
        result = userInfo
    } else {
        //调用wx-login-self，仅更新最后登录时间和ip
        uniCloud.callFunction({
            name: 'wx-login-self', // 你的云函数名
            data: { _id }
        });
    }

    return result;

}




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

export async function getStartEndTime(userId) {
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
