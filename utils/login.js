import { LunarType, SpecialDayType } from './emnu'
import dayjs from 'dayjs'
import { pinia } from './stores'

import { useSpecialDaysStore,useUserStore } from './stores'
const specialDaysStore = useSpecialDaysStore(pinia)
const userStore = useUserStore(pinia)




export const initStartDay = {
    start_time: dayjs().subtract(18, 'year').subtract(1, 'day').valueOf(),
    startType: 0,
    leap: true,
    end_time: dayjs().add(1000, 'year').valueOf(),
    show_end_time: true,
}
const year = dayjs().year()
export const initSpecialDay = [
    {
        name: '18岁生日',
        time: dayjs().subtract(18, 'year').valueOf(),
        type: SpecialDayType['生日'],
        leap: false,
        lunar: LunarType['农历'],
    },
    {
        name: '认识王先森',
        time: dayjs(year + '-1-1').valueOf(),
        type: SpecialDayType['纪念日'],
        leap: false,
        lunar: LunarType['公历'],
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
    {
        name: '中秋节',
        time: dayjs('1949-8-15').valueOf(),
        type: SpecialDayType['节日'],
        leap: false,
        lunar: LunarType['农历'],
    },
    {
        name: '七夕节',
        time: dayjs('1949-7-7').valueOf(),
        type: SpecialDayType['节日'],
        leap: false,
        lunar: LunarType['农历'],
    },
    {
        name: '重阳节',
        time: dayjs('1949-9-9').valueOf(),
        type: SpecialDayType['节日'],
        leap: false,
        lunar: LunarType['农历'],
    },
    {
        name: '端午节',
        time: dayjs('1949-5-5').valueOf(),
        type: SpecialDayType['节日'],
        leap: false,
        lunar: LunarType['农历'],
    },
    {
        name: '儿童节',
        time: dayjs('1949-6-1').valueOf(),
        type: SpecialDayType['节日'],
        leap: false,
        lunar: LunarType['公历'],
    },

]

export async function loginAuto(e) {
    console.log('开始自动登录', e)
    let result = { newUser: false, userInfo: {} }
    const { query } = e || {}
    const { userId: inviteUserId, specialDayId, sceneId, scene } = query

    // 1. 优先检查本地token是否有效
    const localToken = uni.getStorageSync('uni_id_token')
    const tokenExpired = uni.getStorageSync('uni_id_token_expired') || 0
    const localUserInfo = uni.getStorageSync('userInfo')
    
    // 如果token存在且未过期，且有本地用户信息，直接使用
    if (localToken && tokenExpired > Date.now() && localUserInfo && localUserInfo._id) {
        console.log('使用本地缓存的token和用户信息')
        userStore.setUserInfo(localUserInfo)
        await getStartEndTime()
        return { newUser: false, userInfo: localUserInfo }
    }

    /**扫码进入的情况，无法直接获取userId, specialDayId, sceneId等信息，只有分享到聊天和朋友圈的情况才可以 */
    //代表扫码进入,邀请相关信息存在数据库中，需等待获取inviteCode再执行登录
    let processedScene = scene
    if (scene) {
        processedScene = decodeURIComponent(scene)
    }

    // 2. token无效或不存在或无用户信息时，进行登录
    const res = await uni.login({
        provider: 'weixin',
        onlyAuthorize: true,
    })
    let code = res.code
    
    //调用wx-login-self，传入token和code
    const loginRes = await uniCloud.callFunction({
        name: 'wx-login-self', // 你的云函数名
        data: { 
            code, 
            scene: processedScene, 
            specialDayId, 
            sceneId, 
            inviteUserId,
            token: localToken // 传入本地token供云函数验证
        }
    });
    
    const { newUser, userInfo, token, tokenExpired: newTokenExpired } = loginRes.result
    
    // 3. 保存新的token和用户信息
    if (token) {
        uni.setStorageSync('uni_id_token', token)
        uni.setStorageSync('uni_id_token_expired', newTokenExpired)
    }
    if (userInfo) {
        uni.setStorageSync('userInfo', userInfo)
        userStore.setUserInfo(userInfo)
    }
    
    // 4. 处理新用户逻辑
    if (newUser) {
        specialDaysStore.setSpecialDays(initSpecialDay, 'reset')
        setStartAndEndTime(initStartDay)

        const db = uniCloud.database()
        db.collection('start-end-time').add(initStartDay)
        db.collection('special-days').add(initSpecialDay)
    } else {
        await getStartEndTime()
    }

    result = { newUser, userInfo }
    return result;
}

export async function getStartEndTime() {

    const startData = uni.getStorageSync('startData')
    const endData = uni.getStorageSync('endData')

    if (startData && endData) {
        return
    }

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
                setStartAndEndTime(data[0])
            }
        }
    } catch (e) {
        // loadingStatus.value = '加载失败，请退出小程序重试'
    }
}
function setStartAndEndTime(data) {
    const { start_time, startType, leap, end_time, show_end_time } = data
    uni.setStorageSync('startData', {
        start_time,
        startType,
        leap
    })
    uni.setStorageSync('endData', { end_time, show_end_time })
}