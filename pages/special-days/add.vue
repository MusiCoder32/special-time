<template>
    <view class="uni-container">
        <uni-forms
            ref="form"
            :model="formData"
            :rules="rules"
            validate-trigger="submit"
            err-show-type="toast"
            :label-width="50"
        >
            <uni-forms-item name="name" label="名称" required>
                <uni-easyinput v-model="formData.name" trim="both"></uni-easyinput>
            </uni-forms-item>
            <uni-forms-item name="time" label="日期" required>
                <uni-datetime-picker return-type="timestamp" type="date" v-model="formData.time"></uni-datetime-picker>
            </uni-forms-item>
            <uni-forms-item name="type" label="类型" required>
                <view class="mt6">
                    <uni-data-checkbox
                        v-model="formData.type"
                        :localdata="formOptions.type_localdata"
                    ></uni-data-checkbox>
                </view>
            </uni-forms-item>
            <template v-if="formData.type === SpecialDayType['生日']">
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

export default {
    data() {
        let formData = {
            name: '',
            time: null,
            type: 0,
            lunar: 0,
            leap: 0,
            score: 0,
            scoreReady: false,
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
                    {
                        text: '提醒日',
                        value: 2,
                    },
                ],
            },
            rules: validator,
        }
    },
    mounted() {
        this.getScore(false)
    },
    methods: {
        /**
         * 验证表单并提交
         */
        async submit() {
            const res = await this.$refs.form.validate().catch((e) => false)
            if (res) {
                const score = this.score
                if (!this.scoreReady) {
                    await this.getScore(true)
                }
                const modalRes = await uni.showModal({
                    title: '提示',
                    content: '是否花费1时光币创建，目前剩余' + score + '币',
                })
                if (modalRes.confirm) {
                    const { name, time, type, lunar, leap } = this.formData
                    const params = {
                        name,
                        time,
                        type,
                        lunar,
                        leap: !!(leap[0] && lunar),
                    }
                    return this.submitForm(params)
                }
            }
        },

        /**
         * 提交表单
         */
        async submitForm(value) {
            // 使用 clientDB 提交数据
            uni.showLoading({
                mask: true,
            })
            try {
                const res = await db.collection(dbCollectionName).add(value)
                console.log(res)
                uni.showToast({
                    icon: 'none',
                    title: '新增成功',
                })
                this.getOpenerEventChannel().emit('refreshData')
                setTimeout(() => uni.navigateBack(), 500)
            } catch (e) {
                console.log(e)
            }
            uni.showModal({
                content: err.message || '请求服务失败',
                showCancel: false,
            })
        },
        async getScore(showLoading) {
            if (showLoading) {
                uni.showLoading({
                    mask: true,
                })
            }
            try {
                const res = await db
                    .collection('uni-id-scores')
                    .where('"user_id" == $env.uid')
                    .field('balance')
                    .orderBy('create_date', 'desc')
                    .limit(1)
                    .get()
                this.score = res.result.data[0]?.balance || 0
                this.scoreReady = true
            } catch (e) {
                console.log(e)
            }
            if (showLoading) {
                uni.hideLoading()
            }
        },
    },
}
</script>

<style>
.uni-container {
    padding: 15px;
}
.checklist-box {
    margin-right: 30rpx !important;
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
