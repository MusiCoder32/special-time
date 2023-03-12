<template>
    <view class="p25">
        <view class="h-start-start f-wrap">
            <template v-if="toolList.length">
                <view v-for="(item, index) in toolList" :key="item.key" class="tool-item p-r">
                    <view class="shadow w100 h100 h-center white" :style="'background:' + item.color">
                        {{ item.name }}
                    </view>
                    <checkbox
                        @click="change(index)"
                        class="p-a bottom-0 right-0"
                        :checked="item.enable"
                        color="#FFCC33"
                        style="transform: scale(0.7)"
                    />
                </view>
            </template>
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
    for (let i = 0; i < toolConfig.value.length; i++) {
        const item = toolConfig.value[i]
        let obj = {
            ...item,
            enable: false,
        }
        for (var j = 0; j < userList.value.length; j++) {
            const jtem = userList.value[j]
            if (item.key === jtem.key) {
                obj = {
                    ...item,
                    ...jtem,
                }
                break
            }
        }
        arr.push(obj)
    }
    return arr
})

init()

async function init() {
    uni.showLoading()
    await getToolConfig()
    await getUserTool()
    uni.hideLoading()
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
        const res = await db.collection('tool').where("'uid' == $cloudEnv_uid")
        userList.value = res?.result?.data || []
    } catch (e) {
        console.log(e)
        //TODO handle the exception
    }
}

async function change(i) {
    uni.showLoading()
    const item = toolConfig.value[i]
    let userItem
    for (var j = 0; j < userList.value.length; j++) {
        const jtem = userList.value[j]
        if (item.key === jtem.key) {
            jtem.enable = !jtem.enable
            userItem = jtem
            break
        }
    }
    if (!userItem) {
        try {
            const params = {
                key: item.key,
                enable: true,
            }
            await db.collection('tool').add(params)
            await getUserTool()
        } catch (e) {
            console.log(e)
        }
    } else {
        try {
            const res = await db
                .collection('tool')
                .where({
                    _id: userItem._id,
                })
                .update({
                    enable: userItem.enable,
                })
            //如果更新成功
            if (res.result.update) {
                await getUserTool()
            }
        } catch (e) {
            console.log(e)
        }
    }
    uni.hideLoading()
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
