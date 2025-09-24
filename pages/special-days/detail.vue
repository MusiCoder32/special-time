<template>
    <view v-if="loginSuccess" class="p25">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            v-slot:default="{ data, loading, error, options }"
            :options="options"
            :collection="collectionList"
            field="name,time,type,lunar,leap,subscribed,remark,avatar,poster,_id,ground_id,user_id"
            :where="queryWhere"
            :getone="true"
            :loadtime="false"
        >
            <view v-if="error">{{
                error.message.indexOf('timeout') ? '请检查网络后重试' : '连接错误，请退出重试'
            }}</view>
            <view v-else-if="loading">
                <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
            </view>
            <view v-else-if="data" class="list-details w100 pl30 pr30 pb30 p-r">
                <view class="detail-item h-start-center">
                    <text class="f32 fc-66 mr40">名称</text>
                    <text class="fc-black f-grow w0 ellipsis f32">{{ data.name }}</text>
                </view>
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">日期</text>
                    <text class="fc-black f32">{{
                        SpecialDayType[data.type] === '节日' ? data.normalTime?.slice(5) : data.normalTime
                    }}</text>
                </view>
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">类型</text>
                    <text class="fc-black f32">{{ SpecialDayType[data.type] }}</text>
                </view>
                <template v-if="data.type === SpecialDayType['生日']">
                    <view class="detail-item" v-if="data.lunar">
                        <text class="f32 fc-66 mr40">公历</text>
                        <text class="fc-black f32">{{ data.solarDate }}</text>
                    </view>
                    <view class="detail-item">
                        <text class="f32 fc-66 mr40">生肖</text>
                        <text class="fc-black f32">{{ data.Animal }}</text>
                    </view>
                    <view class="detail-item">
                        <text class="f32 fc-66 mr40">星座</text>
                        <text class="fc-black f32">{{ data.astro }}</text>
                    </view>
                </template>

                <view class="detail-item">
                    <text class="f32 fc-66 mr40">消息通知</text>
                    <text class="fc-black f32" :class="data.subscribed ? '' : 'fc-orange'">{{
                        data.subscribed ? '已开启' : '未开启'
                    }}</text>
                </view>
                <view class="detail-item h-start-start">
                    <text class="f32 fc-66 mr40">头像</text>
                    <uni-file-picker
                        readonly
                        :modelValue="data.avatar"
                        :imageStyles="{
                            width: 95,
                            height: 95,
                            border: {
                                radius: 10,
                            },
                        }"
                        file-mediatype="image"
                    >
                    </uni-file-picker>
                </view>
                <view class="detail-item h-start-start">
                    <text class="f32 fc-66 mr40">照片</text>
                    <uni-file-picker
                        readonly
                        :limit="6"
                        :modelValue="data.poster"
                        :imageStyles="{
                            width: '185rpx',
                            height: '330rpx',
                            border: {
                                radius: '20rpx',
                            },
                        }"
                        file-mediatype="image"
                    >
                    </uni-file-picker>
                </view>

                <view class="h-start-start">
                    <text style="line-height: 93rpx" class="f32 fc-66 mr40">备注</text>
                    <text style="padding-top: 20rpx" class="fc-black f-grow f32">{{ data.remark }}</text>
                </view>

                <view class="h-between-center mt70 pb40 p-a w100 left-0" style="bottom: -180rpx">
                    <template v-if="!showFavorite">
                        <view class="f-grow edit-btn f36 white h-center" @click="handleUpdate">修改</view>
                        <view class="ml20 f-grow del-btn f36 white h-center" @click="handleDelete">删除</view>
                    </template>
                    <view v-if="showFavorite" class="f-grow edit-btn f36 white h-center" @click="saveShareSpecialDay">保存</view>
                </view>
            </view>
        </unicloud-db>

        <uni-fab
            v-if="loginSuccess && !showFavorite"
            ref="fab"
            :content="content"
            horizontal="right"
            direction="horizontal"
            @trigger="trigger"
            :pattern="{
                icon: 'redo',
            }"
        />

    </view>

    <!--  该部分loading用于扫码进入时等待时间较长使用-->
    <!--  直接从列表页到详情页，基本感知不到该页面-->
    <view v-else class="v-center bg-logo vh100">
        <image class="s-rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.svg"></image>
        <view class="mt25 white">加载中...</view>
    </view>

</template>

<script setup>
import { setTime } from '@/utils/getAge'
import { SpecialCategory, SpecialDayType } from '@/utils/emnu'
import dayjs from 'dayjs'
import { debounce, cloneDeep } from 'lodash'
import { enumConverter } from '@/js_sdk/validator/special-days'
import { shareBirthDay, shareMessageCall } from '@/utils/common'
import { store } from '@/uni_modules/uni-id-pages/common/store'
import { birthShareContent, otherShareContent } from '@/pages/special-days/common'

const db = uniCloud.database()

const collectionList = 'special-days'
const loadMore = ref({
    contentdown: '',
    contentrefresh: '',
    contentnomore: '',
})
const options = ref({
    // 将scheme enum 属性静态数据中的value转成text
    ...enumConverter,
})

const content = ref([])
const queryWhere = ref('')
const udb = ref()

const loginSuccess = ref(false)
const showFavorite = ref(false)
const shareSpecialDayDetails = ref()

let specialDayId

onShareAppMessage(() => {
    const { _id, type } = udb.value.dataList
    return shareMessageCall({ specialDayId: _id, specialDayType: type })
})
onShareTimeline(() => {
    const { _id, type } = udb.value.dataList
    return shareMessageCall({ specialDayId: _id, specialDayType: type })
})

onLoad((e) => {
    if (e.scene) {
        //代表直接从微信分享页面跳转过来,监听登录成功事件，判断该日期是别人分享的，还是自己分享的
        uni.$once('getStartSuccess', async () => {
            if (e.specialDayId) {
                specialDayId = e.specialDayId
                if (e.userId !== store.userInfo._id) {
                    shareSpecialDayDetails.value = {
                        nickname: e.nickname,
                        name: e.nickname,
                        specialDayType: e.nickname,
                    }
                    otherDay()
                } else {
                    selfDay()
                }
            } else {
                const sceneDetailsObj = JSON.parse(uni.getStorageSync('sceneDetails'))
                const { nickname, name, type, _id, userId } = sceneDetailsObj
                specialDayId = sceneDetailsObj.specialDayId || _id
                if (userId !== store.userInfo._id) {
                    //(specialDayId || _id) 兼容下早期海报中使用的_id字段
                    const specialDayType = sceneDetailsObj.specialDayType ?? type
                    shareSpecialDayDetails.value = { nickname, name, specialDayType }
                    otherDay()
                } else {
                    selfDay()
                }
            }
        })
    } else {
        specialDayId = e.specialDayId
        selfDay()
    }
})
onShow(() => {
    const specialStatus = uni.getStorageSync('specialStatus')
    if (specialStatus === 'update') {
        uni.setStorage({
            key: 'specialStatus',
            data: 'updateList', //用于在列表页更新
        })
    }
})

function selfDay() {
    loginSuccess.value = true
    nextTick(() => {
        queryWhere.value = '_id=="' + specialDayId + '"'
    })
    
}
function otherDay() {
    loginSuccess.value = true
    showFavorite.value = true
    const { nickname, name, specialDayType } = shareSpecialDayDetails.value
    nextTick(() => {
        queryWhere.value = '_id=="' + specialDayId + '"'
    })
    uni.showModal({
        title: '提醒',
        content: `"${nickname}"给你分享了“${name}${SpecialDayType[specialDayType]}”,可点击下方保存按钮保存该日期哦!`,
        showCancel: false,
    })
}

//保存他人分享的日期
async function saveShareSpecialDay() {
    const dbCollectionName = 'special-days'
    const params = { ...udb.value.dataList }
    delete params._id
    delete params.user_id
    delete params.Animal
    delete params.astro
    delete params.normalTime
    //代表分享的日期未被删除
    const { result: totalRes } = await db.collection(dbCollectionName).count()
    params.sort = totalRes.total
    const addRes = await db.collection(dbCollectionName).add(params)

    if (addRes.result.errCode === 0) {
        uni.showToast({
            icon: 'none',
            title: `保存成功`,
        })
        setTimeout(() => {
            uni.setStorageSync('specialStatus', 'add')
            uni.reLaunch({ url: '/pages/home/index?tabValue=' + SpecialCategory['全部'] })
        }, 1500)
    } else {
        uni.showToast({
            icon: 'none',
            title: '保存失败，即将跳转到首页...',
        })
        setTimeout(() => {
            uni.switchTab({ url: '' + '' + 'home/index' })
        }, 1500)
    }
}

const trigger = debounce(function (e) {
    const index = e.index
    const currentItem = content.value[index]
    currentItem.active = true
    const data = { ...udb.value.dataList }

    if (currentItem.type !== 'shareButton') {
        data.page = 'pages/special-days/detail'
        shareBirthDay(data, currentItem.text === '生日')
    }

    setTimeout(() => {
        currentItem.active = false
    }, 500)
}, 200)





function handleLoad(data) {
    const { time, lunar, leap, name, type, ground_id } = data
    const result = setTime(time, lunar, leap)
    const { lYear, IMonthCn, IDayCn, lMonth, lDay, cYear, cMonth, cDay, Animal, astro } = result
    data.Animal = `${Animal}`
    data.astro = `${astro}`
    if (!lunar) {
        data.normalTime = dayjs(time).format('YYYY-MM-DD')
    } else {
        data.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
        data.solarDate = `${cYear}-${cMonth}-${cDay}`
    }

    if (type === SpecialDayType['生日']) {
        content.value = cloneDeep(birthShareContent)
    } else {
        content.value = cloneDeep(otherShareContent)
    }
}

function handleUpdate() {
    // 打开修改页面
    uni.navigateTo({
        url: './add?specialDayId=' + specialDayId,
    })
}
async function handleDelete() {
    udb.value.remove(specialDayId, {
        success: (res) => {
            uni.setStorageSync('specialStatus', 'del')
            // 删除数据成功后跳转到list页面
            uni.setStorageSync('specialDayDeleteId', specialDayId)
            uni.navigateBack()
        },
    })
}
</script>

<style lang="scss">
$uni-shadow-base: 0 1px 5px 2px
    rgba(
        $color: #000000,
        $alpha: 0.3,
    ) !default;

page {
    background: $primary-bg;
}

.warning-color {
    color: #ffcc33;
}
</style>
