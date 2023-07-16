<template>
    <view class="p25">
        <uni-forms
            ref="form"
            :model="formData"
            :rules="rules"
            validate-trigger="submit"
            err-show-type="toast"
            :label-width="50"
        >
            <uni-forms-item name="name" label="名称" required>
                <uni-easyinput
                    v-model="formData.name"
                    v-model:lunar="formData.lunar"
                    v-model:leap="formData.leap"
                    trim="both"
                ></uni-easyinput>
            </uni-forms-item>
            <uni-forms-item name="time" label="日期" required>
                <date-picker-format
                    :modelValue="{ time: formData.time, lunar: formData.lunar, leap: formData.leap }"
                    @change="dateChange"
                />
            </uni-forms-item>
            <uni-forms-item name="type" label="类型" required>
                <view class="mt6">
                    <uni-data-checkbox
                        v-model="formData.type"
                        :localdata="formOptions.type_localdata"
                    ></uni-data-checkbox>
                </view>
            </uni-forms-item>
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

            <uni-forms-item name="remark" label="头像">
                <uni-file-picker
                    class="bg-white"
                    :imageStyles="{
                        width: '185rpx',
                        height: '185rpx',
                        background: 'white',
                        border: {
                            radius: '20rpx',
                        },
                    }"
                    file-mediatype="image"
                    file-extname="jpg,png"
                    return-type="object"
                    v-model="formData.avatar"
                >
                </uni-file-picker>
            </uni-forms-item>
            <uni-forms-item name="remark" label="相册">
                <uni-file-picker
                    class="bg-white"
                    :imageStyles="{
                        width: '185rpx',
                        height: '330rpx',
                        border: {
                            radius: '20rpx',
                        },
                    }"
                    file-mediatype="image"
                    file-extname="jpg,png"
                    :limit="50"
                    return-type="array"
                    v-model="formData.poster"
                >
                </uni-file-picker>
            </uni-forms-item>
            <uni-forms-item name="remark" label="备注">
                <uni-easyinput
                    :auto-height="true"
                    type="textarea"
                    v-model="formData.remark"
                    trim="both"
                ></uni-easyinput>
            </uni-forms-item>

            <view class="uni-button-group pb40">
                <button :disabled="submitDisable" type="primary" class="uni-button" @click="submit">提交</button>
            </view>
        </uni-forms>
        <ad-video ref="adVideo" :action="submitForm" />

        <view v-if="showLunarTip" class="self-mask">
            <uni-transition class="p-a mask-position" mode-class="slide-right" :duration="500" :show="showLunarTip">
                <image src="/static/circle.svg" class="circle" mode="widthFix" />
                <image src="/static/arrow.svg" class="arrow" mode="widthFix" />
                <view class="alert">若每年过农历生日，记得选农历哦！</view>
            </uni-transition>
            <image @click="closeLunarTip.func" src="/static/know.svg" class="know" mode="widthFix" />
        </view>
    </view>
</template>

<script setup>
import { SpecialDayType } from '../../utils/emnu'
import { tipFactory, shareMessageCall, uniCloudUploadImage, selectEditUploadImage } from '@/utils/common'
import AdVideo from '@/components/ad-video.vue'

const showLunarTip = ref(false)
const closeLunarTip = ref({ func: () => {} })
const openLunarTip = tipFactory('showLunarTip', showLunarTip, closeLunarTip)
const vm = ref()
onShow(() => {
    //获取vue2中的变量,如何当前日期为生日，才提示
    const { proxy } = getCurrentInstance()
    if (proxy.formData.type === SpecialDayType['生日']) {
        openLunarTip()
    }
    vm.value = proxy
})
onShareAppMessage(shareMessageCall)
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
import { debounce, assign, cloneDeep } from 'lodash'

let me

export default {
    data() {
        let formData = {
            name: '',
            time: null,
            type: 1,
            lunar: 0,
            leap: 0,
            subscribed: false,
            remark: '',
            subscribedTemplateId: [],
            avatar: '',
            poster: [],
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
    mounted() {
        me = this
    },
    unmounted() {
        me = null
    },
    onLoad(e) {
        if (e.id) {
            const id = e.id
            this.formDataId = id
            this.getDetail(id)
        }
        if (e.shareDay) {
            this.formData = assign(this.formData, JSON.parse(e.shareDay))
        }
        const title = this.formDataId ? '修改' : '新增'
        uni.setNavigationBarTitle({ title })
    },

    methods: {
        dateChange(e) {
            console.log(e)
            const { time, lunar, leap } = e
            this.formData.time = new Date(time).getTime()
            this.formData.lunar = lunar
            this.formData.leap = leap
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
        showLeap(item) {
            const birthDay = dayjs(item.time)
            const result = lunar2solar(birthDay.year(), birthDay.month() + 1, birthDay.date(), true) !== -1
            if (!result) {
                item.leap = false
            }
            return result
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
                .field('name,time,type,lunar,leap,subscribed,remark,poster,avatar')
                .get()
                .then((res) => {
                    const data = res.result.data[0]
                    if (data) {
                        this.formData = assign(this.formData, data) //lodash的分配经测试是异步的
                        setTimeout(() => {
                            this.formDataOrigin = cloneDeep(this.formData)
                        })
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
        submit: debounce(async () => {
            const res = await me.$refs.form.validate().catch((e) => false)
            if (res) {
                if (
                    me.formData.type === SpecialDayType['生日'] &&
                    dayjs(me.formData.time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'day') >= 1
                ) {
                    return uni.showModal({
                        title: '提示',
                        content: '生日时间设置不能超过当日',
                        showCancel: false,
                    })
                }

                const { userType, nickname, avatar_file } = me.userInfo
                //如果是vip用户，直接创建，不消耗时光币
                if (userType === 1 || userType === 2) {
                    me.submitForm()
                } else {
                    if (nickname && avatar_file && avatar_file.url) {
                        const formDataId = me.formDataId
                        me.$refs.adVideo.beforeOpenAd({
                            useScore: 1,
                            comment: formDataId ? '修改纪念日' : '设置纪念日',
                        })
                    } else {
                        me.showSetUserInfoModal()
                    }
                }
            }
        }, 300),
        async showSetUserInfoModal() {
            const modalRes = await uni.showModal({
                title: '提示',
                content: `需花费1时光币，您目前剩余 0 时光币,完个头像与昵称设置可立即获取5时光币`,
            })
            if (modalRes.confirm) {
                uni.navigateTo({
                    url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo',
                })
            }
        },
        /**
         * 提交表单
         */
        async submitForm() {
            const { name, time, type, lunar, leap, subscribed, subscribedTemplateId, remark, avatar, poster } =
                this.formData
            const params = {
                name,
                time: new Date(time).getTime(),
                type,
                lunar,
                remark,
                subscribed,
                subscribedTemplateId,
                leap: !!(leap && lunar),
                avatar,
                poster,
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
                    const { result: totalRes } = await db.collection(dbCollectionName).count()
                    params.sort = totalRes.total
                    res = await db.collection(dbCollectionName).add(params)
                }
                const { result } = res
                if (result.errCode === 0) {
                    uni.showToast({
                        icon: 'none',
                        title: `${formDataId ? '修改' : '新增'}成功`,
                    })

                    setTimeout(() => {
                        if (formDataId) {
                            uni.navigateBack()
                        } else {
                            uni.switchTab({ url: '/pages/special-days/list' })
                        }
                        this.getOpenerEventChannel().emit('refreshData')
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
page {
    background-color: white !important;
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
