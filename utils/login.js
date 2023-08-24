import { mutations, store } from '@/uni_modules/uni-id-pages/common/store'
import { isLogin } from '@/utils/common'

export async function loginAuto() {
    console.log('开始自动登录')
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
        uni.$emit('getStartSuccess')
    })
    mutations.loginSuccess(loginRes)
}

export async function getStartEndTime() {
    const db = uniCloud.database();
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
