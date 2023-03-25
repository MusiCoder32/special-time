<template>
    <view class="">
        <button class="p-center select-button" v-if="showSelectButton" @click="selectImage"> 选择图片 </button>
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

const image = ref('')
const color = ref()
const size = ref('one')
const showSelectButton = ref(true)
const canvasWidth = ref(295)
const canvasHeight = ref(413)
const canvasRef = ref()
const pixelRatio = ref(1)

function selectImage() {
    uni.chooseImage({
        success: (res) => {
            image.value = res.tempFilePaths[0]
            showSelectButton.value = false
            updateCanvas()
        },
        fail: (err) => {
            uni.showToast({
                title: err.errMsg,
                icon: 'none',
            })
        },
    })
}
function changeSize(e) {
    console.log(e)
    size.value = e.detail.value
}
function changeColor(e) {
    color.value = e.detail.value
    if (!image.value) {
        return
    }
    uni.canvasGetImageData({
        canvasId: 'cutCanvas',
        x: 0,
        y: 0,
        width: canvasWidth.value,
        height: canvasHeight.value,
        success: function (res) {
            const data = res.data
            console.log(data)
            const backgroundColor = getBackgroundColor()
            for (let i = 0; i < data.length; i += 4) {
                var red = data[i]
                var green = data[i + 1]
                var blue = data[i + 2]
                const threshold = 60
                const pointWhite = red > 255 - threshold && green > 255 - threshold && blue > 255 - threshold
                const pointBlue = blue > 255 - threshold && red < threshold && green < threshold
                const pointRed = red > 255 - threshold && green < threshold && blue < threshold
                if (color.value === 'red') {
                    if (pointBlue || pointWhite) {
                        data[i] = backgroundColor.r
                        data[i + 1] = backgroundColor.g
                        data[i + 2] = backgroundColor.b
                    }
                } else if (color.value === 'blue') {
                    if (pointRed || pointWhite) {
                        data[i] = backgroundColor.r
                        data[i + 1] = backgroundColor.g
                        data[i + 2] = backgroundColor.b
                    }
                } else if (color.value === 'white') {
                    if (pointRed || pointBlue) {
                        data[i] = backgroundColor.r
                        data[i + 1] = backgroundColor.g
                        data[i + 2] = backgroundColor.b
                    }
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
}

function updateCanvas() {
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
            ctx.draw(true)
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
