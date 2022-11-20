<template>
    <view class="uni-container">
        <uni-forms ref="form" :model="formData" validate-trigger="submit" err-show-type="toast">
            <uni-forms-item name="start_time" label="" required>
                <uni-datetime-picker return-type="timestamp" v-model="formData.start_time"></uni-datetime-picker>
            </uni-forms-item>
            <uni-forms-item name="startType" label="类型" required>
                <uni-data-checkbox
                    v-model="formData.startType"
                    :localdata="formOptions.startType_localdata"
                ></uni-data-checkbox>
            </uni-forms-item>
            <uni-forms-item name="leap" label="闰月">
                <switch @change="binddata('leap', $event.detail.value)" :checked="formData.leap"></switch>
            </uni-forms-item>
            <uni-forms-item name="end_time" label="" required>
                <uni-datetime-picker return-type="timestamp" v-model="formData.end_time"></uni-datetime-picker>
            </uni-forms-item>
            <view class="uni-button-group">
                <button type="primary" class="uni-button" @click="submit">提交</button>
            </view>
        </uni-forms>
    </view>
</template>

<script>
import { validator } from '../../js_sdk/validator/start-end-time.js'

const db = uniCloud.database()
const dbCollectionName = 'start-end-time'

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
            start_time: null,
            startType: 0,
            leap: false,
            end_time: null,
        }
        return {
            formData,
            formOptions: {
                startType_localdata: [
                    {
                        text: '公历',
                        value: 0,
                    },
                    {
                        text: '农历',
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
                    return this.submitForm(res)
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
