<template>
    <view class="pl25 pr25 pt25 pb40">
        <date-picker
            v-if="startData"
            :height="400"
            v-model:lunar="startData.startType"
            v-model:leap="startData.leap"
            v-model="startData.start_time"
            :show-lunar="true"
            :end="new Date()"
        >
        </date-picker>

        <button class="f-grow ml20 mr20 mt40 bg-blue" type="primary" @click="submit">提交</button>
    </view>
</template>

<script setup>
const startData = ref()
onLoad(() => {
    startData.value = JSON.parse(uni.getStorageSync('startData'))
    console.log(startData.value)
})

async function submit() {
    // 使用 clientDB 提交数据
    const value = startData.value
    try {
        const res = await db.collection(dbCollectionName).where(`"user_id"==$env.uid`).update(value)
        uni.showToast({
            icon: 'none',
            title: '修改成功',
        })
        uni.setStorageSync('startData', JSON.stringify(value))
        setTimeout(() => uni.navigateBack(), 500)
    } catch (e) {
        console.log(e)
        uni.showModal({
            content: '请求服务失败',
            showCancel: false,
        })
    }
}
</script>

<style></style>
