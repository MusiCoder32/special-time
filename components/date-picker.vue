<template>
    <view v-if="showLunar" class="h-center mb20">
        <uni-data-checkbox @change="lunarChange" :value="lunar" :localdata="lunarRadio"></uni-data-checkbox>
    </view>
    <picker-view
        :indicator-style="indicatorStyle"
        :value="pickerValue"
        @change="dateChange"
        :style="`height:${height}rpx`"
        class="picker-view"
    >
        <picker-view-column>
            <view class="item" v-for="(item, index) in years" :key="index">{{ item }}年</view>
        </picker-view-column>
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
import { onMounted, reactive, computed, ref } from 'vue'
import { leapDays, leapMonth, lunarDays, solarDays, toChinaDay, toChinaMonth } from '/utils/calendar'
import dayjs from 'dayjs'
import { LunarType } from '../utils/emnu'
import { setTime } from '../utils/getAge'
const emit = defineEmits(['change', 'update:lunar', 'update:leap', 'update:modelValue'])
const prop = defineProps({
    end: {},
    height: {
        type: Number,
        default: 400,
    },
    yearLength: {
        type: Number,
        default: -100,
    },
    showLunar: {
        type: Boolean,
        default: false,
    },
    modelValue: {},
    lunar: {
        type: Number,
        default: LunarType['公历'],
    },
    leap: {},
})

const lunarRadio = []
for (const lunarTypeKey in LunarType) {
    if (typeof LunarType[lunarTypeKey] === 'number') {
        lunarRadio.push({
            value: LunarType[lunarTypeKey],
            text: lunarTypeKey,
        })
    }
}
const date = setTime(prop.end || new Date(), false)
const selectedDate = ref({})

const years = ref([])
if (prop.yearLength > 0) {
    for (let i = date.cYear; i <= date.cYear + prop.yearLength; i++) {
        if (!prop.end) {
            years.value.push(i)
        } else {
            if (dayjs(prop.end).year() >= i) {
                years.value.push(i)
            }
        }
    }
} else {
    for (let i = date.cYear + prop.yearLength; i <= date.cYear; i++) {
        if (!prop.end) {
            years.value.push(i)
        } else {
            if (selectedDate.value.year >= i) {
                years.value.push(i)
            }
        }
    }
}

const months = computed(() => {
    const result = []
    let len = 12

    if (prop.lunar === LunarType['公历']) {
        if (prop.end && selectedDate.value.year === date.cYear) {
            len = date.cMonth
        }

        for (let i = 1; i <= len; i++) {
            result.push({ value: i, label: i })
        }
    } else {
        if (prop.end && selectedDate.value.year === date.lYear) {
            len = date.lMonth
        }
        const leap = leapMonth(selectedDate.value.year)
        for (let i = 1; i <= len; i++) {
            result.push({ value: i, label: toChinaMonth(i) })
            if (leap > 0 && leap === i) {
                result.push({ value: leap, label: '\u95f0' + toChinaMonth(i), leap: true })
            }
        }
    }

    return result
})

const days = computed(() => {
    const arr = []
    let len
    if (prop.lunar === LunarType['公历']) {
        len = solarDays(selectedDate.value.year, selectedDate.value.month)
        if (prop.end && date.cYear === selectedDate.value.year && date.cMonth === selectedDate.value.month) {
            len = date.cDay
        }
        for (let i = 1; i <= len; i++) {
            arr.push({ value: i, label: i })
        }
    } else {
        if (prop.leap) {
            len = leapDays(selectedDate.value.year)
        } else {
            len = lunarDays(selectedDate.value.year, selectedDate.value.month)
        }
        if (prop.end && date.lYear === selectedDate.value.year && date.lMonth === selectedDate.value.month) {
            len = date.lDay
        }
        for (let i = 1; i <= len; i++) {
            arr.push({ value: i, label: toChinaDay(i) })
        }
    }
    return arr
})

let pickerValue = ref([])
const indicatorStyle = `height: 50px;`

onMounted(() => {
    nextTick(() => {
        init()
    })
})

function init() {
    if (prop.modelValue) {
        const dateObj = dayjs(prop.modelValue)
        const year = dateObj.year()
        const month = dateObj.month()
        const day = dateObj.date()
        selectedDate.value = {
            year,
            month,
            day,
            leap: false,
            lunar: prop.lunar,
        }
        for (let i = 0; i < years.value.length; i++) {
            if (years.value[i] === year) {
                pickerValue.value[0] = i
                break
            }
        }
        for (let i = 0; i < months.value.length; i++) {
            if (prop.leap) {
                if (months.value[i].value === month && months[i].leap) {
                    pickerValue.value[1] = i
                    break
                }
            } else {
                if (months.value[i].value === month) {
                    pickerValue.value[1] = i
                    break
                }
            }
        }
        for (let i = 0; i < days.value.length; i++) {
            if (days.value[i].value === day) {
                pickerValue.value[2] = i
                break
            }
        }
    } else {
        pickerValue.value = [years.value.length - 1, months.value.length - 1, days.value.length - 1]
    }
}
function lunarChange(e) {
    if (selectedDate.value.year >= 1990 && selectedDate.value.year < 2100) {
        emit('update:lunar', e.detail.value)
        nextTick(() => {
            init()
        })
    }
}

function dateChange(e) {
    pickerValue.value = e.detail.value
    updateData()
}
function updateData() {
    const val = pickerValue.value
    selectedDate.value.year = years.value[val[0]]
    const { value, leap } = months.value[Math.min(val[1], months.value.length - 1)]
    selectedDate.value.month = value
    selectedDate.value.day = days.value[Math.min(val[2], days.value.length - 1)].value
    selectedDate.value.leap = !!leap
    selectedDate.value.lunar = prop.lunar
    const { year, month, day } = selectedDate.value
    emit('update:modelValue', `${year}-${month}-${day}`)
    emit('update:leap', !!leap)
    emit('change', selectedDate.value)
}
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
