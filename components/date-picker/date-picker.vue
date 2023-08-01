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
import { LunarType } from '../../utils/emnu'
import { setTime } from '../../utils/getAge'
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
    modelValue: {
        default: new Date(),
    },
    lunar: {
        type: Number,
        default: LunarType['公历'],
    },
    leap: {},
})
const dateLabel = ref('')
const date = setTime(prop.end || new Date(), false)

const years = computed(() => {
    let arr = []
    console.log(prop.yearLength)
    if (prop.yearLength > 0) {
        for (let i = date.cYear; i <= date.cYear + prop.yearLength; i++) {
            if (!prop.end) {
                arr.push(i)
            } else {
                if (dayjs(prop.end).year() >= i) {
                    arr.push(i)
                }
            }
        }
    } else {
        for (let i = date.cYear + prop.yearLength; i <= date.cYear; i++) {
            if (!prop.end) {
                arr.push(i)
            } else {
                if (date.cYear >= i) {
                    arr.push(i)
                }
            }
        }
    }
    if (prop.lunar === LunarType['农历']) {
        arr = arr.filter((item) => {
            return item > 1900 && item < 2100
        })
    }
    return arr
})

const months = computed(() => {
    const result = []
    let len = 12
    const dateObj = dayjs(prop.modelValue || new Date())
    const year = dateObj.year()
    if (prop.lunar === LunarType['公历']) {
        if (prop.end && year === date.cYear) {
            len = date.cMonth
        }

        for (let i = 1; i <= len; i++) {
            result.push({ value: i, label: i })
        }
    } else {
        if (prop.end && year === date.lYear) {
            len = date.lMonth
        }
        const leap = leapMonth(year)
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
    const dateObj = dayjs(prop.modelValue || new Date())
    const year = dateObj.year()
    const month = dateObj.month() + 1
    if (prop.lunar === LunarType['公历']) {
        len = solarDays(year, month)
        if (prop.end && date.cYear === year && date.cMonth === month) {
            len = date.cDay
        }
        for (let i = 1; i <= len; i++) {
            arr.push({ value: i, label: i })
        }
    } else {
        if (prop.leap) {
            len = leapDays(year)
        } else {
            len = lunarDays(year, month)
        }
        if (prop.end && date.lYear === year && date.lMonth === month) {
            len = date.lDay
        }
        for (let i = 1; i <= len; i++) {
            arr.push({ value: i, label: toChinaDay(i) })
        }
    }
    return arr
})

const lunarRadio = computed(() => {
    let result = []
    for (const lunarTypeKey in LunarType) {
        if (typeof LunarType[lunarTypeKey] === 'number') {
            result.push({
                value: LunarType[lunarTypeKey],
                text: lunarTypeKey,
            })
        }
    }
    if (prop.lunar === LunarType['公历']) {
        const yearIndex = pickerValue.value[0]
        if (years.value[yearIndex] <= 1900) {
            result[1].disable = true
        } else if (years.value[yearIndex] >= 2100) {
            result[1].disable = true
        } else if (yearIndex === 0) {
            const { lYear, lMonth, lDay } = setTime(prop.modelValue, prop.lunar)
            console.log(prop.modelValue)
            console.log({ lYear, lMonth, lDay })
            result[1].disable = !(
                lYear >= years.value[0] &&
                lMonth >= months.value[0].value &&
                lDay >= days.value[0].value
            )
        }
    }
    if (prop.lunar === LunarType['农历'] && pickerValue.value[0] === years.length - 1) {
        const { cYear, cMonth, cDay } = setTime(prop.modelValue, prop.lunar)
        result[0].disable = !(
            cYear <= years.value.slice(-1)[0] &&
            cMonth <= months.value.slice(-1)[0].value &&
            cDay <= days.value.slice(-1)[0].value
        )
    }
    return result
})

let pickerValue = ref([0, 0, 0])
const indicatorStyle = `height: 50px;`

watch(
    () => [prop.modelValue, prop.yearLength],
    () => {
        nextTick(() => {
            init()
        })
    },
)
onMounted(() => {
    nextTick(() => {
        init()
    })
})

function init() {
    let arr = []
    if (prop.modelValue) {
        const dateObj = dayjs(prop.modelValue)
        const year = dateObj.year()
        const month = dateObj.month() + 1
        const day = dateObj.date()
        for (let i = 0; i < years.value.length; i++) {
            if (years.value[i] === year) {
                arr[0] = i
                break
            }
        }
        for (let i = 0; i < months.value.length; i++) {
            if (prop.leap) {
                if (months.value[i].value === month && months.value[i].leap) {
                    arr[1] = i
                    break
                }
            } else {
                if (months.value[i].value === month) {
                    arr[1] = i
                    break
                }
            }
        }
        for (let i = 0; i < days.value.length; i++) {
            if (days.value[i].value === day) {
                arr[2] = i
                break
            }
        }
    } else {
        if (prop.yearLength > 0) {
            arr = [0, 0, 0]
        } else {
            arr = [years.value.length - 1, months.value.length - 1, days.value.length - 1]
        }
    }
    pickerValue.value = [...arr]
    updateData()
}
function lunarChange(e) {
    pickerValue.value = [0, 0, 0] // 提前将pickerValue置于初始位，避免切换时自动触发picker-view的change事件
    const { lYear, lMonth, lDay, cYear, cMonth, cDay, isLeap } = setTime(prop.modelValue, prop.lunar, prop.leap)
    if (e.detail.value) {
        emit('update:modelValue', `${lYear}-${lMonth}-${lDay}`)
        emit('update:lunar', e.detail.value)
        emit('update:leap', isLeap)
    } else {
        emit('update:modelValue', `${cYear}-${cMonth}-${cDay}`)
        emit('update:lunar', e.detail.value)
        emit('update:leap', false)
    }
    nextTick(() => {
        init()
    })
}

function dateChange(e) {
    console.log('update', e)
    pickerValue.value = e.detail.value
    updateData()
}
function updateData() {
    const val = pickerValue.value
    const year = years.value[val[0]]
    const { value: month, leap, label: monthLabel } = months.value[Math.min(val[1], months.value.length - 1)]
    const { value: day, label: dayLabel } = days.value[Math.min(val[2], days.value.length - 1)]
    if (prop.lunar) {
        dateLabel.value = `${year}年 ${monthLabel}${dayLabel}` //农历年增加一个空格
    } else {
        dateLabel.value = `${year}年${monthLabel}月${dayLabel}日`
    }
    const timestamp = new Date(`${year}-${month}-${day}`).getTime()
    console.log(timestamp)
    emit('update:modelValue', timestamp)
    emit('update:leap', !!leap)
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
