<template>
    <view class="w100 h100 p-r">
        <hch-poster v-show="showCanvas" ref="hchPoster" :mask="mask" :posterData="posterData" />

        <uni-popup @maskClick="maskClick" type="center" ref="popup">
            <view class="block-box h-start-center f-wrap">
                <view
                    v-for="(item, index) in PosterColorArr"
                    :key="index"
                    :style="'background:' + item"
                    class="block-item mr30 mb30"
                    @click="posterImgSelect(item)"
                ></view>
            </view>
        </uni-popup>

        <uni-popup @maskClick="maskClick" type="center" ref="imgPopRef">
            <scroll-view class="poster-select-box p20" scroll-y>
                <view class="t-center f32 mb20">背景选择</view>
                <view class="h-start-center f-wrap">
                    <view v-for="(item, index) in posterImageArr" class="poster-item h-center mb20">
                        <view class="poster-item-size bg-white br20">
                            <image
                                :key="item.uuid"
                                :src="item.url"
                                mode="aspectFill"
                                class="br20 w100 h100"
                                @click="posterImgSelect(item.url)"
                            ></image>
                        </view>
                    </view>
                    <view class="poster-item h-center mb20">
                        <view @click="changeImage" class="poster-item-size h-center bg-white br20">
                            <uni-icons type="camera" size="60" color="#ccc"></uni-icons>
                        </view>
                    </view>
                </view>
            </scroll-view>
        </uni-popup>

        <uni-fab
            ref="fab"
            :show="true"
            :content="content"
            horizontal="right"
            direction="horizontal"
            @trigger="trigger"
            @fabClick="fabClick"
        />
    </view>
</template>

<script setup>
import HchPoster from '/components/hch-poster/hch-poster.vue'
import { computed, nextTick, ref } from 'vue'
import PosterColorArr from './poster-color-arr'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { onLoad } from '@dcloudio/uni-app'

import { debounce } from 'lodash'
import { selectEditImage } from '@/utils/common'

const mask = ref(false)

const popup = ref()
const imgPopRef = ref()

// 海报模板数据
const posterData = ref({
    poster: {
        //根据屏幕大小自动生成海报背景大小
        url: '', //图片地址
        r: 10, //圆角半径
        w: 300, //海报宽度
        h: 480, //海报高度
        p: 20, //海报内边距padding
    },
    mainImg: {
        //海报主商品图
        // url: 'https://huangchunhongzz.gitee.io/imgs/poster/product.png', //图片地址
        url: '',
        r: 10, //圆角半径
        w: 150, //宽度
        h: 150, //高度
    },
    codeImg: {
        //小程序码
        url: '', //图片地址
        w: 80, //宽度
        h: 80, //高度
        mt: 20, //margin-top
        r: 40, //圆角半径
    },
    title: {
        //商品标题
        text: [], //文本
        fontSize: 20, //字体大小
        color: '#fff', //颜色
        lineHeight: 25, //行高
        mt: 35, //margin-top
        align: 'center',
    },
    tips: [
        //提示信息
        {
            text: '长按/扫描获取更多信息', //文本
            fontSize: 12, //字体大小
            color: '#fff', //字体颜色
            align: 'center', //对齐方式
            lineHeight: 25, //行高
            mt: 30, //margin-top
            mb: 20, //margin-top
        },
    ],
})

const hchPoster = ref(null)
const showCanvas = ref(true)

const posterImageArr = ref([])

const userInfo = computed(() => {
    return store.userInfo
})

const content = ref([
    {
        iconPath: '/static/file.png',
        selectedIconPath: '/static/file-active.png',
        text: '相册',
        active: false,
    },
    {
        iconPath: '/static/block.png',
        selectedIconPath: '/static/block-active.png',
        text: '色块',
        active: false,
    },
    {
        iconPath: '/static/avatar.png',
        selectedIconPath: '/static/avatar-active.png',
        text: '头像',
        active: false,
    },
    {
        iconPath: '/static/star.png',
        selectedIconPath: '/static/star-active.png',
        text: '保存',
        active: false,
    },
])

const db = uniCloud.database()

onLoad((e) => {
    console.log(e)
    openPost(JSON.parse(e.data))
})

function maskClick() {
    showCanvas.value = true
}

function posterImgSelect(url) {
    showCanvas.value = true
    popup.value.close()
    imgPopRef.value.close()
    posterData.value.poster.url = url
    nextTick(() => {
        hchPoster.value.posterShow()
    })
}

async function changeAvatar() {
    let confirmText = '选择照片'
    let cancelText = '默认头像'
    if (posterData.value.mainImg.url) {
        cancelText = '隐藏头像'
        posterData.value.mainImg.url = ''
    } else {
        posterData.value.mainImg.url = userInfo.value.avatar_file.url
    }
    const modelRes = await uni.showModal({
        title: '头像设置',
        confirmText,
        cancelText,
    })
    if (modelRes.confirm) {
        posterData.value.mainImg.url = await selectEditImage()
        nextTick(() => {
            hchPoster.value.posterShow()
        })
    } else {
        nextTick(() => {
            hchPoster.value.posterShow()
        })
    }
}

async function changeImage() {
    posterData.value.poster.url = await selectEditImage()
    nextTick(() => {
        hchPoster.value.posterShow()
    })
}

const trigger = debounce(function (e) {
    const index = e.index
    content.value[index].active = true

    if (index === 2) {
        changeAvatar()
    }
    if (index === 0) {
        if (posterImageArr.value.length > 0) {
            showCanvas.value = false
            imgPopRef.value.open()
        } else {
            changeImage()
        }
    } else if (index === 1) {
        showCanvas.value = false
        popup.value.open()
    } else if (index === 3) {
        save()
    }

    setTimeout(() => {
        content.value[index].active = false
    }, 500)
}, 200)

function fabClick(e) {
    console.log(e)
}

async function openPost(obj) {
    const { value, label, unit } = obj
    let shareDetails = {}
    try {
        shareDetails = JSON.parse(uni.getStorageSync('shareDetails'))
        posterImageArr.value = shareDetails?.poster || []
    } catch (e) {
        console.log(e)
    }
    // posterData.value.tips[1].text = `获取分享的${SpecialDayType[shareDetails.type]}信息`
    const sceneUpdateValue = 'a' //发版后替换，可重置用户本地缓存的小程序码，让用户重新获取小程序码
    let _id = sceneUpdateValue + shareDetails?._id
    const arr = []
    if (label) {
        const obj = {
            value: label + '',
            color: 'white',
            mt: 25,
            fontSize: 16,
        }
        arr.push(obj)
    }
    //橙色
    if (value) {
        const obj = {
            value: value + '',
            color: '#fc9255',
            mt: 34,
            fontSize: 20,
        }
        arr.push(obj)
    }
    if (unit) {
        const obj = {
            value: unit + '',
            color: 'white',
            mt: 30,
            fontSize: 16,
        }
        arr.push(obj)
    }
    posterData.value.title.text = arr
    const i = Math.floor(Math.random() * PosterColorArr.length)
    posterData.value.poster.url = PosterColorArr[i]
    const avatarUrl = userInfo.value?.avatar_file?.url || ''
    posterData.value.mainImg.url = shareDetails.avatar?.url || avatarUrl
    if (!avatarUrl) {
        const modalRes = await uni.showModal({
            title: '头像还未设置哦',
            confirmText: '立即设置',
        })
        if (modalRes.confirm) {
            return uni.redirectTo({
                url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo',
            })
        }
    }

    // let codeImgUrl = '/static/mini-code.jpg'
    uni.showLoading({ mask: true })
    try {
        let filePath = uni.getStorageSync(sceneUpdateValue + _id)
        //如果本地缓存,使用缓存的小程序码，若没有，调用云函数生成小程序码buffer，再转成图片
        if (filePath) {
            posterData.value.codeImg.url = filePath
            nextTick(() => {
                hchPoster.value.posterShow()
            })
        } else {
            const sceneParams = {}
            sceneParams.userId = userInfo.value?._id
            sceneParams.inviteCode = userInfo.value?.my_invite_code
            sceneParams.nickname = userInfo.value?.nickname || 'momo'
            sceneParams.specialDayType = shareDetails.type
            sceneParams.name = shareDetails.name
            sceneParams.specialDayId = shareDetails._id

            // scene长度有限，无法传输较多数据，故将其上传到服务器，然后将其id写入二维码中，然后通过id去服务器查询所要传递数据
            const scene_db = db.collection('scene')
            const sceneRes = await scene_db.add({
                details: JSON.stringify(sceneParams),
            })
            const codeImgRes = await uniCloud.callFunction({
                name: 'getUnlimitCode',
                data: {
                    scene: sceneRes.result.id, //scene最大为32个可见字符
                    page: shareDetails.page, //跳转到指定页面，若不指定，跳转到首页
                },
            })
            const {
                result: { buffer },
            } = codeImgRes

            filePath = `${wx.env.USER_DATA_PATH}/code${_id}.jpg`
            const wxFile = wx.getFileSystemManager()
            //把图片写在本地
            wxFile.writeFile({
                filePath,
                encoding: 'binary',
                data: new Uint8Array(buffer.data).buffer,
                success: (res) => {
                    posterData.value.codeImg.url = filePath
                    uni.setStorage({
                        key: _id,
                        data: filePath,
                    })
                    nextTick(() => {
                        hchPoster.value.posterShow()
                    })
                },
                fail(e) {
                    console.log(e)
                    uni.showToast({
                        icon: 'none',
                        title: '服务器繁忙，请稍后重试',
                    })
                    //失败时，直接使用静态文件中的小程序码
                    // posterData.value.codeImg.url = codeImgUrl
                    // nextTick(() => {
                    //     hchPoster.value.posterShow()
                    // })
                },
            })
        }
    } catch (e) {
        console.log(e)
        uni.showToast({
            icon: 'none',
            title: '服务器繁忙，请稍后重试',
        })
        // posterData.value.codeImg.url = codeImgUrl
        // nextTick(() => {
        //     hchPoster.value.posterShow()
        // })
    }
    uni.hideLoading()
}
function save() {
    hchPoster.value.handleSaveCanvasImage()
}
function back() {
    uni.navigateBack()
}
</script>
<style lang="scss">
page {
    background: $primary-bg;
}
.button-wrapper {
    padding: 0 30rpx;
    bottom: 20rpx;
    z-index: 16;
    width: 100%;
    height: 93rpx;
}
.block-box {
    width: 670rpx;
    padding: 30rpx 0 0 30rpx;
    background: white;
    border-radius: 30rpx;
    .block-item {
        width: 50rpx;
        height: 50rpx;
        border-radius: 5rpx;
    }
}
.poster-select-box {
    width: 670rpx;
    height: 720rpx;
    background: $primary-bg;
    border-radius: 30rpx;
    .poster-item {
        width: 33.33%;
        .poster-item-size {
            box-shadow: 0rpx 0rpx 8rpx 0rpx rgba(194, 206, 223, 0.5);
            height: 300rpx;
            width: 190rpx;
        }
    }
}
</style>
