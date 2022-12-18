<template>
    <view class="p25">
        <view v-if="details" class="list-details p30">
            <view class="detail-item h-start-center">
                <text class="f32 fc-66 mr40">出生日期</text>
                <text class="fc-black f-grow w0 ellipsis f32">{{
                    `${details.cYear}-${details.cMonth}-${details.cDay}`
                }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">农历</text>
                <text class="fc-black f32">{{ details.IMonthCn + details.IDayCn }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">生肖</text>
                <text class="fc-black f32">{{ details.Animal }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">星座</text>
                <text class="fc-black f32">{{ details.astro }}</text>
            </view>
        </view>
        <view class="w100 mt30 edit-btn f36 white h-center" @click="back">返回</view>
    </view>
</template>

<script setup>
import { ref } from 'vue'
import { getAge } from '../../../utils/getAge'
import { onLoad } from '@dcloudio/uni-app'

const details = ref()

onLoad((e) => {
    submit(JSON.parse(e.data))
})

function submit(data) {
    const { time, lunar, leap } = data
    details.value = getAge(time, lunar, !!(leap[0] && lunar))
}
function back() {
    uni.navigateBack()
}
</script>

<style lang="scss">
.uni-button {
    width: 184px;
}
</style>
