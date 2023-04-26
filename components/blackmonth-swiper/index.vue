<template>
    <view>
        <view class="swiperPanel" @touchstart="startMove" @touchend="endMove">
            <view
                class="swiperItem"
                v-for="(item, index) in swiperList"
                :key="item.label+index"
                :style="{
                    transform: itemStyle[index].transform,
                    zIndex: itemStyle[index].zIndex,
                    opacity: itemStyle[index].opacity,
                }"
            >
                <view class="children p-r">
                    <image
                        style="right: 0px; top: 0px; width: 40rpx; height: 40rpx"
                        src="/static/share.svg"
                        @touchstart.stop="shareClick(item, index)"
                        @touchend.stop="stop"
                        class="p-a p40"
                    ></image>
                    <view class="pic v-center br40" :style="'background:' + colorArr[index % colorArr.length]">
                        <view v-if="item.label" class="f42 mb30" style="color: #3d3d3d">{{ item.label }}</view>
                        <view v-if="item.value" class="mb20 fc-orange">{{ item.value }}</view>
                        <view v-if="item.unit" style="color: #3d3d3d">{{ item.unit }}</view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    props: {
        swiperList: {
            type: Array,
            default: [],
        },
        colorArr: {
            type: Array,
            default: [],
        },
    },
    data() {
        return {
            slideNote: {
                x: 0,
                y: 0,
            },
            screenWidth: 0,
            itemStyle: [],
        }
    },
    created() {
        var macInfo = uni.getSystemInfoSync()
        this.screenWidth = macInfo.screenWidth
        // 计算swiper样式
    },
	watch: {
		swiperList: {
			handler(oldV,newV) {
				if(oldV?.length !== newV?.length) {
					this.itemStyle = []
					this.swiperList.forEach((item, index) => {
					    this.itemStyle.push(this.getStyle(index))
					})
				}
			},
			immediate:true
		}
	},
    methods: {
        stop() {},

        // @通过组件ref调用弹窗方法
        // 打开分享弹窗
        shareClick(item, index) {
            this.$emit('share', { ...item }, index)
        },
        getStyle(e) {
            if (e > this.swiperList.length / 2) {
                var right = this.swiperList.length - e
                return {
                    transform: 'scale(' + (1 - right / 10) + ') translate(-' + right * 9 + '%,0px)',
                    zIndex: 9999 - right,
                    opacity: 0.8 / right,
                }
            } else {
                return {
                    transform: 'scale(' + (1 - e / 10) + ') translate(' + e * 9 + '%,0px)',
                    zIndex: 9999 - e,
                    opacity: 0.8 / e,
                }
            }
        },
        startMove(e) {
            this.slideNote.x = e.changedTouches[0] ? e.changedTouches[0].pageX : 0
            this.slideNote.y = e.changedTouches[0] ? e.changedTouches[0].pageY : 0
        },
        endMove(e) {
            var newList = JSON.parse(JSON.stringify(this.itemStyle))
            if (e.changedTouches[0].pageX - this.slideNote.x < 0) {
                // 向左滑动
                var last = [newList.pop()]
                newList = last.concat(newList)
            } else if (e.changedTouches[0].pageX - this.slideNote.x > 0) {
                // 向右滑动
                newList.push(newList[0])
                newList.splice(0, 1)
            } else if (e.changedTouches[0].pageX > 188) {
                // 点击右侧向左滑动
                var last = [newList.pop()]
                newList = last.concat(newList)
            } else {
                // 点击左侧，向右滑动
                newList.push(newList[0])
                newList.splice(0, 1)
            }
            this.itemStyle = newList
        },
    },
}
</script>

<style lang="scss">
.swiperPanel {
    height: 488rpx;
    width: 100%;
    overflow: hidden;
    position: relative;

    .swiperItem {
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        transition: all 0.5s;

        .children {
            height: 100%;
            width: 560rpx;
            margin: 2rpx auto;

            .pic {
                color: white;
                height: 100%;
                width: 100%;
                box-shadow: 0rpx 2rpx 20rpx #0000000d;
            }
        }
    }
}
</style>
