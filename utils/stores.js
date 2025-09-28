import { remove } from 'lodash'

import { createPinia } from 'pinia'

export const pinia = createPinia();

const db = uniCloud.database()

export const useUserStore = defineStore('user', () => {
    const usersTable = db.collection('uni-id-users')
    const otherUsersTable = db.collection('other-user-info')
    // state
    const userInfo = ref(uni.getStorageSync('userInfo') || {})
    const otherUserInfo = ref({})

    // actions
    async function setUserInfo(data, _id) {
        if (_id) {
            try {

                const res = await usersTable.doc(_id).update(data)
                if (res.result.updated) {
                    uni.showToast({ title: '更新成功', icon: 'none', duration: 3000 })
                    Object.assign(userInfo.value, data)
                } else {
                    uni.showToast({ title: '没有改变', icon: 'none', duration: 3000 })
                }

            }
            catch (e) {
                console.error(e.message, e.errCode)
            }
        }
        else {
            Object.assign(userInfo.value, data)
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
export const useSpecialDaysStore = defineStore('specialDays', () => {
    // state
    const specialDays = ref(uni.getStorageSync('specialDays') || [])

    // actions
    async function setSpecialDays(data, status) {
        if (status === 'reset') {
            specialDays.value = data
        }
        else if (status === 'add' && specialDays.value.length < 100) {
            if (Array.isArray(data)) {
                specialDays.value.push(...data)
            } else {
                specialDays.value.push(data)
            }
        }
        else if (status === 'delete') {
            remove(specialDays.value, (item) => item._id === data._id)
            return
        }
        else if (status === 'update') {
            for (let i = 0; i < specialDays.value.length; i++) {
                if (specialDays.value[i]._id === data._id) {
                    specialDays.value[i] = data
                    break
                }
            }
        }
        uni.setStorageSync('specialDays', specialDays.value)

    }

    return {
        specialDays,
        setSpecialDays,
    }
})