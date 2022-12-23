<template>
    <view class="canvas-content" v-show="canvasShow" :style="'width:' + system.w + 'px; height:' + system.h + 'px;'">
        <!-- 遮罩层 -->
        <view v-if="mask" class="self-mask"></view>
        <!-- 海报 -->
        <!-- :width="system.w" :height="system.h" 支付宝必须要这样设置宽高才有效果 -->
        <canvas
            class="canvas"
            canvas-id="myCanvas"
            id="myCanvas"
            :style="'width:' + system.w + 'px; height:' + system.h + 'px;'"
            :width="system.w"
            :height="system.h"
        ></canvas>
    </view>
</template>

<script>
import { drawSquarePic, drawTextReturnH, getSystem } from './utils'
export default {
    data() {
        return {
            system: {},
            canvasShow: false,
        }
    },
    props: {
        posterData: {
            type: Object,
            default: () => {
                return {}
            },
        },
        mask: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        /**
         * @description: 计算海报背景数据
         * @param {*}
         * @return {*}
         * @author: hch
         */
        poster() {
            let data = this.posterData
            let system = this.system
            let posterBg = {
                url: data.poster.url,
                r: data.poster.r * system.scale,
                w: data.poster.w * system.scale,
                h: data.poster.h * system.scale,
                x: (system.w - data.poster.w * system.scale) / 2,
                y: (system.h - data.poster.h * system.scale) / 2,
                p: data.poster.p * system.scale,
            }
            return posterBg
        },
        /**
         * @description: 计算海报头部主图
         * @param {*}
         * @return {*}
         * @author: hch
         */
        mainImg() {
            let data = this.posterData
            let system = this.system
            let posterMain = {
                url: data.mainImg.url,
                r: data.mainImg.r * system.scale,
                w: data.mainImg.w * system.scale,
                h: data.mainImg.h * system.scale,
                x: (system.w - data.mainImg.w * system.scale) / 2,
                y: this.poster.y + data.poster.p * system.scale,
            }
            return posterMain
        },
        /**
         * @description: 计算海报标题
         * @param {*}
         * @return {*}
         * @author: hch
         */
        title() {
            let data = this.posterData
            let system = this.system
            let posterTitle = data.title
            posterTitle.x = this.mainImg.x
            posterTitle.y = this.mainImg.y + this.mainImg.h + data.title.mt * system.scale
            return posterTitle
        },
        /**
         * @description: 计算小程序码
         * @param {*}
         * @return {*}
         * @author: hch
         */
        codeImg() {
            let data = this.posterData
            let system = this.system
            let posterCode = {
                url: data.codeImg.url,
                r: data.codeImg.r * system.scale,
                w: data.codeImg.w * system.scale,
                h: data.codeImg.h * system.scale,
                x: (system.w - data.codeImg.w * system.scale) / 2,
                y: data.codeImg.mt * system.scale, //y需要加上绘图后文本的y
            }
            return posterCode
        },
    },
    created() {
        // 获取设备信息
        this.system = getSystem()
    },
    methods: {
        /**
         * @description: 展示海报
         * @param {type}
         * @return {type}
         * @author: hch
         */
        posterShow() {
            this.canvasShow = true
            this.creatPoster()
        },
        /**
         * @description: 生成海报
         * @author: hch
         */
        async creatPoster() {
            uni.showLoading({
                title: '生成海报中...',
            })
            const ctx = uni.createCanvasContext('myCanvas', this)
            this.ctx = ctx
            ctx.clearRect(0, 0, this.system.w, this.system.h) //清空之前的海报
            ctx.draw() //清空之前的海报
            // 根据设备屏幕大小和距离屏幕上下左右距离，及圆角绘制背景
            let poster = this.poster
            let mainImg = this.mainImg
            let codeImg = this.codeImg
            let title = this.title
            await drawSquarePic(ctx, poster.x, poster.y, poster.w, poster.h, poster.r, poster.url)
            if (mainImg.url) {
                await drawSquarePic(ctx, mainImg.x, mainImg.y, mainImg.w, mainImg.h, mainImg.r, mainImg.url)
            }

            // 绘制标题 textY 绘制文本的y位置
            let textY = 0
            console.log(title.text)
            title.text.forEach((e, i) => {
                console.log(e)
                if (i === 0) {
                    textY = title.y
                } else {
                    textY += 25
                }
                textY = drawTextReturnH(
                    ctx,
                    e,
                    title.x,
                    textY,
                    mainImg.w,
                    title.fontSize,
                    title.color,
                    title.lineHeight,
                    title.align,
                )
            })

            const needHeight = this.posterData.tips.reduce((prev, cur) => {
                return prev + cur.mt + cur.lineHeight
            }, codeImg.h)
            textY = Math.max(textY, this.poster.h + this.poster.y - needHeight)

            // 绘制小程序码
            await drawSquarePic(ctx, codeImg.x, codeImg.y + textY, codeImg.w, codeImg.h, codeImg.r, codeImg.url)
            // 小程序的名称
            // 长按/扫描识别查看商品
            let y = 0
            this.posterData.tips.forEach((element, i) => {
                if (i == 0) {
                    y = codeImg.y + textY + element.mt + codeImg.h
                } else {
                    y += element.mt
                }
                y = drawTextReturnH(
                    ctx,
                    element.text,
                    title.x,
                    y,
                    mainImg.w,
                    element.fontSize,
                    element.color,
                    element.lineHeight,
                    element.align,
                )
            })
            console.log(this.poster.h + this.poster.y, textY, needHeight, y)
            // 480 299.5 225 474.5
            uni.hideLoading()
        },
        /**
         * @description: 保存到系统相册
         * @param {type}
         * @return {type}
         * @author: hch
         */
        handleSaveCanvasImage() {
            uni.showLoading({
                title: '保存中...',
            })
            let _this = this
            uni.canvasToTempFilePath(
                {
                    x: this.poster.x,
                    y: this.poster.y,
                    width: this.poster.w, // 画布的宽
                    height: this.poster.h, // 画布的高
                    destWidth: this.poster.w * 4,
                    destHeight: this.poster.h * 4,
                    quality: 1,
                    canvasId: 'myCanvas',
                    success(res) {
                        //保存图片至相册
                        // #ifndef H5
                        // 除了h5以外的其他端
                        uni.saveImageToPhotosAlbum({
                            filePath: res.tempFilePath,
                            success(res) {
                                uni.hideLoading()
                                uni.showToast({
                                    title: '图片保存成功，可以去分享啦~',
                                    duration: 2000,
                                    icon: 'none',
                                })
                                // _this.handleCanvasCancel()
                            },
                            fail() {
                                uni.showToast({
                                    title: '保存失败，稍后再试',
                                    duration: 2000,
                                    icon: 'none',
                                })
                                uni.hideLoading()
                            },
                        })
                        // #endif

                        // #ifdef H5
                        // h5的时候
                        uni.showToast({
                            title: '请长按保存',
                            duration: 3000,
                            icon: 'none',
                        })
                        _this.handleCanvasCancel()
                        _this.$emit('previewImage', res.tempFilePath)
                        // #endif
                    },
                    fail(res) {
                        console.log('fail -> res', res)
                        uni.showToast({
                            title: '保存失败，稍后再试',
                            duration: 2000,
                            icon: 'none',
                        })
                        uni.hideLoading()
                    },
                },
                this,
            )
        },
        /**
         * @description: 取消海报
         * @param {type}
         * @return {type}
         * @author: hch
         */
        handleCanvasCancel() {
            this.canvasShow = false
            this.$emit('cancel', true)
        },
    },
}
</script>

<style lang="scss">
.canvas-content {
    position: absolute;
    top: 0;
    background: $primary-bg;

    .canvas {
        z-index: 10;
    }
}
</style>
