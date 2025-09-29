<template>
    <view v-if="!loading" class="p25">
        <view class="list-details w100 pl30 pr30 pb30 p-r">
            <view class="detail-item h-start-center">
                <text class="f32 fc-66 mr40">名称</text>
                <text class="fc-black f-grow w0 ellipsis f32">{{ specialDay.name }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">日期</text>
                <text class="fc-black f32">{{
                    SpecialDayType[specialDay.type] === '节日' ? specialDay.normalTime?.slice(5) : specialDay.normalTime
                }}</text>
            </view>
            <view class="detail-item">
                <text class="f32 fc-66 mr40">类型</text>
                <text class="fc-black f32">{{ SpecialDayType[specialDay.type] }}</text>
            </view>
            <template v-if="specialDay.type === SpecialDayType['生日']">
                <view class="detail-item" v-if="specialDay.lunar">
                    <text class="f32 fc-66 mr40">公历</text>
                    <text class="fc-black f32">{{ specialDay.solarDate }}</text>
                </view>
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">生肖</text>
                    <text class="fc-black f32">{{ specialDay.Animal }}</text>
                </view>
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">星座</text>
                    <text class="fc-black f32">{{ specialDay.astro }}</text>
                </view>
            </template>

            <view class="detail-item">
                <text class="f32 fc-66 mr40">消息通知</text>
                <text class="fc-black f32" :class="specialDay.subscribed ? '' : 'fc-orange'">{{
                    specialDay.subscribed ? '已开启' : '未开启'
                }}</text>
            </view>
            <view class="detail-item h-start-start">
                <text class="f32 fc-66 mr40">头像</text>
                <uni-file-picker
                    readonly
                    :modelValue="specialDay.avatar"
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
                    :modelValue="specialDay.poster"
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
                <text style="padding-top: 20rpx" class="fc-black f-grow f32">{{ specialDay.remark }}</text>
            </view>

            <view class="h-between-center mt70 pb40 p-a w100 left-0" style="bottom: -180rpx">
                <template v-if="!showFavorite">
                    <view class="f-grow edit-btn f36 white h-center" @click="handleUpdate">修改</view>
                    <view class="ml20 f-grow del-btn f36 white h-center" @click="handleDelete">删除</view>
                </template>
                <view v-if="showFavorite" class="f-grow edit-btn f36 white h-center" @click="saveShareSpecialDay"
                    >保存</view
                >
            </view>
        </view>

        <uni-fab
            v-if="!showFavorite"
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
import { shareBirthDay, shareMessageCall } from '@/utils/common'
import { birthShareContent, otherShareContent } from '@/pages/special-days/common'
import { useUserStore, useSpecialDaysStore } from '../../utils/stores'
const store = useUserStore()
const specialDaysStore = useSpecialDaysStore()
const db = uniCloud.database()

const content = ref([])
const queryWhere = ref('')
const udb = ref()

const loading = ref(true)
const showFavorite = ref(false)
const shareSpecialDayDetails = ref()
const specialDay = ref({})

let specialDayId

onShareAppMessage(() => {
    const { _id, type } = udb.value.dataList
    return shareMessageCall({ specialDayId: _id, specialDayType: type },'/pages/home/index')
})
onShareTimeline(() => {
    const { _id, type } = udb.value.dataList
    return shareMessageCall({ specialDayId: _id, specialDayType: type },'/pages/home/index')
})

onLoad((e) => {
        specialDayId = e.specialDayId
        const shareDay = uni.getStorageSync('shareDay')
           if(shareDay){
            showFavorite.value = true
        specialDay.value = shareDay
    } else {
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
    specialDaysStore.specialDays.value.forEach((item) => {
        if (item._id === specialDayId) {
            specialDay.value = item
        }
    })
    if(!specialDay.value) {
getDayDetail()
    }
}

function getDayDetail() {
        db.collection('special-days')
        .doc(specialDayId)
        .field('name,time,type,lunar,leap,subscribed,remark,poster,avatar,category')
        .get()
        .then((res) => {
            const data = res.result.data[0]
            if(data) {
 specialDay.value = data

            }
    
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
