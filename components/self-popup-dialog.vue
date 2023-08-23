<template>
    <view class="uni-popup-dialog p-r">
        <view class="uni-dialog-title">
            <text class="uni-dialog-title-text" :class="['uni-popup__' + dialogType]">{{ titleText }}</text>
        </view>
        <view v-if="mode === 'base'" class="uni-dialog-content">
            <slot>
                <text class="uni-dialog-content-text">{{ content }}</text>
            </slot>
        </view>
        <view v-else class="uni-dialog-content">
            <slot>
                <input
                    class="uni-dialog-input"
                    v-model="val"
                    :type="inputType"
                    :placeholder="placeholderText"
                    :focus="focus"
                />
            </slot>
        </view>
        <view class="uni-dialog-button-group">
            <view class="uni-dialog-button" @click="cancelDialog">
                <text class="uni-dialog-button-text">{{ cancelText }}</text>
            </view>
            <!--			<view class="uni-dialog-button uni-border-left" @click="onOk">-->
            <!--				<text class="uni-dialog-button-text uni-button-color">{{okText}}</text>-->
            <!--			</view>			-->
            <view class="uni-dialog-button uni-border-left" @click="onOk">
                <button open-type="share" class="uni-dialog-button-text uni-button-color">
                    {{ okText }}
                </button>
            </view>
        </view>

        <uni-icons class="p-a" style="right: 20rpx; top: 20rpx" @click="closeDialog" type="closeempty" size="24" />
    </view>
</template>

<script>
export default {
    emits: ['confirm', 'close'],
    props: {
        inputType: {
            type: String,
            default: 'text',
        },
        value: {
            type: [String, Number],
            default: '',
        },
        placeholder: {
            type: [String, Number],
            default: '',
        },
        type: {
            type: String,
            default: 'error',
        },
        mode: {
            type: String,
            default: 'base',
        },
        title: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            default: '',
        },
        beforeClose: {
            type: Boolean,
            default: false,
        },
        cancelText: {
            type: String,
            default: '',
        },
        confirmText: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            dialogType: 'error',
            focus: false,
            val: '',
        }
    },
    computed: {
        okText() {
            return this.confirmText || '确定'
        },
        cancelText() {
            return this.cancelText || '取消'
        },
        placeholderText() {
            return this.placeholder || '請輸入'
        },
        titleText() {
            return this.title || '提示'
        },
    },
    watch: {
        type(val) {
            this.dialogType = val
        },
        mode(val) {
            if (val === 'input') {
                this.dialogType = 'info'
            }
        },
        value(val) {
            this.val = val
        },
    },
    created() {
        this.popup = this.getParent()
        // 对话框遮罩不可点击
        this.popup.disableMask()
        // this.popup.closeMask()
        if (this.mode === 'input') {
            this.dialogType = 'info'
            this.val = this.value
        } else {
            this.dialogType = this.type
        }
    },
    mounted() {
        this.focus = true
    },
    methods: {
        getParent(name = 'uniPopup') {
            let parent = this.$parent
            let parentName = parent.$options.name
            while (parentName !== name) {
                parent = parent.$parent
                if (!parent) return false
                parentName = parent.$options.name
            }
            return parent
        },
        closeDialog() {
            this.popup.close()
        },
        /**
         * 点击确认按钮
         */
        onOk() {
            if (this.mode === 'input') {
                this.$emit('confirm', this.val)
            } else {
                this.$emit('confirm')
            }
            if (this.beforeClose) return
            this.popup.close()
        },
        /**
         * 点击取消按钮
         */
        cancelDialog() {
            this.$emit('cancel')
            if (this.beforeClose) return
            this.popup.close()
        },
        close() {
            this.popup.close()
        },
    },
}
</script>

<style lang="scss">
.uni-popup-dialog {
    width: 300px;
    border-radius: 20rpx;
    background-color: #fff;
}

.uni-dialog-title {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    justify-content: center;
    padding-top: 25px;
}

.uni-dialog-title-text {
    font-size: 32rpx;
    font-weight: bold;
}

.uni-dialog-content {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.uni-dialog-content-text {
    font-size: 32rpx;
    color: rgb(127, 127, 127);
}

.uni-dialog-button-group {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    border-top-color: #f5f5f5;
    border-top-style: solid;
    border-top-width: 1px;
}

.uni-dialog-button {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */

    flex: 1;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 45px;
}

.uni-border-left {
    border-left-color: #f0f0f0;
    border-left-style: solid;
    border-left-width: 1px;
}

.uni-dialog-button-text {
    font-size: 16px;
    color: #333;
    background: transparent;
    &:after {
        border: none;
    }
}

.uni-button-color {
    color: #007aff;
}

.uni-dialog-input {
    flex: 1;
    font-size: 14px;
    border: 1px #eee solid;
    height: 40px;
    padding: 0 10px;
    border-radius: 5px;
    color: #555;
}

.uni-popup__success {
    color: #4cd964;
}

.uni-popup__warn {
    color: #f0ad4e;
}

.uni-popup__error {
    color: #dd524d;
}

.uni-popup__info {
    color: rgb(25, 25, 25);
}
</style>
