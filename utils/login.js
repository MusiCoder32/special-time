import { mutations } from '@/uni_modules/uni-id-pages/common/store'
import { LunarType, SpecialDayType } from '@/utils/emnu'
import { isLogin, saveSceneId } from '@/utils/common'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash'

export async function loginAuto(e) {
    // const db = uniCloud.database()
    console.log('开始自动登录', e)
    const { query } = e
    let inviteParams
    if (!isEmpty(query)) {
        const { inviteCode, userId, specialDayId, sceneId } = query
        uni.$inviteCode = inviteCode
        inviteParams = { userId, specialDayId, sceneId }
        //代表扫码进入,邀请相关信息存在数据库中，需等待获取inviteCode再执行登录
        if (query.scene) {
            const scene = decodeURIComponent(query.scene)
            console.log(query.scene, scene)
            const scene_db = db.collection('scene')
            const sceneRes = await scene_db
                .where({
                    _id: scene,
                })
                .get()
            const sceneData = JSON.parse(sceneRes?.result?.data[0]?.details)
            //确认分享海报有效再执行
            if (sceneData) {
                uni.$inviteCode = sceneData.inviteCode || '' //获取分享海报中的邀请码
                sceneData.sceneId = scene
                inviteParams = { sceneId: scene, userId: sceneData.userId, specialDayId: sceneData._id }
            } else {
                console.log('数据库中未查询到分享海报信息')
            }
        }
    }

    const res = await uni.login({
        provider: 'weixin',
        onlyAuthorize: true,
    })
    const params = { code: res.code }
    const uniIdCo = uniCloud.importObject('uni-id-co', {
        customUI: true,
    })
    const loginRes = await uniIdCo['loginByWeixin'](params)
    loginRes.showToast = false
    uni.$once('uni-id-pages-login-success', async () => {
        console.log('监听到登录成功')
        await getStartEndTime()
        if (uni.$inviteCode && inviteParams) {
            saveSceneId(inviteParams) //在非扫描海报的情况下，统一在该处发放邀请新用户奖励
        }
        if (!isLogin()) {
            await initDay()
            uni.setStorage({
                key: 'setStartTip',
                data: 2,
            })
        }
        uni.$emit('getStartSuccess')
    })
    mutations.loginSuccess(loginRes)
}

async function initDay() {
    try {
        //提交数据
        const params = {
            start_time: dayjs().subtract(18, 'year').valueOf(),
            startType: 0,
            leap: true,
            end_time: dayjs().add(100, 'year').valueOf(),
            show_end_time: true,
        }
        uni.setStorageSync('startData', JSON.stringify(params))
        const db = uniCloud.database()
        db.collection('start-end-time').add(params)
        db.collection('special-days').add([
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
        ])
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

        console.log(data)
        if (errCode == 0) {
            console.log(data.length)
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
