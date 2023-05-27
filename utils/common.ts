import { ref } from 'vue'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { isNil, omitBy } from 'lodash'

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

export function shareMessageCall() {
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
export function shareTimelineCall() {
    return {
        query: `inviteCode=${store.userInfo.my_invite_code}&sceneId=onShareTimeline_${+new Date()}&userId=${
            store.userInfo._id
        }`,
    }
}

export function saveSceneId(sceneDetails) {
    const { userId, _id, sceneId } = sceneDetails
    //如果导入用户分享的二维码时，二维码中的用户id与自身的邀请用户id一致，且inviter_scene_id为空
    //则视为该用户为该二维码引流的新用户，将二维码id写入当前用户信息中，以便后期分析用户来源
    //采取逻辑，则无需要uni-id-page中注册逻辑实现
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

export async function chooseImage() {
    let result = ''
    if (uni.$mpVersion >= '2.21.0') {
        const imgRes = await uni.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
        })
        result = imgRes.tempFiles[0].tempFilePath
    } else {
        const imgRes = await uni.chooseImage({
            count: 1,
            sizeType: 'original',
            sourceType: 'album',
        })
        result = imgRes.tempFilePaths[0]
    }
    return result
}

function editImage(imgSrc: string) {
    return new Promise((resolve, reject) => {
        if (uni.$mpVersion >= '2.22.0') {
            wx.editImage({
                src: imgSrc,
                success(res) {
                    resolve(res.tempFilePath)
                },
                fail(e) {
                    reject(e)
                },
            })
        }
    })
}

export async function uniCloudUploadImage(imgSrc: string) {
    //上传到服务器
    let fileID
    let cloudPath = store.userInfo._id + '' + Date.now()
    try {
        uni.showLoading({
            title: '上传中',
            mask: true,
        })
        let res = await uniCloud.uploadFile({
            filePath: imgSrc,
            cloudPath,
            fileType: 'image',
        })
        fileID = res.fileID
    } catch (e) {
        console.error(e)
    }
    uni.hideLoading()
    return fileID
}

export async function selectEditImage() {
    const selectImagePath = await chooseImage()
    const editImagePath = await editImage(selectImagePath)
    return editImagePath
}

export async function selectEditUploadImage() {
    const selectImagePath = await chooseImage()
    const editImagePath = await editImage(selectImagePath)
    const uniCloudImagePath = await uniCloudUploadImage(editImagePath)
    return uniCloudImagePath
}

export async function getUniCloudFile(fileList) {
    const res = await uniCloud.getTempFileURL({
        fileList,
    })
    return res.fileList[0].tempFileURL
}

export async function toLogin() {
    const modalRes = await uni.showModal({
        title: '提示',
        content: '是否前往引导页使用完整功能',
    })
    console.log(modalRes)
    if (modalRes.confirm) {
        uni.redirectTo({
            url: '/pages/home/guide',
        })
    }
}
export function isLogin() {
    const startData = uni.getStorageSync('startData')
    return !!startData
}
