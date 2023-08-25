<template>
    <view class="p25">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            v-slot:default="{ data, loading, error, options }"
            :options="options"
            :collection="collectionList"
            field="name,time,type,lunar,leap,subscribed,remark,avatar,poster,_id,ground_id,user_id"
            :where="queryWhere"
            :getone="true"
            :manual="true"
        >
            <view v-if="error">{{
                error.message.indexOf('timeout') ? '请检查网络后重试' : '连接错误，请退出重试'
            }}</view>
            <view v-else-if="loading">
                <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
            </view>
            <view v-else-if="data" class="list-details pl30 pr30">
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
            </view>
        </unicloud-db>
        <view class="h-between-center mt70">
            <view class="f-grow edit-btn f36 white h-center" @click="handleUpdate">修改</view>
            <view class="ml20 f-grow del-btn f36 white h-center" @click="handleDelete">删除</view>
        </view>

        <uni-fab
            ref="fab"
            :content="content"
            horizontal="right"
            direction="horizontal"
            @trigger="trigger"
            :pattern="{
                icon: 'redo',
            }"
        />
        <uni-popup ref="popupRef">
            <view style="width: 670rpx" class="bg-white br20 pl25 pr25 pt30 pb30">
                <view class="t-center f36 fw5">提示</view>
                <view class="fw1 fc-gray mt10"> 分享后他人可以在时光广场浏览、收藏你分享的日期、头像、海报信息。 </view>
                <view class="fw1 fc-gray"> 每一个收藏将奖励一个时光币，在下方选择一个分类分享吧！ </view>

                <view class="mt20 mb20">
                    <uni-data-checkbox v-model="categorySelected" :localdata="category"></uni-data-checkbox>
                </view>

                <view class="p10 f36 br20 white h-center ml50 mr50" style="background: #3494f8" @click="shareClick"
                    ><uni-icons class="mr10" type="redo" color="white" :size="26"></uni-icons>分享</view
                >
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
import { getAge, setTime, totalDay } from '@/utils/getAge'
import { SpecialDayType } from '@/utils/emnu'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import { enumConverter } from '@/js_sdk/validator/special-days'
import UniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup'
import UniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons'
import { shareMessageCall, shareTimelineCall } from '@/utils/common'
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

const birthShareContent = [
    {
        iconPath: '/static/block.png',
        selectedIconPath: '/static/block-active.png',
        text: '广场',
        active: false,
    },
    {
        iconPath: '/static/file.png',
        selectedIconPath: '/static/file-active.png',
        text: '生日',
        active: false,
    },
    {
        iconPath: '/static/avatar.png',
        selectedIconPath: '/static/avatar-active.png',
        text: '年龄',
        active: false,
    },
    {
        iconPath: '/static/avatar.png',
        selectedIconPath: '/static/avatar-active.png',
        text: '好友',
        type: 'shareButton',
        active: false,
    },
]

const otherShareContent = [
    {
        iconPath: '/static/block.png',
        selectedIconPath: '/static/block-active.png',
        text: '广场',
        active: false,
    },
    {
        iconPath: '/static/file.png',
        selectedIconPath: '/static/file-active.png',
        text: '海报',
        active: false,
    },
]

const content = ref([])
const queryWhere = ref()
const udb = ref()
const popupRef = ref()
const category = ref([])
const categorySelected = ref()

let detailId

onShareAppMessage(() => {
    const { _id } = udb.value.dataList
    return shareMessageCall({ specialDayId: _id })
})
onShareTimeline(() => {
    const { _id } = udb.value.dataList
    return shareMessageCall({ specialDayId: _id })
})

onLoad((e) => {
    detailId = e.specialDayId
    queryWhere.value = '_id=="' + specialDayId + '"'

    getGroundCategory()
})
onShow(() => {
    const specialStatus = uni.getStorageSync('specialStatus')
    if (specialStatus === 'update') {
        uni.setStorage({
            key: 'specialStatus',
            data: 'updateList', //用于在列表页更新
        })
        udb.value.loadData(
            {
                clear: true,
            },
            async (dateDetail) => {
                const { user_id, poster, ground_id } = dateDetail
                if (poster?.length > 0 && ground_id) {
                    const { result } = await db.collection('special-days-share').where({ _id: ground_id }).get()
                    if (result?.data[0]?.user_id === user_id) {
                        updateGroundDate(dateDetail)
                    }
                }
            },
        )
    }
})

const trigger = debounce(function (e) {
    const index = e.index
    content.value[index].active = true
    const data = udb.value.dataList
    if (index === 0) {
        shareGround(data)
    } else if (index === 1) {
        if (data.type === SpecialDayType['生日']) {
            shareBirthDay(data, true)
        } else {
            shareBirthDay(data)
        }
    } else if (index === 2) {
        shareBirthDay(data)
    }

    setTimeout(() => {
        content.value[index].active = false
    }, 500)
}, 200)

const shareClick = debounce(async () => {
    if (!categorySelected.value) {
        return uni.showToast({
            icon: 'error',
            title: '请选择一个分类',
        })
    }
    const data = udb.value.dataList //获取<unicloud-db> 组件的data
    const { name, time, type, lunar, leap, remark, avatar, poster, _id } = data
    const shareData = { name, time, type, lunar, leap, remark, avatar, poster, category: categorySelected.value }

    shareData.user_day_id = _id
    const { result: shareRes } = await db.collection('special-days-share').add(shareData)
    if (shareRes.id) {
        uni.showToast({
            icon: 'success',
            title: '分享成功',
        })
        await db.collection('special-days').doc(_id).update({
            ground_id: shareRes.id,
        })
        udb.value.refresh()
    }
    popupRef.value.close()
}, 300)

async function getGroundCategory() {
    const { result } = await uniCloud.callFunction({
        name: 'time-ground-category',
    })
    category.value = result.map((item) => {
        return {
            text: item,
            value: item,
        }
    })
}

async function shareGround(data) {
    if (data.poster?.length > 0) {
        // if (process.env.NODE_ENV === 'development') {
        //     return popupRef.value.open()
        // }
        const { ground_id, user_id } = data

        if (ground_id) {
            const { result } = await db.collection('special-days-share').where({ _id: ground_id }).get()
            if (result?.data[0]?.user_id === user_id) {
                updateGroundDate(data)
            } else {
                uni.showModal({
                    title: '提示',
                    content: '收藏日期不可再次分享',
                    showCancel: false,
                })
            }
        } else {
            popupRef.value.open()
        }
    } else {
        uni.showModal({
            title: '提示',
            content: '分享日期到时光广场需要上传至少一张照片',
            showCancel: false,
        })
    }
}

async function updateGroundDate(dateDetail) {
    const { name, time, type, lunar, leap, remark, avatar, poster, ground_id } = dateDetail
    const shareData = { name, time, type, lunar, leap, remark, avatar, poster }
    const updateModalRes = await uni.showModal({
        title: '提示',
        content: '是否将修改内容更新到时光广场',
    })
    if (updateModalRes.confirm) {
        const { result: updateRes } = await db.collection('special-days-share').doc(ground_id).update(shareData)
        if (!updateRes.code) {
            uni.showToast({
                title: '更新成功',
                icon: 'success',
            })
        }
    }
}

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
        content.value = birthShareContent
    } else {
        content.value = otherShareContent
    }
}

function shareBirthDay(data, isBirthDay) {
    const { time, lunar, leap, type, name, _id } = data
    let remainDay, normalTime
    if (type === SpecialDayType['提醒日']) {
        //提醒日交换remainDay与日期位置
        remainDay = dayjs(time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'days')
        if (remainDay < 0) {
            remainDay = `已经过了 ${-remainDay} 天`
        } else if (remainDay === 0) {
            remainDay = `今天是${SpecialDayType[type]}哦`
        } else {
            remainDay = `还有 ${remainDay} 天`
        }
        normalTime = dayjs(time).format('YYYY-MM-DD')
        let temp = normalTime
        normalTime = remainDay
        remainDay = temp
    } else {
        const ageObj = getAge(time, lunar, leap)
        const { allDay, cYear, cMonth, cDay, lYear, IMonthCn, IDayCn, aYear, oneBirthTotalDay } = ageObj
        remainDay = ageObj.remainDay
        if (type === SpecialDayType['生日']) {
            //如果分享时选择生日
            if (isBirthDay) {
                //生日隐藏年份
                if (!lunar) {
                    normalTime = `${cMonth}-${cDay}`
                } else {
                    normalTime = `${IMonthCn}${IDayCn}`
                }
                if (remainDay === 0) {
                    remainDay = `今天是${SpecialDayType[type]}哦`
                } else {
                    remainDay = `还有 ${remainDay} 天`
                }
            } else {
                //如果分享时选择年龄
                //如果年龄大于0,则以岁数显示，否则以天数显示，将计算值赋于remainDay
                if (aYear > 0) {
                    // 将打开app时记录的日期，在setInterval外获取，解决用户在晚上12点前打开，一直停留到该页面过12点，导致currentDayFloat计算错误
                    const openAppDay = dayjs().format('YYYY-MM-DD 00:00:00') //
                    let currentDayFloat = dayjs().diff(openAppDay, 'day', true)
                    //生日当天remainDay为0,做无需ayear+1
                    if (remainDay === 0) {
                        remainDay = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(2) + ' 岁'
                    } else {
                        remainDay = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(2) + ' 岁'
                    }
                } else {
                    remainDay = `${allDay} 天`
                }
            }
        } else {
            if (!lunar) {
                normalTime = `${cYear}-${cMonth}-${cDay}`
            } else {
                normalTime = `${lYear} ${IMonthCn}${IDayCn}`
            }
            remainDay = `第 ${totalDay(time)} 天`
        }
    }

    const obj = {
        label: SpecialDayType[type] === '生日' && isBirthDay ? name + SpecialDayType[type] : name,
        value: remainDay,
        unit: normalTime,
    }
    //data中可能存在多张图片对像，故改为storage传递
    uni.setStorageSync('shareDetails', JSON.stringify(data))

    uni.navigateTo({
        url: '/pages/home/poster-setting?data=' + JSON.stringify(obj),
    })
}

function handleUpdate() {
    // 打开修改页面
    uni.navigateTo({
        url: './add?id=' + detailId,
    })
}
async function handleDelete() {
    udb.value.remove(detailId, {
        success: (res) => {
            uni.setStorageSync('specialStatus', 'del')
            // 删除数据成功后跳转到list页面
            uni.setStorageSync('specialDayDeleteId', detailId)
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
