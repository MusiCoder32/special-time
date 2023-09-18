<template>
    <view @click="open" class="self-input h-start-center">
        <uni-icons type="calendar" size="22" color="#c0c4cc" />
        <text>{{ title }}</text>
    </view>
    <!-- 筛选弹出层 -->
    <uni-popup ref="popupRef" background-color="rgb(0,0,0,0)" type="bottom" class="z10">
        <view class="bg-white pt40 p-f fc-black left-0 bottom-0 w100 pb40" style="border-radius: 20rpx 20rpx 0 0">
            <date-picker
                v-if="showYear"
                ref="datePickerRef"
                :height="400"
                v-model:lunar="temp.lunar"
                v-model:leap="temp.leap"
                v-model:modelValue="temp.time"
                :show-lunar="showLunar"
                :end="end"
                :yearLength="yearLength"
                @change="dateChange"
            >
            </date-picker>
            <month-day-picker
                v-else
                ref="datePickerRef"
                :height="400"
                v-model:lunar="temp.lunar"
                v-model:modelValue="temp.time"
                :show-lunar="showLunar"
                @change="dateChange"
            />
            <button type="primary" class="f-grow ml20 mr20 bg-blue" @click="confirm">确认</button>
        </view>
    </uni-popup>
</template>

<script setup>
import MonthDayPicker from '@/components/month-day-picker/month-day-picker'
import { debounce } from 'lodash'

const emit = defineEmits(['change', 'update:modelValue'])
const prop = defineProps({
    modelValue: {},
    end: {},
    yearLength: {},
    showLunar: { default: true },
    showYear: { default: true },
})
const popupRef = ref()
const datePickerRef = ref({})
const temp = ref({})
const title = ref('')
watch(
    () => prop.modelValue,
    (val) => {
        const { lunar, leap, time } = val || {}
        if (time) {
            temp.value = {
                lunar: lunar || 0,
                leap: leap || false,
                time: time || new Date().getTime(),
            }
            title.value = datePickerRef.value.dateLabel
        }
    },
    { immediate: true },
)

function open() {
    popupRef.value.open()
}
function dateChange(e) {
    if (prop.modelValue.time) {
        title.value = datePickerRef.value.dateLabel
    }
}
const confirm = debounce(() => {
    nextTick(() => {
        emit('change', temp.value)
        emit('update:modelValue', temp.value)
        popupRef.value.close()
    })
}, 100)
</script>

<style></style>
