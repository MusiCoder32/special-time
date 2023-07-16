<template>
    <view class="pt40 bg-white p-f bottom-0 w100" style="border-radius: 20rpx 20rpx 0 0; height: 700rpx">
        <view class="pl25 pr25">
            <uni-forms
                ref="formRef"
                :model="formData"
                validate-trigger="submit"
                err-show-type="toast"
                :label-width="60"
            >
                <uni-forms-item name="serialNumber" label="型号">
                    <uni-data-checkbox
                        v-model="formData.serialNumber"
                        :localdata="serialNumberList"
                        @change="change"
                    ></uni-data-checkbox>
                </uni-forms-item>
                <uni-forms-item name="feature" label="功能">
                    <uni-data-checkbox
                        v-model="formData.feature"
                        :localdata="featureList"
                        @change="change"
                    ></uni-data-checkbox>
                </uni-forms-item>
                <uni-forms-item v-if="formData.feature === FeatureType['复印']" name="pageOption" label="打印设置">
                    <uni-data-checkbox
                        v-model="formData.pageOption"
                        :localdata="pageOptionList"
                        @change="change"
                    ></uni-data-checkbox>
                </uni-forms-item>
                <uni-forms-item v-if="formData.feature === FeatureType['扫描']" name="store" label="储存位置">
                    <uni-data-checkbox
                        v-model="formData.store"
                        :localdata="storeList"
                        @change="change"
                    ></uni-data-checkbox>
                </uni-forms-item>
            </uni-forms>
        </view>

        <view class="pb40 w100 h-center p-a bottom-0">
            <button type="info" class="uni-button w40" @click="reset">重置</button>
            <button type="primary" class="uni-button w40 ml40" @click="submit">提交</button>
        </view>
    </view>
</template>

<script setup>
import { debounce } from 'lodash'
import { storeList, serialNumberList, featureList, pageOptionList, FeatureType } from '@/pages/tool/printer/enum'

const emit = defineEmits(['select'])
const selected = ref(null)

const formData = ref({
    serialNumber: null,
    feature: null,
    store: null,
    pageOption: null,
})

const rules = {
    serialNumber: {
        rules: [
            {
                required: true,
            },
        ],
        title: '打印机型号',
        label: '打印机型号',
    },
    feature: {
        rules: [
            {
                required: true,
            },
        ],
        title: '需使用的打印机功能',
        label: '需使用的打印机功能',
    },
    store: {
        rules: [
            {
                required: true,
            },
        ],
        title: '扫描文件储存位置',
        label: '扫描文件储存位置',
    },
    pateOption: {
        rules: [
            {
                required: true,
            },
        ],
        title: '打印设置',
        label: '打印设置',
    },
}
const formRef = ref()
function change(e) {
    console.log(e)
}

function reset() {
    emit('select', {})
}
const submit = debounce(async () => {
    const res = await formRef.value.validate().catch((e) => false)
    if (res) {
        console.log(res)
        console.log(formData.value)
        emit('select', formData.value)
    }
}, 300)
</script>

<style lang="scss" scoped>
page {
    background-color: white !important;
}
</style>
