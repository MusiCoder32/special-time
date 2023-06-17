<template>
    <view>讯飞星火</view>
</template>

<script setup>
import { getAuthorizationUrl } from '@/pages/tool/spark/auth'

const testMsg = {
    header: {
        app_id: '18e5d49f',
        uid: '12345',
    },
    parameter: {
        chat: {
            domain: 'general',
            temperature: 0.5,
            max_tokens: 1024,
        },
    },
    payload: {
        message: {
            text: [
                { role: 'user', content: '你是谁' },
                { role: 'assistant', content: '.....' },
                { role: 'user', content: '你会做什么' },
            ],
        },
    },
}
onShow(() => {
    const wssUrl = getAuthorizationUrl()
    console.log(wssUrl)
    connectToWSS(wssUrl)
})
// 建立 WSS 连接
function connectToWSS(wssUrl) {
    wx.connectSocket({
        url: wssUrl,
        success: function () {
            console.log('WebSocket 连接建立成功')
            // wx.sendSocketMessage({
            //     data: testMsg,
            // })
        },
        fail: function (err) {
            console.error('WebSocket 连接建立失败:', err)
        },
    })

    // 监听 WebSocket 连接成功事件
    wx.onSocketOpen(function () {
        console.log('WebSocket 连接已打开')

        // 在连接成功后可以发送数据
        // wx.sendSocketMessage({
        //   data: 'Hello, WebSocket!'
        // });
    })

    // 监听 WebSocket 接收到服务器的消息事件
    wx.onSocketMessage(function (res) {
        console.log('接收到服务器消息:', res.data)
    })

    // 监听 WebSocket 连接关闭事件
    wx.onSocketClose(function () {
        console.log('WebSocket 连接已关闭')
    })

    // 监听 WebSocket 连接错误事件
    wx.onSocketError(function (err) {
        console.error('WebSocket 连接出现错误:', err)
    })
}
</script>

<style lang="scss" scoped></style>
