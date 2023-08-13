<template>
    <view class="h100 v-center">
        <scroll-view :scroll-into-view="scrollIntoView" scroll-y="true" class="msg-list" :enable-flex="true">
            <uni-ai-msg
                :msg="{
                    isAi: true,
                    content: '欢迎来到智能ai助手时光丫！',
                }"
            >
            </uni-ai-msg>
            <uni-ai-msg
                ref="msg"
                v-for="(msg, index) in msgList"
                :key="index"
                :msg="msg"
                @changeAnswer="changeAnswer"
                :show-cursor="index == msgList.length - 1 && msgList.length % 2 === 0 && sseIndex"
                :isLastMsg="index == msgList.length - 1"
                @removeMsg="removeMsg(index)"
            ></uni-ai-msg>
            <template v-if="msgList.length % 2 !== 0">
                <view v-if="requestState == -100" class="h-center retries-box">
                    <text>消息发送失败</text>
                    <uni-icons @click="send" color="#d22" type="refresh-filled" class="retries-icon"></uni-icons>
                </view>
                <view class="tip-ai-ing h-center" v-else-if="msgList.length">
                    <text>时光丫正在思考中...</text>
                    <view v-if="NODE_ENV == 'development' && !enableStream">
                        如需提速，请开通<uni-link
                            class="uni-link"
                            href="https://uniapp.dcloud.net.cn/uniCloud/uni-ai-chat.html"
                            text="[流式响应]"
                        ></uni-link>
                    </view>
                </view>
            </template>

            <view @click="closeSseChannel" class="stop-responding" v-if="sseIndex"> ▣ 停止响应</view>
            <view id="last-msg-item" style="height: 1px"></view>
            <view class="pb30"></view>
        </scroll-view>

        <view class="pt10 bg-white w100" :style="{ 'padding-bottom': footBoxPaddingBottom }">
            <view class="h-between-center w100">
                <view v-if="!isWidescreen" class="h-center p20">
                    <uni-icons class="menu-item" @click="clearAllMsg" type="trash" size="24" color="#888"></uni-icons>
                </view>
                <view class="textarea-box bg-primary f-grow w0">
                    <textarea
                        v-model="content"
                        :cursor-spacing="15"
                        class="textarea"
                        :auto-height="!isWidescreen"
                        :placeholder="placeholderText"
                        :maxlength="-1"
                        :adjust-position="false"
                        :disable-default-padding="false"
                        placeholder-class="input-placeholder"
                    ></textarea>
                </view>
                <view
                    class="ml10"
                    :title="msgList.length && msgList.length % 2 !== 0 ? '时光丫正在回复中不能发送' : ''"
                >
                    <button
                        @click="check"
                        class="h-center mr10"
                        type="primary"
                        style="height: 60rpx; background: #1cbbb4; padding: 10rpx 20rpx"
                    >
                        <uni-icons class="mt8 mr8" color="white" type="paperplane" size="20"></uni-icons>
                        <text class="f26">{{ chatCount }}</text>
                    </button>
                </view>
            </view>
        </view>
    </view>
    <ad-video ref="adVideo" :showLoading="false" :record="false" :action="beforeSend" />
</template>

<script setup>
import { shareMessageCall, shareTimelineCall } from '@/utils/common'

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)
</script>

<script>
import AdVideo from '@/components/ad-video.vue'
import UniAiMsg from './components/uni-ai-msg/uni-ai-msg.vue'
// 导入uniCloud云对象task模块
import uniCoTask from '@/common/unicloud-co-task.js'
// 收集所有执行云对象的任务列表
let uniCoTaskList = []
// 定义终止并清空 云对象的任务列表中所有 任务的方法
uniCoTaskList.clear = function () {
    // 执行数组内的所有任务
    uniCoTaskList.forEach((task) => task.abort())
    // 清空数组
    uniCoTaskList.slice(0, uniCoTaskList.length)
}

// 初始化sse通道
let sseChannel = false

// 键盘的shift键是否被按下
let shiftKeyPressed = false

export default {
    data() {
        return {
            // 使聊天窗口滚动到指定元素id的值
            scrollIntoView: '',
            // 消息列表数据
            msgList: [],
            // 通讯请求状态
            requestState: 0, //0发送中 100发送成功 -100发送失败
            // 输入框的消息内容
            content: '',
            // 记录流式响应次数
            sseIndex: 0,
            // 是否启用流式响应模式
            enableStream: true,
            // 当前屏幕是否为宽屏
            isWidescreen: false,
            llmModel: false,
            keyboardHeight: 0,
            chatCount: 0, //剩余会话数量
        }
    },
    components: {
        AdVideo,
        UniAiMsg,
    },
    computed: {
        // 输入框是否禁用
        inputBoxDisabled() {
            // 如果正在等待流式响应，则禁用输入框
            if (this.sseIndex !== 0) {
                return true
            }
            // 如果消息列表长度为奇数，则禁用输入框
            return !!(this.msgList.length && this.msgList.length % 2 !== 0)
        },
        // 输入框占位符文本
        placeholderText() {
            return '请输入要发给uni-ai的内容'
        },
        // 获取当前环境
        NODE_ENV() {
            return process.env.NODE_ENV
        },
        footBoxPaddingBottom() {
            return (this.keyboardHeight || 10) + 'px'
        },
    },
    // 监听msgList变化，将其存储到本地缓存中
    watch: {
        // msgList: {
        //     handler(msgList) {
        //         // 将msgList存储到本地缓存中
        //         uni.setStorage({
        //             key: 'uni-ai-msg',
        //             data: msgList,
        //         })
        //     },
        //     // 深度监听msgList变化
        //     deep: true,
        // },
        llmModel(llmModel) {
            let title = 'uni-ai-chat'
            if (llmModel) {
                title += ` (${llmModel})`
            }
            uni.setStorage({
                key: 'uni-ai-chat-llmModel',
                data: llmModel,
            })
        },
    },
    beforeMount() {},
    async mounted() {
        const countStorage = uni.getStorageSync('chatCount')
        this.chatCount = countStorage === '' || countStorage === undefined ? 3 : countStorage
        // // 获得历史对话记录
        // this.msgList = uni.getStorageSync('uni-ai-msg') || []

        // 获得之前设置的llmModel
        this.llmModel = uni.getStorageSync('uni-ai-chat-llmModel')

        // // 在dom渲染完毕后 使聊天窗口滚动到最后一条消息
        // this.$nextTick(() => {
        //     this.showLastMsg()
        // })

        uni.onKeyboardHeightChange((e) => {
            this.keyboardHeight = e.height
            // 在dom渲染完毕后 使聊天窗口滚动到最后一条消息
            this.$nextTick(() => {
                this.showLastMsg()
            })
        })
    },
    methods: {
        check() {
            if (this.inputBoxDisabled) {
                return uni.showToast({
                    title: '时光丫正在回复中不能发送',
                    icon: 'none',
                })
            }

            // 如果内容为空
            if (!this.content) {
                // 弹出提示框
                return uni.showToast({
                    // 提示内容
                    title: '内容不能为空',
                    // 不显示图标
                    icon: 'none',
                })
            }
            if (this.chatCount > 0) {
                this.beforeSend()
            } else {
                this.$refs.adVideo.beforeOpenAd({
                    useScore: 5,
                    comment: '时光丫聊天',
                })
            }
        },
        // 此(惰性)函数，检查是否开通uni-push;决定是否启用enableStream
        async checkIsOpenPush() {
            try {
                // 获取推送客户端id
                await uni.getPushClientId()
                // 如果获取成功，则将checkIsOpenPush函数重写为一个空函数
                this.checkIsOpenPush = () => {}
            } catch (err) {
                // 如果获取失败，则将enableStream设置为false
                this.enableStream = false
            }
        },
        // 更新最后一条消息
        updateLastMsg(param) {
            let length = this.msgList.length
            if (length === 0) {
                return
            }
            let lastMsg = this.msgList[length - 1]

            // 如果param是函数，则将最后一条消息作为参数传入该函数
            if (typeof param == 'function') {
                let callback = param
                callback(lastMsg)
            } else {
                // 否则，将参数解构为data和cover两个变量
                const [data, cover = false] = arguments
                if (cover) {
                    lastMsg = data
                } else {
                    lastMsg = Object.assign(lastMsg, data)
                }
            }
            this.msgList.splice(length - 1, 1, lastMsg)
        },
        // 换一个答案
        async changeAnswer() {
            // 如果问题还在回答中需要先关闭
            if (this.sseIndex) {
                this.closeSseChannel()
            }
            //删除旧的回答
            this.msgList.pop()
            this.updateLastMsg({
                // 防止 偶发答案涉及敏感，重复回答时。提问内容 被卡掉无法重新问
                illegal: false,
            })
            this.send()
        },
        //当消息涉及敏感
        removeMsg(index) {
            // 如果问题还在回答中需要先关闭
            if (this.sseIndex) {
                this.closeSseChannel()
            }

            if (this.msgList[index].isAi) {
                index -= 1
            }
            this.msgList.splice(index, 2)
        },
        async beforeSend(notFree) {
            //notFree代表观看了广告或消耗了时光币
            if (notFree) {
                this.chatCount = 10
            }

            // 将用户输入的消息添加到消息列表中
            this.msgList.push({
                // 标记为非人工智能机器人，即：为用户发送的消息
                isAi: false,
                // 消息内容
                content: this.content,
                // 消息创建时间
                create_time: Date.now(),
            })

            // 展示最后一条消息
            this.showLastMsg()
            // dom加载完成后 清空文本内容
            this.$nextTick(() => {
                this.content = ''
            })
            this.send() // 发送消息
        },
        async send() {
            // 请求状态归零
            this.requestState = 0
            // 防止重复发起，关闭之前的
            uniCoTaskList.clear()
            // 清除旧的afterChatCompletion（如果存在）
            if (this.afterChatCompletion && this.afterChatCompletion.clear) this.afterChatCompletion.clear()

            let messages = []
            // 复制一份，消息列表数据
            let msgs = JSON.parse(JSON.stringify(this.msgList))
            // 带总结的消息 index
            let findIndex = [...msgs].reverse().findIndex((item) => item.summarize)
            // console.log('findIndex', findIndex)
            if (findIndex != -1) {
                let aiSummaryIndex = msgs.length - findIndex - 1
                // console.log('aiSummaryIndex', aiSummaryIndex)
                // 将带总结的消息的 内容 更换成 总结
                msgs[aiSummaryIndex].content = msgs[aiSummaryIndex].summarize
                // 拿最后一条带直接的消息作为与ai对话的msg body
                msgs = msgs.splice(aiSummaryIndex)
            } else {
                // 如果未总结过就直接从末尾拿10条
                msgs = msgs.splice(-10)
            }
            // 过滤涉敏问题
            msgs = msgs.filter((msg) => !msg.illegal)
            // 根据数据内容设置角色
            messages = msgs.map((item) => {
                // 角色默认为用户
                let role = 'user'
                // 如果是ai再根据 是否有总结 来设置角色为 system 还是 assistant
                if (item.isAi) {
                    role = item.summarize ? 'system' : 'assistant'
                }
                return {
                    content: item.content,
                    role,
                }
            })

            // 在控制台输出 向ai机器人发送的完整消息内容
            console.log('send to ai messages:', messages)

            // 检查是否开通uni-push;决定是否启用enableStream
            await this.checkIsOpenPush()
            // console.log('this.enableStream',this.enableStream);

            // 流式响应和云对象的请求结束回调函数
            let sseEnd, requestEnd
            // 判断是否开启了流式响应模式
            if (this.enableStream) {
                // 创建消息通道
                sseChannel = new uniCloud.SSEChannel()
                // console.log('sseChannel',sseChannel);
                // 监听message事件
                sseChannel.on('message', (message) => {
                    // console.log('on message', message);
                    // 将从云端接收到的消息添加到消息列表中

                    // 如果之前未添加过就添加，否则就执行更新最后一条消息
                    if (this.sseIndex === 0) {
                        this.msgList.push({
                            isAi: true,
                            content: message,
                            create_time: Date.now(),
                        })
                    } else {
                        this.updateLastMsg((lastMsg) => {
                            lastMsg.content += message
                        })
                    }
                    this.showLastMsg()
                    // 让流式响应计数值递增
                    this.sseIndex++
                })

                // 监听end事件，如果云端执行end时传了message，会在客户端end事件内收到传递的消息
                sseChannel.on('end', (e) => {
                    console.log('sse 结束', e)
                    console.log(this.msgList)
                    this.chatCount -= 1
                    uni.setStorage({
                        key: 'chatCount',
                        data: this.chatCount,
                    })
                    if (e && typeof e == 'object' && e.errCode) {
                        let setLastAiMsgContent = (content) => {
                            // console.log(content);
                            // 如果最后一项不是ai的就添加，否则就执行更新最后一条消息
                            if (this.sseIndex === 0) {
                                this.msgList.push({
                                    isAi: true,
                                    content,
                                    create_time: Date.now(),
                                })
                            } else {
                                this.updateLastMsg((lastMsg) => {
                                    lastMsg.content += content
                                })
                            }
                            this.showLastMsg()
                        }
                        if (e.errCode == 60004) {
                            //服务商检测到AI输出了敏感内容
                            let length = this.msgList.length
                            //如果最后一项不是ai，就创建一项
                            if (length % 2) {
                                this.msgList.push({
                                    isAi: true,
                                    content: '内容涉及敏感',
                                    illegal: true,
                                    create_time: Date.now(),
                                })
                                length += 1
                            }
                            // 更新倒数第2项 用户提的问题
                            this.msgList[length - 2].illegal = true
                            // 更新倒数第1项 ai 回答的内容
                            this.msgList[length - 1].illegal = true
                            this.msgList[length - 1].content = '内容涉及敏感'
                        } else {
                            setLastAiMsgContent(e.errMsg)
                        }
                    }
                    sseEnd()
                })
                await sseChannel.open() // 等待通道开启

                // 等待对话完成（云函数请求完成，sse 执行了 end）之后
                ;(function fnSelf(that) {
                    fnSelf.clear = () => {
                        // console.log('do fnSelf.clear');
                        if (fnSelf.clear.sse) {
                            // console.log('fnSelf.clear.sse();')
                            fnSelf.clear.sse()
                        }
                        if (fnSelf.clear.request) {
                            // console.log('fnSelf.clear.request();')
                            fnSelf.clear.request()
                        }
                    }
                    Promise.all([
                        new Promise((resolve, reject) => {
                            sseEnd = resolve
                            fnSelf.clear.sse = reject
                        }),
                        new Promise((resolve, reject) => {
                            requestEnd = resolve
                            fnSelf.clear.request = reject
                        }),
                    ])
                        .then((e) => {
                            // console.log('sseEnd && requestEnd');
                            //当两个都结束时
                            sseChannel.close()
                            // 结束流式响应 将流式响应计数值 设置为 0
                            that.sseIndex = 0
                        })
                        .catch((err) => {
                            // console.log('afterChatCompletion is close',err);
                        })
                    that.afterChatCompletion = fnSelf
                })(this)
            }

            // 导入uni-ai-chat模块，并设置customUI为true
            let task = uniCoTask({
                coName: 'uni-ai-chat',
                funName: 'send',
                param: [
                    {
                        messages, // 消息列表
                        sseChannel, // 消息通道
                        llmModel: this.llmModel,
                    },
                ],
                config: {
                    customUI: true,
                },
                success: (res) => {
                    // 更新 通讯状态为100（发送成功）
                    this.requestState = 100
                    // console.log("success",res);
                    if (!res.data) return

                    let { reply, summarize, illegal } = res.data

                    // 特殊处理 - start
                    if (this.enableStream == false && !reply) {
                        //服务商检测到AI输出了敏感内容
                        illegal = true
                        reply = '内容涉及敏感'
                    }
                    // 特殊处理 - end

                    // 非流式模式 或者流式模式，但列表还没有数据且已经进入异常的情况下
                    if (this.enableStream == false || (this.sseIndex == 0 && illegal)) {
                        // 将从云端接收到的消息添加到消息列表中
                        this.msgList.push({
                            // 消息创建时间
                            create_time: Date.now(),
                            // 标记消息为来自AI机器人
                            isAi: true,
                            // 消息内容
                            content: reply,
                            // 消息是否涉敏标记
                            illegal,
                        })
                    }
                    // 如果回调包含总结的内容，就设置总结
                    if (summarize) {
                        console.log(' 拿到总结', summarize)
                        // 总结的内容是上一轮对话的
                        // console.log('setSummarize');
                        let index = this.msgList.length
                        // 如果最后一项是ai就往前退2项，否则退一项（流式响应的时候，回答可能晚于总结）
                        if (index % 2 === 0) {
                            index -= 2
                        } else {
                            index -= 1
                        }
                        // 假如第一次提问就需要总结
                        if (index < 0) {
                            index = 0
                        }
                        let msg = this.msgList[index]
                        msg.summarize = summarize
                        this.msgList.splice(index, 1, msg)
                        // console.log('setSummarize this.msgList',this.msgList);
                    }
                    if (illegal) {
                        console.error('内容涉及敏感')
                        this.updateLastMsg({
                            // 添加消息涉敏标记
                            illegal: true,
                        })
                    }
                },
                complete: (e) => {
                    if (this.enableStream) {
                        requestEnd()
                    }
                    // console.log('complete:',e);
                    // 滚动窗口以显示最新的一条消息
                    this.$nextTick(() => {
                        this.showLastMsg()
                    })
                },
                fail: (e) => {
                    console.error(e)
                    // 更新 通讯状态为-100（发送失败）
                    this.requestState = -100
                    // 弹框提示用户错误原因
                    uni.showModal({
                        content: JSON.stringify(e.message),
                        showCancel: false,
                    })
                    // 如果启用流式，云函数出错了，sse 也应当被终止
                    if (this.enableStream) {
                        sseEnd()
                    }
                },
            })
            uniCoTaskList.push(task)
        },
        closeSseChannel() {
            // 如果存在消息通道，就关闭消息通道
            if (sseChannel) {
                sseChannel.close()
                // 设置为 false 防止重复调用closeSseChannel时出错
                sseChannel = false
            }
            // 清空历史网络请求（调用云对象）任务
            uniCoTaskList.clear()
            // 将流式响应计数值归零
            this.sseIndex = 0
        },
        // 滚动窗口以显示最新的一条消息
        showLastMsg() {
            // 等待DOM更新
            this.$nextTick(() => {
                // 将scrollIntoView属性设置为"last-msg-item"，以便滚动窗口到最后一条消息
                this.scrollIntoView = 'last-msg-item'
                // 等待DOM更新，即：滚动完成
                this.$nextTick(() => {
                    // 将scrollIntoView属性设置为空，以便下次设置滚动条位置可被监听
                    this.scrollIntoView = ''
                })
            })
        },
        // 清空消息列表
        clearAllMsg(e) {
            // 弹出确认清空聊天记录的提示框
            uni.showModal({
                title: '确认要清空聊天记录？',
                content: '本操作不可撤销',
                complete: (e) => {
                    // 如果用户确认清空聊天记录
                    if (e.confirm) {
                        // 关闭ssh请求
                        this.closeSseChannel()
                        // 将消息列表清空
                        this.msgList.splice(0, this.msgList.length)
                    }
                },
            })
        },
    },
}
</script>

<style lang="scss">
@import './components/uni-ai-msg/uni-ai-msg.scss';

page {
    height: 100%;
    width: 100%;
    background: $primary-bg;
}

.stop-responding {
    font-size: 14px;
    border-radius: 3px;
    margin-bottom: 15px;
    background-color: #f0b00a;
    color: #fff;
    width: 90px;
    height: 30px;
    line-height: 30px;
    margin: 0 auto;
    justify-content: center;
    margin-bottom: 15px;
}

.stop-responding:hover {
    box-shadow: 0 0 10px #aaa;
}

.textarea-box {
    padding: 8px 10px;
    border-radius: 5px;
}

.textarea-box .textarea {
    max-height: 120px;
    font-size: 14px;
    width: 100%;
    font-size: 14px;
}

.input-placeholder {
    color: #bbb;
    line-height: 18px;
}

.trash {
    width: 80px;
    height: 30px;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
}

.trash {
    width: 30rpx;
    margin-left: 10rpx;
}

.menu-item {
    width: 30rpx;
    margin: 0 10rpx;
}

.send {
    color: #fff;
    border-radius: 4px;
    display: flex;
    margin: 0;
    padding: 0;
    font-size: 14px;
    margin-right: 20rpx;
}

.send::after {
    display: none;
}

.msg-list {
    height: 0; //不可省略，先设置为0 再由flex: 1;撑开才是一个滚动容器
    flex: 1;
    width: 750rpx;
    // border: 1px solid red;
}

.noData {
    margin-top: 15px;
    text-align: center;
    width: 750rpx;
    color: #aaa;
    font-size: 12px;
    justify-content: center;
}

.open-ad-btn-box {
    justify-content: center;
    margin: 10px 0;
}

.tip-ai-ing {
    color: #919396;
}

.uni-link {
    margin-left: 5px;
    line-height: 20px;
}

.retries-box {
    font-size: 12px;
    color: #d2071b;
}
.retries-icon {
    margin-top: 1px;
    margin-left: 5px;
}
</style>
