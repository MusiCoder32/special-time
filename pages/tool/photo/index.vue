<template>
    <view class="">
        <button type="primary" class="p-center" v-if="!image" @click="selectImage">选择图片</button>
        <template v-else>
            <canvas
                class="canvas mt40"
                :style="{ width: widthRpx + 'rpx', height: heightRpx + 'rpx' }"
                canvas-id="cutCanvas"
            ></canvas>
            <view class="w100 mt60">
                <view class="">
                    <radio-group class="w100 h-center" @change="changeColor">
                        <radio class="mr40" value="blue">蓝底</radio>
                        <radio class="mr40" value="red">红底</radio>
                        <radio value="white">白底</radio>
                    </radio-group>
                </view>
                <view class="h-center w100 mt60">
                    <button type="info" class="w30 mr40 br20" @click="cancel"> 取消 </button>
                    <button type="primary" class="w30 br20" @click="openAd"> 保存 </button>
                </view>
            </view>
        </template>
    </view>
    <ad-video ref="adVideo" :action="saveImage" />
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import AdVideo from '@/components/ad-video.vue'
import { debounce } from 'lodash'

const image = ref('')
const baiduAiFilePath = ref('')
const color = ref()
const originImageData = ref()
const size = ref('one')

const widthRpx = 295 * 2
const heightRpx = 413 * 2

const canvasWidth = ref(widthRpx)
const canvasHeight = ref(heightRpx)
const pixelRatio = ref(1)
const adVideo = ref()
function adEndClose({ score }) {
    console.log(score)
}

async function baiduAi(base64) {
    const API_KEY = 'your_api_key'
    const SECRET_KEY = 'your_secret_key'

    const tokenRes = await uni
        .request({
            url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`,
        })
        .catch((e) => e)
    const access_token = tokenRes.data.access_token
    console.log(access_token)

    const imgRes = await uni
        .request({
            url: `https://aip.baidubce.com/rest/2.0/image-classify/v1/body_seg?access_token=${access_token}`,
            method: 'POST',
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: {
                image: base64,
                type: 'scoremap',
            },
        })
        .catch((e) => {
            console.log(e)
            uni.showToast(e.message)
        })
    return imgRes.data.scoremap
}

function selectImage() {
    let systemInfo = uni.getSystemInfoSync()
    if (systemInfo.hostSDKVersion >= '2.21.0') {
        uni.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sizeType: ['original'],
            sourceType: ['album'],
            success: async (res) => {
                image.value = res.tempFiles[0].tempFilePath
                updateCanvas()
            },
        })
    } else {
        uni.chooseImage({
            count: 1,
            sizeType: 'original',
            sourceType: 'album',
            success: async (res) => {
                image.value = res.tempFilePaths[0]
                updateCanvas()
            },
        })
    }
}

async function changeColor(e) {
    color.value = e.detail.value
    if (!image.value || !baiduAiFilePath.value) {
        return
    }
    const ctx = uni.createCanvasContext('cutCanvas', getCurrentInstance())
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    ctx.drawImage(baiduAiFilePath.value, 0, 0)
    ctx.draw(false, () => {
        uni.canvasGetImageData({
            canvasId: 'cutCanvas',
            x: 0,
            y: 0,
            width: canvasWidth.value,
            height: canvasHeight.value,
            success: function (res) {
                const data = res.data
                const backgroundColor = getBackgroundColor()
                console.log(backgroundColor)
                const Confidence = 255 * 0.5
                console.log(data.length, originImageData.value.length)
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i] < Confidence) {
                        originImageData.value[i] = backgroundColor.r
                        originImageData.value[i + 1] = backgroundColor.g
                        originImageData.value[i + 2] = backgroundColor.b
                        originImageData.value[i + 3] = 255
                    }
                }
                uni.canvasPutImageData({
                    canvasId: 'cutCanvas',
                    x: 0,
                    y: 0,
                    width: canvasWidth.value,
                    height: canvasHeight.value,
                    data: originImageData.value,
                    success(res) {},
                    fail(e) {
                        console.log(e)
                    },
                })
            },
            fail(e) {
                console.log(e)
            },
        })
    })

    // uni.canvasGetImageData() 获取canvas的data
}
function updateCanvas() {
    uni.showLoading({
        mask: true,
    })
    const ctx = uni.createCanvasContext('cutCanvas', getCurrentInstance())
    wx.getImageInfo({
        src: image.value,
        success(res) {
            ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
            let sx = 0,
                sy = 0,
                swidth,
                sheight
            const { path, height, width } = res
            if (width > 600 || height > 600) {
                image.value = ''
                return uni.showToast({
                    title: '图片过大，请选择像素小于600*600的图片',
                    icon: 'none',
                    duration: 3000,
                })
            }
            const imgScale = width / height
            const ctxScale = canvasWidth.value / canvasHeight.value
            if (imgScale > ctxScale) {
                sheight = height
                swidth = height * ctxScale
                sx = Math.max(0, (width - swidth) / 2)
            } else {
                swidth = width
                sheight = width / ctxScale
                sy = Math.max((height - sheight) / 2)
            }
            //sx,sy,从何位置切割源图片
            //swidth,sheight切割源图片的高宽
            //x,y 将切割的源图片从画布（x,y）处开始绘制
            //w,h 图片绘制到画布中的高宽，若w>swith则表示放大宽度
            ctx.drawImage(path, sx, sy, swidth, sheight, 0, 0, canvasWidth.value, canvasHeight.value)
            ctx.draw(false, () => {
                // 保留原始图像像素点
                uni.canvasGetImageData({
                    canvasId: 'cutCanvas',
                    x: 0,
                    y: 0,
                    width: canvasWidth.value,
                    height: canvasHeight.value,
                    success: function (res) {
                        originImageData.value = res.data
                    },
                    fail(e) {
                        console.log(e)
                    },
                })
                // 将canvas转换为base64编码的字符串
                uni.canvasToTempFilePath({
                    canvasId: 'cutCanvas',
                    success: (res) => {
                        uni.getFileSystemManager().readFile({
                            filePath: res.tempFilePath,
                            encoding: 'base64',
                            success: async (data) => {
                                try {
                                    const base64 = await baiduAi(data.data)
                                    const filePath = `${wx.env.USER_DATA_PATH}/baiduAi_${new Date().getTime()}.png`
                                    const wxFile = wx.getFileSystemManager()
                                    //把图片写在本地
                                    wxFile.writeFile({
                                        filePath,
                                        encoding: 'base64',
                                        data: base64,
                                        success: (res) => {
                                            baiduAiFilePath.value = filePath
                                            uni.hideLoading()
                                        },
                                        fail(e) {
                                            console.log(e)
                                            uni.hideLoading()
                                        },
                                    })

                                    // console.log(image64.value)
                                    // image64.value = 'data:image/png;base64,' + (await baiduAi(data.data))
                                } catch (e) {
                                    uni.hideLoading()
                                }
                            },
                            fail: (err) => {
                                uni.hideLoading()
                                console.log(err)
                            },
                        })
                    },
                    fail: (err) => {
                        console.log(err)
                    },
                })
            })
        },
        fail(res) {
            console.log('fail -> res', res)
            uni.showToast({
                title: '图片下载异常',
                duration: 2000,
                icon: 'none',
            })
        },
    })
}

function getBackgroundColor() {
    switch (color.value) {
        case 'blue':
            return { r: 0, g: 0, b: 255 }
        case 'red':
            return { r: 255, g: 0, b: 0 }
        case 'white':
            return { r: 255, g: 255, b: 255 }
        default:
            return { r: 40, g: 130, b: 255 }
    }
}

function openAd() {
    adVideo.value.beforeOpenAd(5, '证件照换底')
}

async function saveImage() {
    if (!image.value) {
        return
    }
    let me = this
    await new Promise((resolve, reject) => {
        uni.canvasToTempFilePath(
            {
                x: 0,
                y: 0,
                width: canvasWidth.value, // 画布的宽
                height: canvasHeight.value, // 画布的高
                destWidth: 295,
                destHeight: canvasHeight.value / (canvasWidth.value / 295),
                quality: 1,
                canvasId: 'cutCanvas',
                success(res) {
                    uni.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success(res) {
                            resolve()
                            uni.showToast({
                                title: '图片保存成功',
                                duration: 2000,
                                icon: 'none',
                            })
                        },
                        fail(e) {
                            reject(e)
                            uni.showToast({
                                title: '保存失败，稍后再试',
                                duration: 2000,
                                icon: 'none',
                            })
                        },
                    })
                },
                fail(res) {
                    reject(res)
                    uni.showToast({
                        title: '保存失败，稍后再试',
                        duration: 2000,
                        icon: 'none',
                    })
                },
            },
            me,
        )
    })
}

function cancel() {
    image.value = ''
}

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync()
    const { screenWidth } = systemInfo
    console.log(systemInfo)
    pixelRatio.value = systemInfo.pixelRatio

    //必须严格取整，否则无法用canvasPutImageData来绘制canvas
    canvasWidth.value = Math.floor((canvasWidth.value * screenWidth) / 750)
    canvasHeight.value = Math.floor((canvasWidth.value * 413) / 295)
    console.log(canvasWidth.value)
    console.log(canvasHeight.value)
})
</script>
<style scoped>
.canvas {
    margin: auto;
}

.size-radio {
    display: flex;
    flex-direction: row;
}

.save-button {
    background-color: #4d7aff;
    color: #fff;
    border: none;
    padding: 10rpx 20rpx;
    border-radius: 5rpx;
}

.cancel-button {
    background-color: #f5f5f5;
    color: #999;
    border: none;
    padding: 10rpx 20rpx;
    border-radius: 5rpx;
}
</style>
