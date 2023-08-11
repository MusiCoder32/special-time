<template>
    <view class="p25">
        <view class="list-details p30">
            <view class="detail-item">
                <text class="f32 fc-66 mr40">出生日期</text>
                <text class="fc-black f32">{{
                    startEndData.startType === 0 ? startEndData.solarDate : startEndData.normalTime
                }}</text>
            </view>

            <view class="detail-item" v-if="startEndData.startType">
                <text class="f32 fc-66 mr40">公历</text>
                <text class="fc-black f32">{{ startEndData.solarDate }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">生肖</text>
                <text class="fc-black f32">{{ startEndData.Animal }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">星座</text>
                <text class="fc-black f32">{{ startEndData.astro }}</text>
            </view>
        </view>

        <view class="w100 mt30 edit-btn f36 white h-center" @click="handleUpdate">修改</view>
    </view>
</template>

<script setup>
import { getAge } from '../../utils/getAge'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
const startEndData = ref({})

onShow(() => {
    startEndData.value = handleLoad()
})

function handleLoad() {
    const data = JSON.parse(uni.getStorageSync('startData'))
    const { start_time, startType, leap } = data
    const { Animal, astro, IDayCn, IMonthCn, lYear, cYear, cMonth, cDay } = getAge(start_time, startType, leap)
    data.Animal = `${Animal}`
    data.astro = `${astro}`
    data.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
    data.solarDate = `${cYear}-${cMonth}-${cDay}`
    return data
}

function handleUpdate() {
    // 打开修改页面
    uni.navigateTo({
        url: './edit',
    })
}
</script>

<style lang="scss">
page {
    background: $primary-bg;
}

.btns button {
    flex: 1;
}
</style>
