<template>
    <!--                  日期名称-->
    <view class="h-start-center w100">
        <image
            v-if="SpecialDayType[date.type] === '提醒日'"
            src="/static/alert.svg"
            style="width: 50rpx; height: 50rpx"
        ></image>
        <image
            v-if="SpecialDayType[date.type] === '生日'"
            src="/static/birthday.svg"
            style="width: 50rpx; height: 50rpx"
        ></image>
        <image
            v-if="SpecialDayType[date.type] === '纪念日' || SpecialDayType[date.type] === '节日'"
            src="/static/commemorate.svg"
            style="width: 50rpx; height: 50rpx"
        ></image>
        <view class="f16 f-grow w0 f32 ellipsis ml8 fc-black">{{
            SpecialDayType[date.type] === '生日' ? date.name + SpecialDayType[date.type] : date.name
        }}</view>
        <view class="ml30"></view>
    </view>

    <view class="fc-gray f28 h-start-center mt10">
        <view>{{ SpecialDayType[date.type] === '节日' ? date.normalTime?.slice(5) : date.normalTime }}</view>
        <view v-if="date.type === SpecialDayType['纪念日'] && totalDay(date.time) > 0" class="h-start-center">
            <view class="ml10 mr8 mtn4 f32">|</view>
            <view class="mr8 fc-orange">{{ totalDay(date.time) }}</view>
            <view>天</view>
        </view>
        <view v-if="date.type === SpecialDayType['生日']" class="h-start-center mt5">
            <view class="ml10 mr8 mtn4 f32">|</view>
            <view class="mr8 fc-orange">{{ date.age }}</view>
            <view>岁</view>
            <view class="ml10 mr8 mtn4 f32">|</view>
            <view class="mr8 fc-orange">{{ date.allDay }}</view>
            <view>天</view>
        </view>
    </view>

    <view v-if="date.remainDay" class="h-start-center fc-gray f28 mt10 w100">
        <template v-if="date.remainDay < 0 && date.type === SpecialDayType['提醒日']">
            <view class="h-between-center w100">
                <view class="">距离{{ SpecialDayType[date.type] }}过去</view>
                <view class="h-center">
                    <view class="f36 ml8 mr8 fc-gray">{{ 0 - date.remainDay }}</view>
                    <view>天</view>
                </view>
            </view>
        </template>
        <template v-else>
            <view class="h-between-center w100">
                <view class="h-start-center">
                    <view class="">距离{{ SpecialDayType[date.type] }}</view>
                    <view class="ml8 mr8">{{ date.nextBirthDay }}</view>
                </view>
                <view class="h-start-center">
                    <view class="f36 ml8 mr8 fc-red">{{ date.remainDay }}</view>
                    <view>天</view>
                </view>
            </view>
        </template>
    </view>
    <view v-else class="f32 w100 ellipsis mr2 fc-orange mt10"
        >今天是{{ date.name + '的' + SpecialDayType[date.type] }}
    </view>
</template>

<script setup>
import { totalDay } from '@/utils/getAge'
import { SpecialDayType } from '@/utils/emnu'
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
</script>

<style lang="scss" scoped></style>
