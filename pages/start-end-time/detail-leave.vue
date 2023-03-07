<template>
    <view class="p25">
        <view class="list-details p30">
            <view class="detail-item">
                <text class="f32 fc-66 mr40">计划离开日期</text>
                <text class="fc-black f32">{{ endData.end_time }}</text>
            </view>

            <view class="detail-item">
                <text class="f32 fc-66 mr40">是否首页启用</text>
                <text class="fc-black f32" :class="endData.show_end_time ? '' : 'fc-orange'">{{
                    endData.show_end_time ? '启用' : '不启用'
                }}</text>
            </view>
        </view>

        <view class="w100 mt30 edit-btn f36 white h-center" @click="handleUpdate">修改</view>
    </view>
</template>

<script setup>
import { getAge } from '../../utils/getAge'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import dayjs from 'dayjs'
const endData = ref({})

onShow(() => {
    endData.value = handleLoad()
})

function handleLoad() {
    const data = JSON.parse(uni.getStorageSync('endData'))
    const { end_time, show_end_time } = data
    return {
        end_time: dayjs(end_time).format('YYYY-MM-DD'),
        show_end_time,
    }
}
function handleUpdate() {
    // 打开修改页面
    uni.navigateTo({
        url: './edit-leave',
    })
}
</script>

<style>
.container {
    padding: 10px;
}

.btns {
    margin-top: 10px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
}

.btns button {
    flex: 1;
}

.btn-delete {
    margin-left: 10px;
}
</style>
