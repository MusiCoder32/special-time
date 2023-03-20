<template>
    <view class="p25">
        <view class="h-start-start f-wrap">
            <template v-if="toolList.length">
                <view v-for="(item, index) in toolList" :key="item.key" class="tool-item p-r">
                    <view class="shadow w100 h100 h-center white" :style="'background:' + item.color">
                        {{ item.name }}
                    </view>
                    <checkbox-group @change="change($event, index)">
                        <checkbox
                            class="p-a bottom-0 right-0"
                            :checked="item.enable"
                            :value="1"
                            color="#FFCC33"
                            style="transform: scale(0.7)"
                        />
                    </checkbox-group>
                </view>
            </template>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { cloneDeep, debounce } from 'lodash'

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
                    ...obj,
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
    // await getUserTool()
    userList.value = JSON.parse(uni.getStorageSync('userTool'))
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

// async function getUserTool() {
//     try {
//         const res = await db.collection('tool').where("'uid' == $cloudEnv_uid")
//         userList.value = res?.result?.data || []
//     } catch (e) {
//         console.log(e)
//         //TODO handle the exception
//     }
// }

const change = debounce(async function (e, i) {
    const checked = !!e.detail.value[0]
    const startTime = new Date().getTime()
    uni.showLoading({ mask: true })
    const item = cloneDeep(toolConfig.value[i])
    let userItem
    for (var j = 0; j < userList.value.length; j++) {
        const jtem = userList.value[j]
        if (item.key === jtem.key) {
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
            const { result } = await db.collection('tool').add(params)
            item._id = result.id
            item.enable = true
            userList.value.push(item)
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
                    enable: checked,
                })
            //如果更新成功
            if (res.result.updated) {
                userItem.enable = checked
            }
        } catch (e) {
            console.log(e)
        }
    }
    const endTime = new Date().getTime()
    uni.setStorageSync('userTool', JSON.stringify(userList.value))
    setTimeout(() => {
        uni.hideLoading()
        uni.showToast({
            title: '操作成功',
        })
    }, Math.min(1000 - (endTime - startTime)))
}, 100)
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
