<template>
    <view class="wrap">
        <view class="container" :style="{ 'padding-bottom': `${52 + inputBottom}px` }">
            <scroll-view
                class="content"
                scroll-y="true"
                :style="'width: 100%;height:' + height + 'px;'"
                :scroll-top="scrollTop"
            >
                <!-- 用来获取消息体高度 -->
                <view id="chat-list">
                    <!-- 消息 -->
                    <view class="item" v-for="(x, i) in msgList" :key="i">
                        <!-- 用户消息 头像可选加入-->
                        <view v-if="x.role === 'user'" class="chat-item human-item">
                            <!-- 	<image v-if="!x.my" class="chat-img" src="../../static/..." mode="aspectFill" ></image> -->

                            <view class="chat chat-human">
                                <text
                                    :selectable="true"
                                    style="word-break: break-all"
                                    @longpress="copyText(x.content)"
                                    >{{ x.content }}</text
                                >
                            </view>
                            <!-- <image class="chat-img " src="../../static/..." mode="aspectFill" ></image> -->
                        </view>
                        <!-- 机器人消息 -->
                        <view v-else class="chat-item">
                            <!--  <view class="chat-img flex-row-center">
								<image style="height: 75rpx;width: 75rpx;" src="../../static/robt.png" mode="aspectFit"></image>
							</view> -->
                            <view class="chat chat-ai">
                                <text
                                    :selectable="true"
                                    style="word-break: break-all"
                                    @longpress="copyText(x.content)"
                                    >{{ x.content }}</text
                                >
                            </view>
                        </view>
                    </view>
                    <!-- loading是显示 -->
                    <view v-show="msgLoad" class="">
                        <!--  <view class="chat-img flex-row-center">
							<image style="height: 75rpx;width: 75rpx;" src="../../static/robt.png" mode="aspectFit">
							</image>
						</view> -->
                        <view class="chat-item">
                            <view class="chat chat-ai">
                                <view class="rotate">
                                    <uni-icons type="spinner-cycle" size="30"></uni-icons>
                                </view>
                            </view>
                        </view>
                    </view>
                    <!-- 防止消息底部被遮 -->
                    <view style="height: 110rpx"> </view>
                </view>
            </scroll-view>
        </view>
        <view class="bottom-textarea" :style="{ bottom: inputBottom + 'px' }">
            <!-- 底部导航栏 -->
            <view id="bottom" :style="'position: absolute;bottom:' + safeHeight + ';width: 100%;'">
                <view class="h-start-center m20">
                    <!-- vue无法使用软键盘"发送" -->
                    <input
                        v-model="msg"
                        class="f-grow pl25 mr15 br10 dh-input"
                        type="text"
                        @confirm="check"
                        confirm-type="send"
                        placeholder-class="my-neirong-sm"
                        placeholder="聊两句吧~"
                        cursor-spacing="10"
                        :adjust-position="false"
                    />
                    <button
                        type="primary"
                        class="br40 h-center"
                        @click="check"
                        :disabled="msgLoad"
                        :style="{ width: '80rpx', height: '80rpx', background: '#1cbbb4', padding: '0 !important' }"
                    >
                        <uni-icons class="mt8 mr8" color="white" type="paperplane" size="30"></uni-icons>
                    </button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
import UniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
export default {
    components: {
        UniIcons,
    },
    data() {
        return {
            default_height: 0,
            inputBottom: 0,
            height: 0,
            scrollTop: 1000,
            msgLoad: false,
            anData: {},
            userId: '',
            showTow: false,
            msgList: [
                {
                    role: 'model',
                    content: '你好，我是智能聊天助手，请问有什么可以帮到你?',
                },
            ],
            msg: '',
            limit: false,
        }
    },
    computed: {
        safeHeight() {
            if (this.inputBottom > 60) {
                return '0'
            } else {
                return 'env(safe-area-inset-bottom)'
            }
        },
    },
    onShow() {
        console.log('分包中必须单独引入组件，否则用户直接打开分包页时，由于主包未加载，会导致显示异常')
        let me = this
        uni.onKeyboardHeightChange((res) => {
            me.inputBottom = res.height
            me.height = me.default_height - me.inputBottom
            me.scrollTop += 1 //滚到底部
        })

        uni.getSystemInfo({
            success: (res) => {
                console.log(res)
                let height = res.windowHeight
                height = height - res.safeAreaInsets.bottom - 45
                me.height = height
                me.default_height = height
            },
        })
    },

    methods: {
        check() {
            this.sendMsg()
        },
        async sendMsg() {
            this.msgLoad = true
            const message = this.msg
            this.msgList.push({ role: 'user', content: message })
            this.msg = ''
            this.scrollToButtom()
            const chatRes = await uniCloud.callFunction({
                name: 'chatgpt',
            })
            const messages = [...this.msgList]
            messages.shift()
            try {
                const YOUR_API_KEY = chatRes.result.YOUR_API_KEY
                const {
                    data: { choices },
                    status,
                    statusText,
                } = await uni.request({
                    url: 'https://api.openai.com/v1/chat/completions',
                    method: 'POST',
                    data: {
                        model: 'gpt-3.5-turbo',
                        messages,
                        temperature: 0.6,
                    },
                    header: {
                        Authorization: `Bearer ${YOUR_API_KEY}`,
                    },
                    timeout: 60 * 1000,
                })
                this.msgList.push(choices[0].message)
            } catch (e) {
                console.log(e)
            }

            this.msgLoad = false
        },
        scrollToButtom() {
            this.scrollTop += 1 //滚到底部
            /*
				const query = uni.createSelectorQuery().in(this);
				let nodesRef = query.select('#chat-list');
				nodesRef
					.boundingClientRect(res => {
						this.$nextTick(() => {
							//进入页面滚动到底部
							this.scrollTop = res.height;
						});
					})
					.exec();*/
        },
        copyText(msg) {
            uni.setClipboardData({
                data: msg,
                success() {
                    uni.showToast({
                        title: '已复制到剪贴板',
                        icon: 'none',
                        position: 'top',
                    })
                },
            })
        },
    },
}
</script>

<style>
.container {
    display: flex;
    flex-direction: column;
}
.content {
    flex-grow: 1;
    overflow: auto;
}
.bottom-textarea {
    position: fixed;
    bottom: 0px;
    left: 0px;
    right: 0px;
    display: flex;
}
.chat-item {
    display: flex;
}

.human-item {
    justify-content: flex-end;
}

.chat {
    padding: 8px 12px;
    margin: 5px 10px 5px 10px;
    font-size: 14px;
    max-width: 260px;
}

.item:first-child .chat {
    margin-top: 20px;
}
.chat-human {
    border-radius: 18px 0px 18px 18px;
    background-color: #1cbbb4;
    color: #fff;
}

.chat-ai {
    border-radius: 0px 18px 18px 18px;
    background-color: white;
}

.my-neirong-sm {
    font-size: 14px;
}
.bottom-dh-char {
    background-color: #f9f9f9;
    width: 100%;
    height: 110rpx;
}

.center-box {
    width: 720rpx;
    padding-left: 25rpx;
}

.btn {
    height: 80rpx;
    width: 80rpx;
    margin-left: 15rpx;
}
.flex-row-start {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
}
.hui-box {
    width: 750rpx;
    height: 100%;
}

.dh-input {
    height: 80rpx;
    border: 2rpx solid rgba(0, 0, 0, 0.1);
    background-color: #ffffff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.box-normal {
    width: 750rpx;
    height: 180px;
    background-color: #ffffff;
}

.tb-text view {
    font-size: 65rpx;
}

.tb-text text {
    font-size: 25rpx;
    color: #737373;
}

.chat-img {
    border-radius: 50%;
    width: 100rpx;
    height: 100rpx;
    background-color: #f7f7f7;
}

.tb-nv {
    width: 50rpx;
    height: 50rpx;
}
</style>
