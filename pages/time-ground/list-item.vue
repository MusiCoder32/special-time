<template>
    <view class="v-start-center mb20 p-r">
        <view @click="handleItemClick(date._id)" class="w100 h100 p-a z1 top-0 left-0 op0"></view>

        <view class="v-center">
            <view class="h-start-center mb5">
                <image
                    v-if="SpecialDayType[date.type] === '提醒日'"
                    src="/static/alert.svg"
                    style="width: 40rpx; height: 40rpx"
                ></image>
                <image
                    v-if="SpecialDayType[date.type] === '生日'"
                    src="/static/birthday.svg"
                    style="width: 40rpx; height: 40rpx"
                ></image>
                <image
                    v-if="SpecialDayType[date.type] === '纪念日' || SpecialDayType[date.type] === '节日'"
                    src="/static/commemorate.svg"
                    style="width: 40rpx; height: 40rpx"
                ></image>
                <view style="width: 180rpx; letter-spacing: -2rpx" class="f30 ml5 ellipsis">
                    {{ date.name }}
                </view>
            </view>

            <uni-file-picker
                class="h-center"
                readonly
                disable-preview
                :modelValue="cover"
                :imageStyles="{
                    width: '225rpx',
                    height: '360rpx',
                    border: {
                        radius: '20rpx',
                    },
                }"
                file-mediatype="image"
            >
            </uni-file-picker>

            <view v-if="false" class="h-center w100 mt5">
                <view v-if="date.type === SpecialDayType['纪念日'] && totalDay(date.time) > 0" class="h-start-center">
                    <view class="mr8 f28 fc-orange">{{ totalDay(date.time) }}</view>
                    <view class="f24">天</view>
                </view>
                <view v-if="date.type === SpecialDayType['生日']" class="h-start-center mt5">
                    <view class="mr8 f28 fc-orange">{{ date.age }}</view>
                    <view class="f24">岁</view>
                    <view class="ml10 mr8 mtn4 f32">|</view>
                    <view class="mr8 f28 fc-orange">{{ date.allDay }}</view>
                    <view class="f24">天</view>
                </view>
            </view>
            <view v-if="false" class="h-center w100 mt5">
                <view class="f28 ml5 fc-gray">{{
                    SpecialDayType[date.type] === '节日' ? date.normalTime?.slice(5) : date.normalTime
                }}</view>
            </view>

            <view v-if="date.remainDay" class="h-start-center fc-gray f28 mt10 w100 pr20">
                <template v-if="date.remainDay < 0 && date.type === SpecialDayType['提醒日']">
                    <view class="h-between-center w100">
                        <view class="f24">过去</view>
                        <view class="h-center">
                            <view class="f30 ml8 mr8 fc-gray">{{ 0 - date.remainDay }}</view>
                            <view class="f24">天</view>
                        </view>
                    </view>
                </template>
                <template v-else>
                    <view class="h-between-center w100">
                        <view v-if="false" class="h-start-center">
                            <view class="ml8 mr8">{{ date.nextBirthDay }}</view>
                        </view>
                        <view class="f24">距离</view>
                        <view class="h-start-center">
                            <view class="f30 ml8 mr8 fc-red">{{ date.remainDay }}</view>
                            <view class="f24">天</view>
                        </view>
                    </view>
                </template>
            </view>
            <view v-else class="f28 w100 ellipsis t-center mr2 fc-orange mt10">今天哦 </view>

            <view class="p-a favorite-box">
                <view class="h-end-center h100 pl5 pr5">
                    <uni-icons type="star" size="14" color="#fff" class="h-center"></uni-icons>
                    <text class="white f24 ml5">{{
                        date.favorite > 100 * 1000
                            ? '10w+'
                            : date.favorite > 1 * 1000
                            ? (date.favorite / 1000).toFixed(1) + 'k'
                            : date.favorite
                    }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { getAge, totalDay } from '@/utils/getAge'
import { SpecialDayType } from '@/utils/emnu'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash'

const props = defineProps({
    modelValue: {
        default: () => {},
    },
})
const date = computed(() => {
    let result = {}
    if (!isEmpty(props.modelValue)) {
        result = { ...props.modelValue }
    }
    return result
})
const cover = computed(() => {
    return date.value.poster[Math.floor(Math.random() * date.value.poster.length)]
})

function handleItemClick(id) {
    uni.navigateTo({
        url: `./detail?specialDayId=${id}`,
    })
}
</script>

<style lang="scss" scoped>
.favorite-box {
    top: 60rpx;
    right: 30rpx;
    height: 30rpx;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4rpx;
}
</style>
