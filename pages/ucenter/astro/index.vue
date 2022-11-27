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
                            v-if="formData.lunar"
                            multiple
                            v-model="formData.leap"
                            :localdata="leapOption"
                        ></uni-data-checkbox>
                    </view>
                </uni-forms-item>
            </template>
            <view class="uni-button-group">
                <button type="primary" class="uni-button" @click="submit">查询</button>
            </view>
        </uni-forms>
    </view>
</template>

<script setup>
import { LunarType } from '../../../utils/emnu'
import { ref, onMounted } from 'vue'

const form = ref()

const formData = ref({
    time: null,
    lunar: 0,
    leap: 0,
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

onMounted(() => {
    form.value.setRules(rules.value)
})
async function submit() {
    console.log(form)
    const res = await form.value.validate()
    console.log(res)
    console.log('ssss')
}
</script>

<style>
.uni-button {
    width: 184px;
}
</style>
