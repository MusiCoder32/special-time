<template>
    <view v-if="showLunar" class="h-center mb20">
        <uni-data-checkbox @change="lunarChange" :value="lunar" :localdata="lunarOption"></uni-data-checkbox>
    </view>
    <picker-view
        :indicator-style="indicatorStyle"
        :immediate-change="true"
        :value="pickerValue"
        @change="dateChange"
        :style="`height:${height}rpx`"
        class="picker-view"
    >
        <picker-view-column>
            <view class="item" v-for="(item, index) in months" :key="index">
                {{ item.label }}{{ lunar === LunarType['公历'] ? '月' : '' }}
            </view>
        </picker-view-column>
        <picker-view-column>
            <view class="item" v-for="(item, index) in days" :key="index">
                {{ item.label }}{{ lunar === LunarType['公历'] ? '日' : '' }}
            </view>
        </picker-view-column>
    </picker-view>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { toChinaDay, toChinaMonth } from '/utils/calendar'
import dayjs from 'dayjs'
import { LunarType, lunarOption } from '@/utils/emnu'
import { setTime } from '@/utils/getAge'
import {debounce}from 'lodash'

console.log(lunarOption)
const emit = defineEmits(['change', 'update:lunar', 'update:leap', 'update:modelValue'])
const prop = defineProps({
    height: {
        type: Number,
        default: 400,
    },
    showLunar: {
        type: Boolean,
        default: false,
    },
    modelValue: {
        default: new Date(),
    },
    lunar: {
        type: Number,
        default: LunarType['公历'],
    },
})
const dateLabel = ref('')
const date = setTime(prop.end || new Date(), false)

const months = computed(() => {
    const result = []
    let len = 12
    let tempBool = prop.lunar === LunarType['公历']
    for (let i = 1; i <= len; i++) {
        result.push({ value: i, label: tempBool ? i : toChinaMonth(i) })
    }
    return result
})

const days = computed(() => {
    const arr = []
    let len
    const dateObj = dayjs(prop.modelValue || new Date())
    let month = dateObj.month()

    if (Array.isArray(months.value) && Array.isArray(pickerValue.value)) {
        const monthObj = months.value[Math.min(pickerValue.value[0], months.value.length - 1)]
        month = monthObj.value
    }

    if (prop.lunar === LunarType['公历']) {
        len = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
        for (let i = 1; i <= len; i++) {
            arr.push({ value: i, label: i })
        }
    } else {
        len = 30
        for (let i = 1; i <= len; i++) {
            arr.push({ value: i, label: toChinaDay(i) })
        }
    }
    return arr
})

let pickerValue = ref([0, 0])
const indicatorStyle = `height: 50px;`
const year = ref()

watch(
    () => [months.value, days.value],
    () => {
        if (Array.isArray(pickerValue.value) && days.value.length > 0) {
            updateData()
        }
    },
)
onMounted(() => {
    init()
})

function init() {
    let arr = []
    if (prop.modelValue) {
        const dateObj = dayjs(prop.modelValue)
        const month = dateObj.month() + 1
        const day = dateObj.date()
        year.value = dateObj.year()
        for (let i = 0; i < months.value.length; i++) {
            if (months.value[i].value === month) {
                arr[0] = i
                break
            }
        }
        for (let i = 0; i < days.value.length; i++) {
            if (days.value[i].value === day) {
                arr[1] = i
                break
            }
        }
    } else {
        arr = [100, 100]
    }
    pickerValue.value = [...arr]
}
function lunarChange(e) {
    emit('update:lunar', e.detail.value)
    nextTick(() => {
        init()
    })
}

const dateChange  = debounce((e)=> {
    pickerValue.value = e.detail.value
},100)
function updateData() {
    const val = pickerValue.value
    const { value: month, label: monthLabel } = months.value[val[0]]
    const { value: day, label: dayLabel } = days.value[val[1]]
    if (prop.lunar) {
        dateLabel.value = `${monthLabel}${dayLabel}` //农历年增加一个空格
    } else {
        dateLabel.value = `${monthLabel}月${dayLabel}日`
    }
    const timestamp = new Date(`${Math.min(year.value, new Date().getFullYear() - 1)}-${month}-${day}`).getTime()
    emit('update:modelValue', timestamp)
    emit('change')
}

defineExpose({
    dateLabel,
})
</script>

<style>
.picker-view {
    width: 100%;
    margin-top: 20rpx;
}

.item {
    height: 50px;
    line-height: 50px;
    text-align: center;
}
</style>