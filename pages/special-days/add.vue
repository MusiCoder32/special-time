<template>
    <view class="uni-container">
        <uni-forms ref="form" :model="formData" validate-trigger="submit" err-show-type="toast">
            <uni-forms-item name="name" label="名称" required>
                <uni-easyinput v-model="formData.name" trim="both"></uni-easyinput>
            </uni-forms-item>
            <uni-forms-item name="time" label="日期" required>
                <uni-datetime-picker return-type="timestamp" type="date" v-model="formData.time"></uni-datetime-picker>
            </uni-forms-item>
            <uni-forms-item name="type" label="类型" required>
                <uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata"></uni-data-checkbox>
            </uni-forms-item>
            <template v-if="formData.type === SpecialDayType['生日']">
                <uni-forms-item name="lunar" label="日期类型" required>
                    <view class="h-start-center">
                        <uni-data-checkbox v-model="formData.lunar" :localdata="lunarRadio"></uni-data-checkbox>
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
                <button type="primary" class="uni-button" @click="submit">提交</button>
            </view>
        </uni-forms>
    </view>
</template>

<script setup>
import { SpecialDayType } from '../../utils/emnu'
</script>

<script>
import { validator } from '../../js_sdk/validator/special-days.js'
import { LunarType } from '../../utils/emnu'

const db = uniCloud.database()
const dbCollectionName = 'special-days'

function getValidator(fields) {
    let result = {}
    for (let key in validator) {
        if (fields.indexOf(key) > -1) {
            result[key] = validator[key]
        }
    }
    return result
}

export default {
    data() {
        let formData = {
            name: '',
            time: null,
            type: 0,
            lunar: 0,
            leap: 0,
        }
        const lunarRadio = []
        for (const lunarTypeKey in LunarType) {
            if (typeof LunarType[lunarTypeKey] === 'number') {
                lunarRadio.push({
                    value: LunarType[lunarTypeKey],
                    text: lunarTypeKey,
                })
            }
        }
        return {
            leapOption: [{ value: 1, text: '闰月' }],
            lunarRadio,
            formData,
            formOptions: {
                type_localdata: [
                    {
                        text: '纪念日',
                        value: 0,
                    },
                    {
                        text: '生日',
                        value: 1,
                    },
                ],
            },
            rules: {
                ...getValidator(Object.keys(formData)),
            },
        }
    },
    onReady() {
        this.$refs.form.setRules(this.rules)
    },
    methods: {
        /**
         * 验证表单并提交
         */
        submit() {
            uni.showLoading({
                mask: true,
            })
            this.$refs.form
                .validate()
                .then((res) => {
                    const { name, time, type, lunar, leap } = this.formData
                    const params = {
                        name,
                        time,
                        type,
                        lunar,
                        leap: !!leap[0],
                    }
                    return this.submitForm(params)
                })
                .catch(() => {})
                .finally(() => {
                    uni.hideLoading()
                })
        },

        /**
         * 提交表单
         */
        submitForm(value) {
            // 使用 clientDB 提交数据
            return db
                .collection(dbCollectionName)
                .add(value)
                .then((res) => {
                    uni.showToast({
                        icon: 'none',
                        title: '新增成功',
                    })
                    this.getOpenerEventChannel().emit('refreshData')
                    setTimeout(() => uni.navigateBack(), 500)
                })
                .catch((err) => {
                    uni.showModal({
                        content: err.message || '请求服务失败',
                        showCancel: false,
                    })
                })
        },
    },
}
</script>

<style>
.uni-container {
    padding: 15px;
}

.uni-input-border,
.uni-textarea-border {
    width: 100%;
    font-size: 14px;
    color: #666;
    border: 1px #e5e5e5 solid;
    border-radius: 5px;
    box-sizing: border-box;
}

.uni-input-border {
    padding: 0 10px;
    height: 35px;
}

.uni-textarea-border {
    padding: 10px;
    height: 80px;
}

.uni-button-group {
    margin-top: 50px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    justify-content: center;
}

.uni-button {
    width: 184px;
}
</style>
