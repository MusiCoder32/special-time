<template>
    <view class="uni-container">
        <uni-forms ref="form" :model="formData" validate-trigger="submit" err-show-type="toast" :label-width="76">
            <uni-forms-item name="start_time" label="出生日期" required>
                <uni-datetime-picker
                    return-type="timestamp"
                    type="date"
                    v-model="formData.start_time"
                ></uni-datetime-picker>
            </uni-forms-item>
            <uni-forms-item name="startType" label="日期类型" required>
                <view class="h-start-center mt6">
                    <uni-data-checkbox
                        class="f-grow w0"
                        v-model="formData.startType"
                        :localdata="formOptions.startType_localdata"
                    ></uni-data-checkbox>
                    <uni-data-checkbox
                        style="width: 140rpx"
                        v-if="formData.startType"
                        multiple
                        v-model="formData.leap"
                        :localdata="leapOption"
                    ></uni-data-checkbox>
                </view>
            </uni-forms-item>
            <uni-forms-item name="end_time" label="计划离 开日期" required>
                <uni-datetime-picker
                    return-type="timestamp"
                    type="date"
                    v-model="formData.end_time"
                ></uni-datetime-picker>
            </uni-forms-item>
            <view class="uni-button-group">
                <button type="primary" class="uni-button" @click="submit">提交</button>
            </view>
        </uni-forms>
    </view>
</template>

<script>
import { validator } from '../../js_sdk/validator/start-end-time.js'
import { LunarType } from '../../utils/emnu'

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
            leapOption: [{ value: 1, text: '闰月' }],
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
    onLoad() {
        this.getDetail()
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
                    const { end_time, start_time, startType, lunar, leap } = this.formData
                    const params = {
                        end_time,
                        start_time,
                        startType,
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
                .where(`"user_id"==$env.uid`)
                .update(value)
                .then((res) => {
                    uni.showToast({
                        icon: 'none',
                        title: '修改成功',
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

        /**
         * 获取表单数据
         * @param {Object} id
         */
        getDetail() {
            uni.showLoading({
                mask: true,
            })
            db.collection(dbCollectionName)
                .where(`"user_id"==$env.uid`)
                .field('start_time,startType,leap,end_time')
                .get()
                .then((res) => {
                    const data = res.result.data[0]
                    if (data) {
                        if (data.leap) {
                            data.leap = [1]
                        } else {
                            data.leap = []
                        }
                        this.formData = data
                    }
                })
                .catch((err) => {
                    uni.showModal({
                        content: err.message || '请求服务失败',
                        showCancel: false,
                    })
                })
                .finally(() => {
                    uni.hideLoading()
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
