<template>
    <view class="p25">
        <view class="h-start-start f-wrap">
            <template v-if="toolList.length">
                <view
                    v-for="(item, index) in toolList"
                    :key="item.key"
                    @longpress="longpress($event, index)"
                    @click="click($event, index)"
                    class="shadow tool-item h-center white"
                    :style="'background:' + item.color"
                >
                    {{ item.name }}
                </view>
            </template>

            <view @click="add" class="shadow tool-item white h-center">
                <uni-icons color="#aaa" type="plusempty" size="30"></uni-icons>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
const userList = ref([])
const db = uniCloud.database()
const toolConfig = ref([])

const toolList = computed(() => {
    const arr = []
    for (let i = 0; i < userList.value.length; i++) {
        const item = userList.value[i]
        if (item.enable) {
            for (var j = 0; j < toolConfig.value.length; j++) {
                const configItem = toolConfig.value[j]
                if (item.key === configItem.key) {
                    arr.push({ ...item, ...configItem })
                    break
                }
            }
        }
    }
    return arr
})

init()

async function init() {
    uni.showLoading()
    await getToolConfig()
    await getUserTool()
    uni.hideLoading()
    console.log(userList.value)
    console.log(toolConfig.value)
}

async function getToolConfig() {
    try {
        const res = await uniCloud.callFunction({
            name: 'tool-config',
        })
        toolConfig.value = res.result
    } catch (e) {
        console.log(e)
        //TODO handle the exception
    }
}

async function getUserTool() {
    try {
        const res = await db.collection('tool').where("'uid' == $cloudEnv_uid").get()
        userList.value = res?.result?.data || []
        uni.setStorageSync('userTool', JSON.stringify(userList.value))
    } catch (e) {
        console.log(e)
        //TODO handle the exception
        uni.removeStorage({
            key: 'userTool',
        })
    }
}

async function longpress(e, index) {
    const toolItem = toolList.value[index]
    const { confirm } = await uni.showModal({
        title: `是否移除${toolItem.name}`,
    })
    console.log(confirm)
    if (confirm) {
        toolList.value.splice(index, 1)
    }
}
function click(e, index) {
    console.log(e, index)
}
function add() {
    uni.navigateTo({
        url: '/pages/tool/add',
    })
}
</script>

<style lang="scss">
.tool-item {
    width: 160rpx;
    height: 160rpx;
    margin: 0 20rpx 20rpx 0;
    &:nth-child(4n) {
        margin-right: 0;
    }
}
</style>
