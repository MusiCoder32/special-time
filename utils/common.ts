import { ref } from 'vue'
import qs from 'qs'
import { SpecialDayType } from './emnu'
import { getAge, totalDay } from './getAge.js'
import dayjs from 'dayjs'
import { useUserStore } from './stores.js'
const store = useUserStore()

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

export function shareMessageCall(query: object = {},path) {
    let currentPath = path

    if(!path) {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
     currentPath = path || currentPage.route
    }


    const tempObj = {
        inviteCode: store.userInfo.value.my_invite_code,
        sceneId: `shareAppMessage_${+new Date()}`,
        userId: store.userInfo.value._id,
        nickname: store.userInfo.value.nickname,
    }
    return {
        title: '是时光丫',
        path: currentPath + '?' + qs.stringify(Object.assign(query, tempObj)),
    }
}
export function shareTimelineCall(query: object) {
    const tempObj = {
        inviteCode: store.userInfo.value.my_invite_code,
        sceneId: `shareTimeline_${+new Date()}`,
        userId: store.userInfo.value._id,
        nickname: store.userInfo.value.nickname,
    }

    return {
        query: qs.stringify(Object.assign(query, tempObj)),
    }
}


export async function inviterAward(userId, score, comment) {
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
            balance: balance + score,
            score: score,
            type: 1,
            comment,
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
    let cloudPath = store.userInfo.value._id + '' + Date.now()
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

export function shareBirthDay(data,isBirthDay) {
    const { time, lunar, leap, type, name, _id } = data
    let remainDay, normalTime
    if (type === SpecialDayType['提醒日']) {
        //提醒日交换remainDay与日期位置
        remainDay = dayjs(time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'days')
        if (remainDay < 0) {
            remainDay = `已经过了 ${-remainDay} 天`
        } else if (remainDay === 0) {
            remainDay = `今天是${SpecialDayType[type]}哦`
        } else {
            remainDay = `还有 ${remainDay} 天`
        }
        normalTime = dayjs(time).format('YYYY-MM-DD')
        let temp = normalTime
        normalTime = remainDay
        remainDay = temp
    } else {
        const ageObj = getAge(time, lunar, leap)
        const { allDay, cYear, cMonth, cDay, lYear, IMonthCn, IDayCn, aYear, oneBirthTotalDay } = ageObj
        remainDay = ageObj.remainDay
        if (type === SpecialDayType['生日']) {
            //如果分享时选择生日
            if (isBirthDay) {
                //生日隐藏年份
                if (!lunar) {
                    normalTime = `${cMonth}-${cDay}`
                } else {
                    normalTime = `${IMonthCn}${IDayCn}`
                }
                if (remainDay === 0) {
                    remainDay = `今天是${SpecialDayType[type]}哦`
                } else {
                    remainDay = `还有 ${remainDay} 天`
                }
            } else {
                //如果分享时选择年龄
                //如果年龄大于0,则以岁数显示，否则以天数显示，将计算值赋于remainDay
                if (aYear > 0) {
                    // 将打开app时记录的日期，在setInterval外获取，解决用户在晚上12点前打开，一直停留到该页面过12点，导致currentDayFloat计算错误
                    const openAppDay = dayjs().format('YYYY-MM-DD 00:00:00') //
                    let currentDayFloat = dayjs().diff(openAppDay, 'day', true)
                    //生日当天remainDay为0,做无需ayear+1
                    if (remainDay === 0) {
                        remainDay = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(2) + ' 岁'
                    } else {
                        remainDay = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(2) + ' 岁'
                    }
                } else {
                    remainDay = `${allDay} 天`
                }
            }
        } else {
            if (!lunar) {
                normalTime = `${cYear}-${cMonth}-${cDay}`
            } else {
                normalTime = `${lYear} ${IMonthCn}${IDayCn}`
            }
            remainDay = `第 ${totalDay(time)} 天`
        }
    }

    const obj = {
        label: SpecialDayType[type] === '生日' && isBirthDay ? name + SpecialDayType[type] : name,
        value: remainDay,
        unit: normalTime,
    }
    //data中可能存在多张图片对像，故改为storage传递
    uni.setStorageSync('shareDetails', JSON.stringify(data))

    uni.navigateTo({
        url: '/pages/home/poster-setting?data=' + JSON.stringify(obj),
    })
}

