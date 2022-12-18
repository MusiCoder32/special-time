<template>
    <view class="p30">
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

        <view class="w100 mt30 edit-btn f36 white h-center" @click="submit">查询</view>
    </view>
</template>

<script setup>
import { LunarType } from '../../../utils/emnu'
import { ref, computed } from 'vue'
import dayjs from '_dayjs@1.11.6@dayjs'
import calendar from '../../../utils/calendar'

const form = ref()

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
    const res = await form.value.validate().catch(() => false)
    if (res) {
        uni.navigateTo({
            url: '/pages/ucenter/astro/result?data=' + JSON.stringify(formData.value),
        })
    }
}
</script>

<style scoped></style>
