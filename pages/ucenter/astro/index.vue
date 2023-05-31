<template>
    <view v-if="details" class="p25">
        <view class="list-details p30">
            <view class="detail-item h-start-center">
                <text class="f32 fc-66 mr40">日期</text>
                <text class="fc-black f-grow w0 ellipsis f32">{{
                    `${details.cYear}-${details.cMonth}-${details.cDay}`
                }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">农历</text>
                <text class="fc-black f32">{{ details.IMonthCn + details.IDayCn }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">生肖</text>
                <text class="fc-black f32">{{ details.Animal }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">星座</text>
                <text class="fc-black f32">{{ details.astro }}</text>
            </view>
        </view>
        <view class="w100 mt30 edit-btn f36 white h-center" @click="back">返回</view>
    </view>

    <view v-else class="p30">
        <uni-forms
            ref="form"
            :model="formData"
            :rules="rules"
            validate-trigger="submit"
            err-show-type="toast"
            :label-width="50"
        >
            <uni-forms-item name="time" label="日期" required>
                <uni-datetime-picker
                    @change="dateChange"
                    return-type="timestamp"
                    type="date"
                    v-model="formData.time"
                ></uni-datetime-picker>
            </uni-forms-item>
            <template>
                <uni-forms-item name="lunar" label="日期类型" required>
                    <view class="h-start-center mt6">
                        <uni-data-checkbox
                            :disabled="!showLunar"
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

        <view class="w100 mt30 edit-btn f36 white h-center" @click="submit">查询</view>
    </view>
</template>

<script setup>
import { LunarType } from '@/utils/emnu'
import dayjs from 'dayjs'
import { lunar2solar } from '@/utils/calendar'
import { shareMessageCall, shareTimelineCall } from '@/utils/common'
import { getAge } from '@/utils/getAge'

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)

const form = ref()
const details = ref()

const formData = ref({
    time: null,
    lunar: 0,
    leap: 0,
})

const showLeap = computed(() => {
    const birthDay = dayjs(formData.value.time)
    return lunar2solar(birthDay.year(), birthDay.month() + 1, birthDay.date(), true) !== -1
})

const showLunar = computed(() => {
    const birthDay = dayjs(formData.value.time)
    return lunar2solar(birthDay.year(), birthDay.month() + 1, birthDay.date()) !== -1
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
    const res = await form.value.validate().catch(() => false)
    if (res) {
        const { time, lunar, leap } = formData.value
        details.value = getAge(time, lunar, !!(leap[0] && lunar))
    }
}
function back() {
    details.value = null
}

function dateChange() {
    nextTick(() => {
        if (!showLunar.value) {
            formData.value.lunar = 0
        }
    })
}
</script>

<style>
page {
    background-color: white !important;
}
</style>
