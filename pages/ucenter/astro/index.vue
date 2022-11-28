<template>
    <view class="uni-container p10">
        <uni-forms
            ref="form"
            :model="formData"
            :rules="rules"
            validate-trigger="submit"
            err-show-type="toast"
            :label-width="50"
        >
            <uni-forms-item name="time" label="日期" required>
                <uni-datetime-picker return-type="timestamp" type="date" v-model="formData.time"></uni-datetime-picker>
            </uni-forms-item>
            <template>
                <uni-forms-item name="lunar" label="日期类型" required>
                    <view class="h-start-center mt6">
                        <uni-data-checkbox
                            class="f-grow w0"
                            v-model="formData.lunar"
                            :localdata="lunarRadio"
                        ></uni-data-checkbox>
                        <uni-data-checkbox
                            v-if="formData.lunar && showLeap"
                            multiple
                            v-model="formData.leap"
                            :localdata="leapOption"
                        ></uni-data-checkbox>
                    </view>
                </uni-forms-item>
            </template>
        </uni-forms>

        <view v-if="details">
            <view>
                <text>出生日期：</text>
                <text>{{ `${details.cYear}-${details.cMonth}-${details.cDay}` }}</text>
            </view>
            <view>
                <text>农历：</text>
                <text>{{ details.IMonthCn + details.IDayCn }}</text>
            </view>
            <view>
                <text>生肖：</text>
                <text>{{ details.Animal }}</text>
            </view>
            <view>
                <text>星座：</text>
                <text>{{ details.astro }}</text>
            </view>
        </view>
        <view class="confirm-button">
            <button type="primary" @click="submit">查询</button>
        </view>
    </view>
</template>

<script setup>
import { LunarType } from '../../../utils/emnu'
import { ref, computed } from 'vue'
import { getAge } from '../../../utils/getAge'
import dayjs from '_dayjs@1.11.6@dayjs'
import calendar from '../../../utils/calendar'

const form = ref()
const details = ref()

const formData = ref({
    time: null,
    lunar: 0,
    leap: 0,
})

const showLeap = computed(() => {
    const birthDay = dayjs(formData.value.time)
    return calendar.lunar2solar(birthDay.year(), birthDay.month() + 1, birthDay.date(), true) !== -1
})

const lunarRadio = ref([])
for (const lunarTypeKey in LunarType) {
    if (typeof LunarType[lunarTypeKey] === 'number') {
        lunarRadio.value.push({
            value: LunarType[lunarTypeKey],
            text: lunarTypeKey,
        })
    }
}

const leapOption = ref([{ value: 1, text: '闰月' }])

const rules = ref({
    time: {
        rules: [
            {
                required: true,
                errorMessage: '请输入查询时间',
            },
        ],
    },
})
async function submit() {
    console.log(form)
    const res = await form.value.validate().catch(() => false)
    if (res) {
        const { time, lunar, leap } = formData.value
        console.log(leap)
        details.value = getAge(time, lunar, !!(leap[0] && lunar))
        console.log(details.value)
    }
}
</script>

<style scoped>
.confirm-button {
    width: 710rpx;
    position: fixed;
    bottom: 40rpx;
}
.uni-button {
    width: 184px;
}
</style>
