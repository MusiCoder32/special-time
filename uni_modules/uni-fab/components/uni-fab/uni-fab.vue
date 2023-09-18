<template>
    <view
        @touchstart="handleTouchstart"
        @touchmove.stop="handleTouchmove"
        @touchend.stop="handleTouchend"
        class="uni-cursor-point"
        :class="'uni-fab--' + horizontal + '-' + vertical"
        :style="dragStyle"
    >
        <view v-if="popMenu && horizontal && vertical && content.length > 0" class="uni-fab">
            <view
                :class="[
                    `uni-fab__content--${horizontal}`,
                    `uni-fab__content--${direction}-${vertical}`,
                    !isAndroidNvue ? 'uni-fab__content--other-platform' : '',
                ]"
                :style="{
                    width: boxWidth,
                    height: boxHeight,
                    backgroundColor: styles.backgroundColor,
                }"
                class="uni-fab__content"
                elevation="5"
            >
                <view
                    v-for="(item, index) in content"
                    :key="index"
                    :class="{ 'uni-fab__item--active': isShow }"
                    class="uni-fab__item"
                    @click="_onItemClick(index, item)"
                >
                    <image
                        :src="item.active ? item.selectedIconPath : item.iconPath"
                        class="uni-fab__item-image"
                        mode="aspectFit"
                    />
                    <text
                        class="uni-fab__item-text"
                        :style="{
                            color: item.active ? styles.selectedColor : styles.color,
                        }"
                        >{{ item.text }}</text
                    >
                </view>
            </view>
        </view>
        <view class="uni-fab__circle uni-fab__plus" :style="styleTest" @click="_onClick">
            <uni-icons
                class="fab-circle-icon"
                :type="styles.icon"
                :color="styles.iconColor"
                size="32"
                :class="{ 'uni-fab__plus--active': isShow && content.length > 0 }"
            ></uni-icons>
        </view>
    </view>
</template>

<script>
let platform = 'other'
// #ifdef APP-NVUE
platform = uni.getSystemInfoSync().platform
// #endif

/**
 * Fab 悬浮按钮
 * @description 点击可展开一个图形按钮菜单
 * @tutorial https://ext.dcloud.net.cn/plugin?id=144
 * @property {Object} pattern 可选样式配置项
 * @property {Object} horizontal = [left | right] 水平对齐方式
 * 	@value left 左对齐
 * 	@value right 右对齐
 * @property {Object} vertical = [bottom | top] 垂直对齐方式
 * 	@value bottom 下对齐
 * 	@value top 上对齐
 * @property {Object} direction = [horizontal | vertical] 展开菜单显示方式
 * 	@value horizontal 水平显示
 * 	@value vertical 垂直显示
 * @property {Array} content 展开菜单内容配置项
 * @property {Boolean} popMenu 是否使用弹出菜单
 * @property {Boolean} origin 拖动完成后是否自动回到原点
 * @event {Function} trigger 展开菜单点击事件，返回点击信息
 * @event {Function} fabClick 悬浮按钮点击事件
 */
export default {
    name: 'UniFabDrag',
    emits: ['fabClick', 'trigger'],
    props: {
        pattern: {
            type: Object,
            default() {
                return {}
            },
        },
        horizontal: {
            type: String,
            default: 'left',
        },
        vertical: {
            type: String,
            default: 'bottom',
        },
        direction: {
            type: String,
            default: 'horizontal',
        },
        content: {
            type: Array,
            default() {
                return []
            },
        },
        show: {
            type: Boolean,
            default: false,
        },
        popMenu: {
            type: Boolean,
            default: true,
        },
        origin: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            fabShow: false,
            isShow: false,
            isAndroidNvue: platform === 'android',
            verticalValue: 30,
            horizontalValue: 15,
            startPosition: null,
            currentDrayDistance: { x: 0, y: 0 },
            totalDragPosition: { x: 0, y: 0 },
            styles: {
                color: '#3c3e49',
                selectedColor: '#007AFF',
                backgroundColor: '#fff',
                buttonColor: '#007AFF',
                iconColor: '#fff',
                icon: 'plusempty',
            },
        }
    },
    computed: {
        dragStyle() {
            let result
            let horizontalValue, verticalValue
            horizontalValue = Math.max(15, this.horizontalValue)
            verticalValue = Math.max(30, this.verticalValue)
            result = `${this.horizontal}:${horizontalValue + this.totalDragPosition.x + this.currentDrayDistance.x}px;${
                this.vertical
            }:${verticalValue + this.totalDragPosition.y + this.currentDrayDistance.y}px`
            /* #ifdef H5 */
            result = `${this.horizontal}:calc(${
                horizontalValue + this.totalDragPosition.x + this.currentDrayDistance.x
            }px + var(--window-left));${this.vertical}:calc(${
                verticalValue + this.totalDragPosition.y + +this.currentDrayDistance.y
            }px + var(--window-top))`
            /* #endif */
            return result
        },
        styleTest() {
            return `${this.horizontal}:0;${this.vertical}:0;background-color:${this.styles.buttonColor}`
        },
        // 动态计算宽度
        boxWidth() {
            if (this.direction === 'vertical' || !this.isShow) return '55px'
            return (this.content.length + 1) * 55 + 15 + 'px'
        },
        // 动态计算高度
        boxHeight() {
            if (this.direction !== 'vertical' || !this.isShow) return '55px'
            return (this.content.length + 1) * 55 + 15 + 'px'
        },
    },
    watch: {
        pattern: {
            handler(val, oldVal) {
                this.styles = Object.assign({}, this.styles, val)
            },
            deep: true,
        },
    },
    created() {
        this.isShow = this.show
        if (this.top === 0) {
            this.fabShow = true
        }
        // 初始化样式
        this.styles = Object.assign({}, this.styles, this.pattern)
    },
    methods: {
        /** 处理手指触摸开始事件 */
        handleTouchstart(event) {
            this.startPosition = event.touches[0]
            // 记录一些数据
        },
        /** 处理手指触摸后移动 */
        handleTouchmove(event) {
            const { pageX: currentX, pageY: currentY } = event.touches[0]
            const { pageX: startX, pageY: startY } = this.startPosition
            //更新组件
            this.currentDrayDistance.x = this.horizontal === 'left' ? currentX - startX : startX - currentX
            this.currentDrayDistance.y = this.vertical === 'top' ? currentY - startY : startY - currentY
        },

        /** 处理手指松开事件 */
        async handleTouchend(event) {
            if (!this.origin) {
                this.totalDragPosition.x += this.currentDrayDistance.x
                this.totalDragPosition.y += this.currentDrayDistance.y
            }
            this.currentDrayDistance.x = 0
            this.currentDrayDistance.y = 0
        },
        _onClick() {
            this.$emit('fabClick')
            if (!this.popMenu) {
                return
            }
            this.isShow = !this.isShow
        },
        open() {
            this.isShow = true
        },
        close() {
            this.isShow = false
        },
        /**
         * 按钮点击事件
         */
        _onItemClick(index, item) {
            if (!this.isShow) {
                return
            }
            this.$emit('trigger', {
                index,
                item,
            })
        },
    },
}
</script>

<style lang="scss">
$uni-shadow-base: 0 1px 5px 2px
    rgba(
        $color: #000000,
        $alpha: 0.3,
    ) !default;

.uni-fab {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    justify-content: center;
    align-items: center;
    z-index: 10;
    border-radius: 45px;
    box-shadow: $uni-shadow-base;
}

.uni-cursor-point {
    z-index: 9999;
    position: fixed;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
}

.uni-fab--active {
    opacity: 1;
}

.uni-fab--left-bottom {
    left: 15px;
    bottom: 30px;
    /* #ifdef H5 */
    left: calc(15px + var(--window-left));
    bottom: calc(30px + var(--window-bottom));
    /* #endif */
    // padding: 10px;
}

.uni-fab--left-top {
    left: 15px;
    top: 30px;
    /* #ifdef H5 */
    left: calc(15px + var(--window-left));
    top: calc(30px + var(--window-top));
    /* #endif */
    // padding: 10px;
}

.uni-fab--right-bottom {
    right: 15px;
    bottom: 160rpx;
    /* #ifdef H5 */
    right: calc(15px + var(--window-right));
    bottom: calc(30px + var(--window-bottom));
    /* #endif */
    // padding: 10px;
}

.uni-fab--right-top {
    right: 15px;
    top: 30px;
    /* #ifdef H5 */
    right: calc(15px + var(--window-right));
    top: calc(30px + var(--window-top));
    /* #endif */
    // padding: 10px;
}

.uni-fab__circle {
    position: absolute;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    justify-content: center;
    align-items: center;
    width: 55px;
    height: 55px;
    background-color: #3c3e49;
    border-radius: 45px;
    z-index: 11;
    // box-shadow: $uni-shadow-base;
}

.uni-fab__circle--left-bottom {
    left: 15px;
    bottom: 30px;
    /* #ifdef H5 */
    left: calc(15px + var(--window-left));
    bottom: calc(30px + var(--window-bottom));
    /* #endif */
}

.uni-fab__circle--left-top {
    left: 15px;
    top: 30px;
    /* #ifdef H5 */
    left: calc(15px + var(--window-left));
    top: calc(30px + var(--window-top));
    /* #endif */
}

.uni-fab__circle--right-bottom {
    right: 15px;
    bottom: 160rpx;
    /* #ifdef H5 */
    right: calc(15px + var(--window-right));
    bottom: calc(100rpx + var(--window-bottom));
    /* #endif */
}

.uni-fab__circle--right-top {
    right: 15px;
    top: 30px;
    /* #ifdef H5 */
    right: calc(15px + var(--window-right));
    top: calc(30px + var(--window-top));
    /* #endif */
}

.uni-fab__circle--left {
    left: 0;
}

.uni-fab__circle--right {
    right: 0;
}

.uni-fab__circle--top {
    top: 0;
}

.uni-fab__circle--bottom {
    bottom: 0;
}

.uni-fab__plus {
    font-weight: bold;
}

.fab-circle-icon {
    transform: rotate(0deg);
    transition: transform 0.3s;
    font-weight: 200;
}

.uni-fab__plus--active {
    transform: rotate(135deg);
}

.uni-fab__content {
    /* #ifndef APP-NVUE */
    box-sizing: border-box;
    display: flex;
    /* #endif */
    flex-direction: row;
    border-radius: 55px;
    overflow: hidden;
    transition-property: width, height;
    transition-duration: 0.2s;
    width: 55px;
    border-color: #dddddd;
    border-width: 1rpx;
    border-style: solid;
}

.uni-fab__content--other-platform {
    border-width: 0px;
    box-shadow: $uni-shadow-base;
}

.uni-fab__content--left {
    justify-content: flex-start;
    padding: 0 0 0 55px;
}

.uni-fab__content--right {
    justify-content: flex-end;
    padding: 0 55px 0 0;
}

.uni-fab__content--vertical-top {
    flex-direction: column;
    justify-content: flex-start;
    padding: 55px 0 0 0;
}

.uni-fab__content--vertical-bottom {
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 0 55px 0;
}

.uni-fab__item {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 55px;
    height: 55px;
    opacity: 0;
    transition: opacity 0.2s;
}

.uni-fab__item--active {
    opacity: 1;
}

.uni-fab__item-image {
    width: 20px;
    height: 20px;
    margin-bottom: 4px;
}

.uni-fab__item-text {
    color: #ffffff;
    font-size: 12px;
    line-height: 12px;
    margin-top: 2px;
}
</style>
