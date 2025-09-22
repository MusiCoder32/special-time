// /uni_modules/uni-id-pages/common/store.js

const db = uniCloud.database()
const usersTable = db.collection('uni-id-users')
const otherUsersTable = db.collection('other-user-info')

export const useUserStore = defineStore('user', () => {
    // state
    const userInfo = ref(uni.getStorageSync('userInfo') || {})
    const otherUserInfo = ref({})

    // actions
    async function setUserInfo(data) {
        try {
            if (data) {
                const res = await usersTable.where('_id==$env.uid').update(data)
                if (res.result.updated) {
                    uni.showToast({ title: '更新成功', icon: 'none', duration: 3000 })
                    Object.assign(userInfo.value, data)
                } else {
                    uni.showToast({ title: '没有改变', icon: 'none', duration: 3000 })
                }
            } else {
                const res = await usersTable
                    .where("'_id' == $cloudEnv_uid")
                    .field('_id,mobile,nickname,username,email,avatar_file,my_invite_code,userType,inviter_scene_id,inviter_uid,role')
                    .get()
                Object.assign(userInfo.value, res.result.data[0])
            }
        } catch (e) {
            console.error(e.message, e.errCode)
        }

        uni.setStorageSync('userInfo', userInfo.value)
    }


async function setOtherUserInfo(data) {
    let updateSuccess = true
    try {
        let result = {}
        if (data) {
            result = data
            await otherUsersTable.where('user_id==$cloudEnv_uid').update(data)
        } else {
            const otherUserInfoRes = await otherUsersTable
                .where('user_id == $env.uid')
                .field('favorite_ground_id')
                .get()
            if (otherUserInfoRes.result.data.length) {
                result = otherUserInfoRes.result.data[0]
            } else {
                await otherUsersTable.add({})
            }
        }
        otherUserInfo.value = Object.assign({}, otherUserInfo.value, result)
    } catch (e) {
        console.log('更新其他用户信息失败', e)
        updateSuccess = false
    }
    return updateSuccess
}

return {
    userInfo,
    otherUserInfo,
    setUserInfo,
    setOtherUserInfo,
}
})