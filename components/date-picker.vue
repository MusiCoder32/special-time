<template>
    <picker-view
        :indicator-style="indicatorStyle"
        :value="value"
        @change="dateChange"
        :style="`height:${height}rpx`"
        class="picker-view"
    >
        <picker-view-column>
            <view class="item" v-for="(item, index) in years" :key="index">{{ item }}年</view>
        </picker-view-column>
        <picker-view-column>
            <view class="item" v-for="(item, index) in months" :key="index">{{ item }}月</view>
        </picker-view-column>
        <picker-view-column>
            <view class="item" v-for="(item, index) in days" :key="index">{{ item }}日</view>
        </picker-view-column>
    </picker-view>
</template>

<script setup>
import { onMounted, reactive, computed, ref } from 'vue'
import { solarDays } from '/utils/calendar'
import dayjs from 'dayjs'
const emit = defineEmits(['change'])
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
})

const date = new Date()
const years = ref([])

let month = date.getMonth() + 1
let day = date.getDate()

const monthRef = ref(month)
let endYear, endMonth, endDay
if (prop.end) {
    const date = dayjs(prop.end)
    endYear = date.year()
    endMonth = date.month() + 1
    endDay = date.date()
}

if (prop.yearLength > 0) {
    for (let i = date.getFullYear(); i <= date.getFullYear() + prop.yearLength; i++) {
        if (!prop.end || endYear >= i) {
            years.value.push(i)
        }
    }
} else {
    for (let i = date.getFullYear() + prop.yearLength; i <= date.getFullYear(); i++) {
        if (!prop.end || endYear >= i) {
            years.value.push(i)
        }
    }
}

let year = years.value.slice(-1)[0]
const yearRef = ref(year)

const months = computed(() => {
    const arr = []
    let len = 12
    if (prop.end && yearRef.value === endYear) {
        len = endMonth
    }

    for (let i = 1; i <= len; i++) {
        arr.push(i)
    }
    return arr
})

const days = computed(() => {
    const month = monthRef.value
    const year = yearRef.value
    const arr = []
    let len = solarDays(year, month)
    if (prop.end && yearRef.value === endYear && monthRef.value === endMonth) {
        len = endDay
    }
    for (let i = 1; i <= len; i++) {
        arr.push(i)
    }
    return arr
})

let value = ref([])
const indicatorStyle = `height: 50px;`

onMounted(() => {
    value.value = [year - 1, month - 1, day - 1]
    emit('change', {
        year,
        month,
        day,
    })
})

function dateChange(e) {
    const val = e.detail.value
    year = years.value[val[0]]
    yearRef.value = year
    month = months.value[val[1]]
    monthRef.value = month
    day = days.value[val[2]]
    const date = {
        year,
        month,
        day,
    }
    console.log(date)
    emit('change', date)
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
