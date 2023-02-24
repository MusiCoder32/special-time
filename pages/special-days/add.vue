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
                <uni-datetime-picker
                    @change="dateChange"
                    return-type="timestamp"
                    type="date"
                    v-model="formData.time"
                ></uni-datetime-picker>
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
                            :disabled="!showLunar"
                            class="f-grow w0"
                            v-model="formData.lunar"
                            :localdata="lunarRadio"
                        ></uni-data-checkbox>
                        <uni-data-checkbox
                            v-if="formData.lunar && showLeap(formData)"
                            multiple
                            v-model="formData.leap"
                            :localdata="leapOption"
                        ></uni-data-checkbox>
                    </view>
                </uni-forms-item>
            </template>

            <uni-forms-item :label-width="100" class="ml5" name="subscribed" label="消息通知">
                <view class="mt6 h100 h-end-center">
                    <switch
                        @change="subscribedChange"
                        color="#FFCC33"
                        style="transform: scale(0.7)"
                        :checked="formData.subscribed"
                    />
                </view>
            </uni-forms-item>

            <view class="uni-button-group">
                <button :disabled="submitDisable" type="primary" class="uni-button" @click="submit">提交</button>
            </view>
        </uni-forms>
        <!--        <ad-rewarded-video-->
        <!--            ref="adRewardedVideo"-->
        <!--            adpid="1281160936"-->
        <!--            :preload="true"-->
        <!--            :loadnext="true"-->
        <!--            v-slot:default="{ loading, error }"-->
        <!--            @load="onadload"-->
        <!--            @close="onadclose"-->
        <!--            @error="onaderror"-->
        <!--        >-->
        <!--            &lt;!&ndash;            <view class="ad-error" v-if="error">{{ error }}</view>&ndash;&gt;-->
        <!--        </ad-rewarded-video>-->

        <view v-if="showLunarTip" class="self-mask">
            <uni-transition class="p-a mask-position" mode-class="slide-right" :duration="500" :show="showLunarTip">
                <image src="/static/circle.svg" class="circle" mode="widthFix" />
                <image src="/static/arrow.svg" class="arrow" mode="widthFix" />
                <view class="alert">若每年过农历生日，记得选农历哦！</view>
            </uni-transition>
            <image @click="getKnow" src="/static/know.svg" class="know" mode="widthFix" />
        </view>
    </view>
</template>

<script setup>
import { SpecialDayType } from '../../utils/emnu'
</script>

<script>
import { SpecialDayType } from '../../utils/emnu'
import { validator } from '../../js_sdk/validator/special-days.js'
import { LunarType } from '../../utils/emnu'
import { isEqual } from 'lodash'

const db = uniCloud.database()
const dbCollectionName = 'special-days'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import dayjs from 'dayjs'
import { lunar2solar } from '../../utils/calendar'

export default {
    data() {
        let formData = {
            name: '',
            time: null,
            type: 0,
            lunar: 0,
            leap: 0,
            subscribed: false,
            subscribedTemplateId: [],
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
            balance: 0,
            startAdTime: '',
            leapOption: [{ value: 1, text: '闰月' }],
            lunarRadio,
            formData,
            formDataOrigin: null,
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
            formDataId: null,
            showLunarTip: null,
        }
    },
    computed: {
        showLunar() {
            const date = dayjs(this.formData.time)
            return lunar2solar(date.year(), date.month() + 1, date.date()) !== -1
        },
        userInfo() {
            return store.userInfo
        },
        submitDisable() {
            if (!this.formDataId) {
                return false
            }
            return isEqual(this.formData, this.formDataOrigin)
        },
    },
    mounted() {},
    onLoad(e) {
        if (e.id) {
            const id = e.id
            this.formDataId = id
            this.getDetail(id)
        }
        if (e.shareDay) {
            this.formData = JSON.parse(e.shareDay)
        }
        const title = this.formDataId ? '修改' : '新增'
        uni.setNavigationBarTitle({ title })

        if (!uni.getStorageSync('showLunarTip')) {
            this.showLunarTip = 1
            uni.setStorage({
                key: 'showLunarTip',
                data: 1,
            })
        }
    },

    methods: {
        getKnow() {
            this.showLunarTip = false
        },
        async subscribedChange(e) {
            let me = this
            const bool = e.detail.value
            console.log(bool)
            this.formData.subscribed = bool
            if (bool) {
                // const currentDay = 'BPJmCOQ_K1Qek_LCOgwekWhJ6jaZ6F2To2LmtfEZFSI'
                //目前部分手机只支持一次订阅一条消息，有些支持三条，为加快上线进度，先只设计一条
                const beforeDay = 'BPJmCOQ_K1Qek_LCOgwekWhJ6jaZ6F2To2LmtfEZFSI'
                uni.requestSubscribeMessage({
                    tmplIds: [
                        beforeDay,
                        // currentDay,
                        // 'YCUygKSwPe-WwjScDVqArZukiKfizdZ509woib77nwg',
                    ],
                    success(res) {
                        console.log(res)
                        if (res[beforeDay] === 'reject') {
                            me.subscribedFail(beforeDay)
                        } else if (res[beforeDay].indexOf('accept') > -1) {
                            me.formData.subscribed = true
                            me.formData.subscribedTemplateId = [beforeDay]
                            uni.showToast({
                                title: '订阅成功',
                            })
                        }
                    },
                    fail(e) {
                        me.subscribedFail(beforeDay)
                        console.log(e)
                        uni.showToast({
                            title: '订阅失败，请稍后重试',
                        })
                    },
                })
            } else {
                const modalRes = await uni.showModal({
                    title: '提示',
                    content: '取消后将无法收到重要日期提醒哦',
                })
                console.log(modalRes)
                if (modalRes.cancel) {
                    this.formData.subscribed = true
                }
            }
        },
        subscribedFail(itemKey) {
            this.formData.subscribed = false
            uni.getSetting({
                withSubscriptions: true,
                success(e) {
                    console.log(e)
                    const mainSwitch = e.subscriptionsSetting.mainSwitch
                    const itemStatus = e.subscriptionsSetting[itemKey]
                    if (!mainSwitch) {
                        uni.showModal({
                            title: '提示',
                            content: '订阅失败,可前往设置中心开启消息通知权限',
                            success(modalRes) {
                                if (modalRes.confirm) {
                                    uni.openSetting({
                                        withSubscriptions: true,
                                        success(e) {
                                            console.log('消息通知设置状态')
                                            console.log(e)
                                        },
                                    })
                                }
                            },
                        })
                    } else if (itemStatus === 'reject') {
                        uni.showModal({
                            title: '提示',
                            content: '订阅失败,可前往设置中心开启消息通知权限',
                            success(modalRes) {
                                if (modalRes.confirm) {
                                    uni.openSetting({
                                        withSubscriptions: true,
                                        success(e) {
                                            console.log('消息通知设置状态')
                                            console.log(e)
                                        },
                                    })
                                }
                            },
                        })
                    }
                },
            })
        },
        dateChange() {
            this.$nextTick(() => {
                if (!this.showLunar) {
                    this.formData.lunar = 0
                }
            })
        },
        showLeap(item) {
            const birthDay = dayjs(item.time)
            const result = lunar2solar(birthDay.year(), birthDay.month() + 1, birthDay.date(), true) !== -1
            if (!result) {
                item.leap = false
            }
            return result
        },
        onadload(e) {
            console.log('广告数据加载成功')
        },
        async onadclose(e) {
            let me = this
            console.log(e)
            const detail = e.detail
            // 用户点击了【关闭广告】按钮
            if (detail && detail.isEnded) {
                // 每次赠送五分之广告时长的奖励,最少两个，最多五个
                let score = Math.floor((+new Date() - this.startAdTime) / 1000 / 5)
                score = Math.min(score, 5)
                score = Math.max(score, 2)
                // 正常播放结束
                try {
                    const uniScores = db.collection('uni-id-scores')
                    uni.showLoading({ title: '时光币发放中...' })
                    await uniScores.add({
                        balance: score,
                        score,
                        type: 1,
                        comment: `观看激励视频赠送${score}时光币`,
                    })
                    this.balance = score
                    uni.hideLoading()
                    const modalRes = await uni.showModal({
                        title: '提示',
                        content: `您已获得 ${score} 时光币，是否花费 1 时光币${me.formDataId ? '修改' : '创建'}`,
                    })
                    if (modalRes.confirm) {
                        this.submitForm()
                    }
                } catch (e) {
                    console.log(e)
                    uni.hideLoading()
                    uni.navigateBack()
                }
            }
        },
        onaderror(e) {
            // 广告加载失败
            console.log('onaderror: ', e.detail)
        },
        /**
         * 获取表单数据
         * @param {Object} id
         */
        getDetail(id) {
            uni.showLoading({
                mask: true,
            })
            db.collection(dbCollectionName)
                .doc(id)
                .field('name,time,type,lunar,leap,subscribed')
                .get()
                .then((res) => {
                    const data = res.result.data[0]
                    if (data) {
                        if (data.leap) {
                            data.leap = [1]
                        } else {
                            data.leap = []
                        }
                        this.formData = { ...data }
                        this.formDataOrigin = { ...data }
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
        /**
         * 验证表单并提交
         */
        async submit() {
            const res = await this.$refs.form.validate().catch((e) => false)
            if (res) {
                //如果是vip用户，直接创建，不消耗时光币
                if (this.userInfo.userType === 1 || this.userInfo.userType === 2) {
                    this.submitForm()
                } else {
                    await this.getbalance(true)
                    if (this.balance > 0) {
                        this.showUseModal()
                    } else {
                        this.showGetBalanceModal()
                    }
                }
            }
        },
        async showGetBalanceModal() {
            const modalRes = await uni.showModal({
                title: '提示',
                content: `您目前剩余 0 时光币,观看视频可立即获得时光币奖励`,
            })
            if (modalRes.confirm) {
                this.$refs.adRewardedVideo.show()
                // uni.navigateTo({
                //     url: '/pages/ad-video',
                // })
                this.startAdTime = +new Date()
                console.log('打开广告')
            }
        },
        async showUseModal() {
            const balance = this.balance
            let me = this
            const modalRes = await uni.showModal({
                title: '提示',
                content: `是否花费 1 时光币${me.formDataId ? '修改' : '创建'}，目前剩余 ${balance} 时光币`,
            })
            if (modalRes.confirm) {
                this.submitForm()
            }
        },
        /**
         * 提交表单
         */
        async submitForm() {
            const { name, time, type, lunar, leap, subscribed, subscribedTemplateId } = this.formData
            const params = {
                name,
                time,
                type,
                lunar,
                subscribed,
                subscribedTemplateId,
                leap: !!(leap[0] && lunar),
            }

            // 使用 clientDB 提交数据
            uni.showLoading({
                mask: true,
            })
            try {
                let res
                const formDataId = this.formDataId
                if (formDataId) {
                    res = await db.collection(dbCollectionName).doc(this.formDataId).update(params)
                } else {
                    res = await db.collection(dbCollectionName).add(params)
                }
                const { result } = res
                if (result.errCode === 0) {
                    uni.showToast({
                        icon: 'none',
                        title: `${formDataId ? '修改' : '新增'}成功`,
                    })

                    if (this.userInfo.userType !== 1 && this.userInfo.userType !== 2) {
                        this.setbalance(-1, type)
                    }
                    this.getOpenerEventChannel().emit('refreshData')
                    setTimeout(() => {
                        if (formDataId) {
                            uni.navigateBack()
                        } else {
                            uni.switchTab({ url: '/pages/special-days/list' })
                        }
                    }, 500)
                } else {
                    uni.showToast({
                        icon: 'none',
                        title: result.message,
                    })
                }
            } catch (e) {
                console.log(e)
            }
            uni.hideLoading()
        },
        async setbalance(score, type) {
            try {
                const remainBalance = this.balance + score
                let { result } = await db.collection('uni-id-scores').add({
                    balance: remainBalance,
                    score,
                    type: score > 0 ? 1 : 2,
                    comment: '添加' + SpecialDayType[type],
                })
                if (result.errCode === 0) {
                    this.balance = remainBalance
                } else {
                    uni.showToast({
                        icon: 'none',
                        title: result.message,
                    })
                }
            } catch (e) {
                console.log(e)
            }
        },
        async getbalance(showLoading) {
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
                this.balance = res.result.data[0]?.balance || 0
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

.mask-position {
    left: 20rpx;
    top: 350rpx;
    width: 300rpx;
    height: 600rpx;
}
.circle {
    width: 250rpx;
    position: absolute;
    left: 100rpx;
    top: 0;
}
.arrow {
    width: 80rpx;
    position: absolute;
    left: 250rpx;
    top: 130rpx;
}
.alert {
    color: white;
    width: 200rpx;
    position: absolute;
    left: 230rpx;
    top: 260rpx;
}

.know {
    width: 200rpx;
    position: fixed;
    left: 275rpx;
    bottom: 200rpx;
}
</style>
