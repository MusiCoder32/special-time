<template>
    <view class="p25">
        <uni-forms
            ref="form"
            :model="formData"
            :rules="validator"
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
                    :yearLength="formData.type === SpecialDayType['提醒日'] ? 100 : -100"
                    :show-lunar="
                        formData.type !== SpecialDayType['提醒日'] && formData.type !== SpecialDayType['纪念日']
                    "
                    :show-year="formData.type !== SpecialDayType['节日']"
                    :end="timeEnd"
                />
            </uni-forms-item>
            <uni-forms-item name="type" label="类型" required>
                <view class="mt6">
                    <uni-data-checkbox
                        @change="typeChange"
                        v-model="formData.type"
                        :localdata="dayTypeOption"
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
                <template #label>
                    <uni-tooltip style="width: 100rpx" content="可用作于分享海报的头像">
                        <view class="h-start-start mln4">
                            <uni-icons class="mtn10" type="info" color="#5e6d82" size="12" />
                            <view class="f28" style="color: #606266">头像</view>
                        </view>
                    </uni-tooltip>
                </template>

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
            <uni-forms-item name="remark" label="照片">
                <template #label>
                    <uni-tooltip style="width: 100rpx" content="可用作于分享海报的背景">
                        <view class="h-start-start mln4">
                            <uni-icons class="mtn10" type="info" color="#5e6d82" size="12" />
                            <view class="f28" style="color: #606266">照片</view>
                        </view>
                    </uni-tooltip>
                </template>
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
                <view class="alert">若每年过农历生日，记得选择农历日期哦！</view>
            </uni-transition>
            <image @click="closeLunarTip.func" src="/static/know.svg" class="know" mode="widthFix" />
        </view>
    </view>
</template>

<script setup>
import { SpecialDayType, dayTypeOption, LunarType } from '@/utils/emnu'
import { tipFactory, shareMessageCall } from '@/utils/common'
import AdVideo from '@/components/ad-video.vue'

import { validator } from '@/js_sdk/validator/special-days.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import dayjs from 'dayjs'
import { lunar2solar } from '@/utils/calendar'
import { debounce, assign, cloneDeep, isEqual } from 'lodash'

const db = uniCloud.database()
const dbCollectionName = 'special-days'
const form = ref()
const adVideo = ref()

const formData = ref({
    name: '',
    time: null,
    type: SpecialDayType['生日'],
    lunar: 0,
    leap: 0,
    subscribed: false,
    remark: '',
    subscribedTemplateId: [],
    avatar: null,
    poster: [],
})
const lunarRadio = []
for (const lunarTypeKey in LunarType) {
    if (typeof LunarType[lunarTypeKey] === 'number') {
        lunarRadio.push({
            value: LunarType[lunarTypeKey],
            text: lunarTypeKey,
        })
    }
}
let balance = 0
const formDataOrigin = ref(null)
const formDataId = ref(null)

const showLunarTip = ref(false)
const closeLunarTip = ref({ func: () => {} })

const openLunarTip = tipFactory('showLunarTip', showLunarTip, closeLunarTip)

const timeEnd = computed(() => {
    let result = null
    if (formData.value.type === SpecialDayType['生日'] || formData.value.type === SpecialDayType['纪念日']) {
        result = new Date()
    }
    return result
})

const showLunar = computed(() => {
    const date = dayjs(formData.value.time)
    return lunar2solar(date.year(), date.month() + 1, date.date()) !== -1
})

const submitDisable = computed(() => {
    let result
    if (!formDataId.value) {
        result = false
    }
    result = isEqual(formData.value, formDataOrigin.value)
    return result
})

onLoad((e) => {
    if (e.id) {
        const id = e.id
        formDataId.value = id
        getDetail(id)
    }
    if (e.shareDay) {
        const shareDayDetail = JSON.parse(e.shareDay)
        const shareDayId = shareDayDetail.shareDayId
        delete shareDayDetail.shareDayId
        formData.value = assign(formData.value, shareDayDetail)
        //由于最初设计时，没有相册与头像，故未将其存入scene这张表中。而最初设计这张表，就是避免用户进入时需要再次查询，
        //但现在还是避不了要查询，故后续考虑全走查询，减小scene中存放的数据量
        db.collection(dbCollectionName)
            .doc(shareDayId)
            .field('remark,poster,avatar')
            .get()
            .then((res) => {
                const data = res.result.data[0]
                if (data) {
                    formData.value = assign(formData.value, data) //lodash的分配经测试是异步的
                }
            })
    }
    const title = formDataId.value ? '修改' : '新增'
    uni.setNavigationBarTitle({ title })
})

onShow(() => {
    // //获取vue2中的变量,如何当前日期为生日，才提示
    // const { proxy } = getCurrentInstance()
    if (formData.value.type === SpecialDayType['生日']) {
        openLunarTip()
    }
})
onShareAppMessage(shareMessageCall)

function typeChange(e) {
    if (e.detail.value === SpecialDayType['提醒日']) {
        formData.value.time = new Date().getTime()
        formData.value.lunar = LunarType['公历']
        formData.value.leap = 0
    }
}

function dateChange(e) {
    const { time, lunar, leap } = e
    formData.value.time = new Date(time).getTime()
    formData.value.lunar = lunar
    formData.value.leap = leap
}
async function subscribedChange(e) {
    let me = this
    const bool = e.detail.value
    console.log(bool)
    formData.value.subscribed = bool
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
                    subscribedFail(beforeDay)
                } else if (res[beforeDay].indexOf('accept') > -1) {
                    formData.value.subscribed = true
                    formData.value.subscribedTemplateId = [beforeDay]
                    uni.showToast({
                        title: '订阅成功',
                    })
                }
            },
            fail(e) {
                subscribedFail(beforeDay)
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
            formData.value.subscribed = true
        }
    }
}
function subscribedFail(itemKey) {
    formData.value.subscribed = false
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
}
function showLeap(item) {
    const birthDay = dayjs(item.time)
    const result = lunar2solar(birthDay.year(), birthDay.month() + 1, birthDay.date(), true) !== -1
    if (!result) {
        item.leap = false
    }
    return result
}
/**
 * 获取表单数据
 * @param {Object} id
 */
function getDetail(id) {
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
                formData.value = assign(formData.value, data) //lodash的分配经测试是异步的
                setTimeout(() => {
                    formDataOrigin.value = { ...formData.value }
                }, 100)
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
}

async function checkContent() {
    let result = false
    uni.showLoading({ title: '内容安全检测中', mask: true })
    try {
        const { name, remark, avatar, poster } = formData.value
        //内容检测
        const { result: result1 } = await uniCloud.callFunction({
            name: 'content-check-text',
            data: {
                content: name,
            },
        })
        if (result1.errCode != 0) {
            throw new Error(`日期名称存在敏感内容，请修改`)
        }
        const { result: result2 } = await uniCloud.callFunction({
            name: 'content-check-text',
            data: {
                content: name,
            },
        })
        if (result2.errCode != 0) {
            throw new Error(`日期备注存在敏感内容，请修改`)
        }
        if (avatar && !avatar.checkResult) {
            const imgCheckedRes = await uniCloud.callFunction({
                name: 'content-check-img',
                data: {
                    image: avatar.url,
                },
            })
            if (imgCheckedRes.result.errCode != 0) {
                throw new Error(`头像存在敏感内容，请修改`)
            }
            avatar.checkResult = true
        }
        for (let i = 0; i < poster.length; i++) {
            let item = poster[i]
            if (!item.checkResult) {
                const imgCheckedRes = await uniCloud.callFunction({
                    name: 'content-check-img',
                    data: {
                        image: item.url,
                    },
                })
                if (imgCheckedRes.result.errCode != 0) {
                    throw new Error(`照片存在敏感内容，请修改`)
                }
                item.checkResult = true
            }
        }

        result = true
        uni.hideLoading()
        //内容检测
    } catch (e) {
        uni.showToast({
            title: e.message,
            icon: 'none',
        })
        console.log(e)
    }
    return result
}
/**
 * 验证表单并提交
 */
const submit = debounce(async () => {
    const res = await form.value.validate().catch((e) => false)
    if (res) {
        const contentCheckedResult = await checkContent()
        if (contentCheckedResult) {
            const { userType, nickname, avatar_file } = store.userInfo
            //如果是vip用户，直接创建，不消耗时光币
            if (userType === 1 || userType === 2) {
                submitForm()
            } else {
                if (nickname && avatar_file && avatar_file.url) {
                    adVideo.value.beforeOpenAd({
                        useScore: 1,
                        comment: formDataId.value ? '修改纪念日' : '设置纪念日',
                    })
                } else {
                    showSetUserInfoModal()
                }
            }
        }
    }
}, 300)

async function showSetUserInfoModal() {
    const modalRes = await uni.showModal({
        title: '提示',
        content: `需花费1时光币，您目前剩余 0 时光币,完个头像与昵称设置可立即获取5时光币`,
    })
    if (modalRes.confirm) {
        uni.navigateTo({
            url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo',
        })
    }
}
/**
 * 提交表单
 */
async function submitForm() {
    const { name, time, type, lunar, leap, subscribed, subscribedTemplateId, remark, avatar, poster } = formData.value
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
        if (formDataId.value) {
            res = await db.collection(dbCollectionName).doc(formDataId.value).update(params)
        } else {
            const { result: totalRes } = await db.collection(dbCollectionName).count()
            params.sort = totalRes.total
            res = await db.collection(dbCollectionName).add(params)
        }
        const { result } = res
        if (result.errCode === 0) {
            uni.showToast({
                icon: 'none',
                title: `${formDataId.value ? '修改' : '新增'}成功`,
            })
            setTimeout(() => {
                if (formDataId.value) {
                    uni.setStorageSync('specialStatus', 'update')
                    uni.navigateBack()
                } else {
                    uni.setStorageSync('specialStatus', 'add')
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
        uni.showToast({
            title: e.message,
            icon: 'none',
        })
        console.log(e)
    }
    uni.hideLoading()
}
async function setbalance(score, type) {
    try {
        const remainBalance = balance + score
        let { result } = await db.collection('uni-id-scores').add({
            balance: remainBalance,
            score,
            type: score > 0 ? 1 : 2,
            comment: '添加' + SpecialDayType[type],
        })
        if (result.errCode === 0) {
            balance = remainBalance
        } else {
            uni.showToast({
                icon: 'none',
                title: result.message,
            })
        }
    } catch (e) {
        console.log(e)
    }
}
async function getbalance(showLoading) {
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
        balance = res.result.data[0]?.balance || 0
    } catch (e) {
        console.log(e)
    }
    if (showLoading) {
        uni.hideLoading()
    }
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
    left: 0rpx;
    top: 110rpx;
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
