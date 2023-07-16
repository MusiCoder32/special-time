<template>
    <view @click="open" class="self-input h-start-center">
        <uni-icons type="calendar" size="22" color="#c0c4cc" />
        <text>{{ title }}</text>
    </view>
    <!-- 筛选弹出层 -->
    <uni-popup ref="popupRef" background-color="rgb(0,0,0,0)" type="bottom" class="z10">
        <view class="bg-white pt40 p-f fc-black left-0 bottom-0 w100 pb40" style="border-radius: 20rpx 20rpx 0 0">
            <date-picker
                v-if="temp.time"
                ref="datePickerRef"
                :height="400"
                v-model:lunar="temp.lunar"
                v-model:leap="temp.leap"
                v-model:modelValue="temp.time"
                :show-lunar="showLunar"
                :end="end"
                @change="dateChange"
            >
            </date-picker>
            <button type="primary" class="w80" @click="confirm">确认</button>
        </view>
    </uni-popup>
</template>

<script setup>
import { leapDays, leapMonth, lunarDays, solarDays, toChinaDay, toChinaMonth } from '/utils/calendar'
import dayjs from 'dayjs'
import { LunarType } from '@/utils/emnu'
import { setTime } from '@/utils/getAge'
const emit = defineEmits(['change', 'update:modelValue'])
const prop = defineProps({
    modelValue: {},
    end: {},
    showLunar: { default: true },
})
const popupRef = ref()
const datePickerRef = ref({})
const temp = ref({})
const title = ref('')
const initStatus = ref(true)
watch(
    () => prop.modelValue,
    (val) => {
        const { lunar, leap, time } = val || {}
        if (time) {
            temp.value = {
                lunar: lunar || 0,
                leap: leap || false,
                time: time || new Date(),
            }
        }
    },
    { immediate: true },
)

function open() {
    popupRef.value.open()
}
function dateChange(e) {
    console.log(datePickerRef.value.dateLabel, 444)
    if (initStatus.value) {
        title.value = datePickerRef.value.dateLabel
        initStatus.value = false
    }
}
function confirm() {
    title.value = datePickerRef.value.dateLabel
    emit('change', temp.value)
    emit('update:modelValue', temp.value)
    popupRef.value.close()
}
</script>

<style></style>
