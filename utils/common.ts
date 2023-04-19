import { ref } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { omitBy, isNil } from 'lodash'

const db = uniCloud.database()

export function tipFactory(storage: string, showBool: ref<string>, closeFunctionName: ref<{ func: string }>) {
    return function () {
        return new Promise((resolve) => {
            if (!uni.getStorageSync(storage)) {
                showBool.value = 1
                uni.setStorage({
                    key: storage,
                    data: 1,
                })
                closeFunctionName.value.func = () => {
                    showBool.value = false
                    resolve()
                }
            } else {
                resolve()
            }
        })
    }
}

export function shareMessageCall(res) {
    console.log(res)
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentPath = currentPage.route
    return {
        title: '是时光丫',
        path: `${currentPath}?inviteCode=${
            store.userInfo.my_invite_code
        }&sceneId=onShareAppMessage_${+new Date()}&userId=${store.userInfo._id}`,
    }
}

export function saveSceneId(sceneDetails) {
    const { userId, _id, sceneId } = sceneDetails
    //如果导入用户分享的二维码时，二维码中的用户id与自身的邀请用户id一致，且inviter_scene_id为空
    //则视为该用户为该二维码引流的新用户，将二维码id写入当前用户信息中，以便后期分析用户来源
    //采取逻辑，则无需要uni-id-page中注册逻辑实现
    console.log(store)
    console.log(store.userInfo)
    if (store.userInfo.inviter_uid && store.userInfo.inviter_uid[0] === userId && !store.userInfo.inviter_scene_id) {
        const params = {
            inviter_special_day_id: _id, //用于后续统计分享日期数据
            inviter_scene_id: sceneId, //分享来源记录（海报id,群聊链接id,朋友圈id）
        }

        db.collection('uni-id-users').where("'_id' == $cloudEnv_uid").update(omitBy(params, isNil))
        //发放给邀请人
        inviterAward(userId)
    }
}
async function inviterAward(userId) {
    const uniScores = db.collection('uni-id-scores')
    try {
        const res = await uniScores
            .where({
                user_id: userId,
            })
            .field('balance')
            .orderBy('create_date desc')
            .limit(1)
            .get()
        let balance = 0
        try {
            balance = res.result.data[0].balance
        } catch (e) {}
        await uniScores.add({
            user_id: userId,
            balance: balance + 5,
            score: 5,
            type: 1,
            comment: '邀请新用户获得',
        })
    } catch (e) {
        console.log(e)
    }
}
