<template>
    <view class="">
        <button class="p-center select-button" v-if="!image" @click="selectImage"> 选择图片 </button>
        <template v-else>
            <canvas
                class="canvas"
                :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
                canvas-id="cutCanvas"
            ></canvas>
            <view class="w100" style="position: fixed; bottom: 100rpx">
                <view class="">
                    <radio-group class="w100 h-center" @change="changeColor">
                        <radio class="mr40" value="blue">蓝底</radio>
                        <radio class="mr40" value="red">红底</radio>
                        <radio value="white">白底</radio>
                    </radio-group>
                    <radio-group class="mt40 w100 h-center" @change="changeSize">
                        <radio class="mr40" value="one">一寸</radio>
                        <radio value="two">两寸</radio>
                    </radio-group>
                </view>
                <view class="h-center w100 mt100">
                    <button type="info" class="w30 mr40 br20" @click="cancel"> 取消 </button>
                    <button type="primary" class="w30 br20" @click="saveImage"> 保存 </button>
                </view>
            </view>
        </template>
    </view>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { result } from 'lodash'

const image = ref('')
const image64 = ref('')
const color = ref()
const size = ref('one')

const canvasWidth = ref(295)
const canvasHeight = ref(413)
const canvasRef = ref()
const pixelRatio = ref(1)

async function baiduAi(base64) {
    // const APP_ID = 'your_app_id'
    // const API_KEY = 'your_api_key'
    // const SECRET_KEY = 'your_secret_key'
    const APP_ID = '31647142'
    const API_KEY = 'mUmL5Izys3nG0LLM0QkX4Pov'
    const SECRET_KEY = 'qvGRCOezZ7xNRGCZRCavntye6nZX25Kp'

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
                type: 'foreground',
            },
        })
        .catch((e) => {
            console.log(e)
            uni.showToast(e.message)
        })
    return imgRes.data.foreground
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
function changeSize(e) {
    console.log(e)
    size.value = e.detail.value
}
async function changeColor(e) {
    color.value = e.detail.value
    if (!image.value) {
        return
    }

    const filePath = `${wx.env.USER_DATA_PATH}/baiduAi_${new Date().getTime()}.png`
    const wxFile = wx.getFileSystemManager()
    //把图片写在本地
    wxFile.writeFile({
        filePath,
        encoding: 'base64',
        data: image64.value,
        success: (res) => {
            const ctx = uni.createCanvasContext('cutCanvas', getCurrentInstance())
            wx.getImageInfo({
                src: filePath,
                success(res) {
                    let sx = 0,
                        sy = 0,
                        swidth,
                        sheight
                    const { path, height, width } = res
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
                        uni.canvasGetImageData({
                            canvasId: 'cutCanvas',
                            x: 0,
                            y: 0,
                            width: canvasWidth.value,
                            height: canvasHeight.value,
                            success: function (res) {
                                const data = res.data
                                const backgroundColor = getBackgroundColor()
                                for (let i = 0; i < data.length; i += 4) {
                                    const alpha = data[i + 3]
                                    if (alpha < 50) {
                                        data[i] = backgroundColor.r
                                        data[i + 1] = backgroundColor.g
                                        data[i + 2] = backgroundColor.b
                                        data[i + 3] = 255
                                    }
                                }
                                uni.canvasPutImageData({
                                    canvasId: 'cutCanvas',
                                    x: 0,
                                    y: 0,
                                    width: canvasWidth.value,
                                    height: canvasHeight.value,
                                    data: data,
                                    success(res) {},
                                })
                            },
                            fail(e) {
                                console.log(e)
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
        },
        fail(e) {
            console.log(e)
        },
    })

    // uni.canvasGetImageData() 获取canvas的data
}
function updateCanvas() {
    uni.showLoading()
    const ctx = uni.createCanvasContext('cutCanvas', getCurrentInstance())
    console.log(ctx)
    wx.getImageInfo({
        src: image.value,
        success(res) {
            ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
            let sx = 0,
                sy = 0,
                swidth,
                sheight
            const { path, height, width } = res
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
                // 将canvas转换为base64编码的字符串
                uni.canvasToTempFilePath({
                    canvasId: 'cutCanvas',
                    success: (res) => {
                        uni.getFileSystemManager().readFile({
                            filePath: res.tempFilePath,
                            encoding: 'base64',
                            success: async (data) => {
                                try {
                                    image64.value = await baiduAi(data.data)
                                    // console.log(image64.value)
                                    // image64.value = 'data:image/png;base64,' + (await baiduAi(data.data))
                                } catch (e) {}
                                uni.hideLoading()
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

function saveImage() {
    if (!image.value) {
        return
    }
    const canvas = canvasRef.value
    uni.saveImage({
        filePath: canvas.toTempFilePathSync({
            fileType: 'png',
        }),
        success: () => {
            uni.showToast({
                title: '保存成功',
                icon: 'success',
            })
        },
        fail: (err) => {
            uni.showToast({
                title: err.errMsg,
                icon: 'none',
            })
        },
    })
}

function cancel() {
    image.value = ''
    showSelectButton.value = true
}

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync()
    const pixelRatio = systemInfo.pixelRatio
    pixelRatio.value = pixelRatio
    canvasWidth.value *= pixelRatio
    canvasHeight.value *= pixelRatio
})
</script>
<style scoped>
.canvas {
    position: fixed;
    top: 80rpx;
    left: 0;
    right: 0;
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
