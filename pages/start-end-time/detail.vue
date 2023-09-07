<template>
    <view class="p25">
        <view class="list-details p30">
            <view class="detail-item">
                <text class="f32 fc-66 mr40">出生日期</text>
                <text class="fc-black f32">{{ startData.normalTime }}</text>
            </view>

            <view class="detail-item" v-if="startData.startType">
                <text class="f32 fc-66 mr40">公历</text>
                <text class="fc-black f32">{{ startData.solarDate }}</text>
            </view>
            <view class="detail-item h-start-center" v-if="startData.startType">
                <text class="f32 fc-66 mr40">生日日期</text>
                <view class="h-start-center f32 fc-black">
                    <text class="f30 ml2">{{ startData.nextBirthDay }}</text>
                    <view class="ml10 mr8 mtn4 f32">|</view>
                    <text class="fc-red f30 ml2">{{ startData.remainDay }}</text>
                    <text class="f24 ml2 mr2">天</text>
                </view>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">生肖</text>
                <text class="fc-black f32">{{ startData.Animal }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">星座</text>
                <text class="fc-black f32">{{ startData.astro }}</text>
            </view>
        </view>

        <view class="w100 mt30 edit-btn f36 white h-center" @click="handleUpdate">修改</view>
    </view>
    <!-- 筛选弹出层 -->
    <uni-popup ref="popupRef" background-color="rgb(0,0,0,0)" type="bottom" class="z10">
        <view class="bg-white pt40 p-f fc-black left-0 bottom-0 w100 pb40" style="border-radius: 20rpx 20rpx 0 0">
            <date-picker
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
    </uni-popup>
</template>

<script setup>
import { getDateDetails } from '@/utils/getAge'
import { SpecialDayType } from '@/utils/emnu'

const db = uniCloud.database()
const dbCollectionName = 'start-end-time'
const startData = ref({})
const popupRef = ref()

onShow(() => {
    getDetail()
})

function getDetail() {
    const data = JSON.parse(uni.getStorageSync('startData'))
    const { start_time, startType, leap } = data
    const dateDetails = getDateDetails({ time: start_time, lunar: startType, leap, type: SpecialDayType['生日'] })
    startData.value = { ...data, ...dateDetails }
}

function handleUpdate() {
    popupRef.value.open()
}

async function submit() {
    uni.showLoading({ mask: true })
    popupRef.value.close()
    const { start_time, startType, leap } = startData.value
    const value = { start_time, startType, leap }
    try {
        const res = await db.collection(dbCollectionName).where(`"user_id"==$env.uid`).update(value)
        uni.hideLoading()
        uni.showToast({
            icon: 'none',
            title: '修改成功',
        })
        uni.setStorageSync('startData', JSON.stringify(value))
        getDetail()
    } catch (e) {
        console.log(e)
        uni.hideLoading()
        uni.showModal({
            content: '日期修改失败',
            showCancel: false,
        })
    }
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
