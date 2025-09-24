<template>
    <view class="uni-container">
        <uni-forms
            ref="form"
            :model="formData"
            :rules="rules"
            validate-trigger="submit"
            err-show-type="toast"
            :label-width="76"
        >
            <uni-forms-item name="end_time" label="计划离开日期" required>
                <uni-datetime-picker type="date" v-model="formData.end_time"> </uni-datetime-picker>
            </uni-forms-item>
            <uni-forms-item name="show_end_time" label="首页启用" required>
                <switch
                    @change="checkChange"
                    color="#FFCC33"
                    style="transform: scale(0.7)"
                    :checked="formData.show_end_time"
                />
            </uni-forms-item>
            <view class="uni-button-group">
                <button type="primary" class="uni-button" @click="submit">提交</button>
            </view>
        </uni-forms>
    </view>
</template>

<script>
import dayjs from 'dayjs'
const db = uniCloud.database()
const dbCollectionName = 'start-end-time'

export default {
    data() {
        let formData = {
            show_end_time: false,
            end_time: null,
        }
        const validator = {
            end_time: {
                rules: [
                    {
                        required: true,
                    },
                ],
                title: '计划离开日期',
                label: '计划离开日期',
            },
        }
        return {
            end: new Date(),
            formData,
            rules: validator,
        }
    },
    onShow() {
        this.formData = uni.getStorageSync('endData')
    },
    methods: {
        checkChange(e) {
            this.formData.show_end_time = e.detail.value
        },
        async submit() {
            uni.showLoading({
                mask: true,
            })
            const res = await this.$refs.form.validate().catch((e) => false)
            if (res) {
                const { end_time, show_end_time } = this.formData
                const params = {
                    end_time: new Date(end_time).getTime(),
                    show_end_time,
                }
                uni.setStorageSync('endData', params)
                this.submitForm(params)
            }

            uni.hideLoading()
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
