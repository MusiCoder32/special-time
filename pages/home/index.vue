<template>
    <view class="vh100 vw100 home v-start-center">
        <view :style="'height:' + navStatusHeight + 'px'" class="w100"></view>
        <view class="h-center mb20 mt30 fc-black f36">{{ time1 }} 星期{{ week }}</view>
        <view class="h-center mb60">
            <template v-for="(str, index) in time2" :key="index">
                <view v-if="index != 2 && index != 5" style="width: 70rpx; height: 95rpx" class="p-r mrn10 fhyt">
                    <image class="p-center" src="/static/time-bg.svg" style="width: 70rpx; height: 95rpx"></image>
                    <view class="p-center fc-time f58">{{ str }}</view>
                </view>
                <view v-else class="p-r fc-black f60 pl8 mrn2 mtn5">{{ str }}</view>
            </template>
        </view>

        <s-swiper v-if="ageAll" @share="genPost" class="w100" :color-arr="colorArr" :swiper-list="swiperList" />

        <scroll-view :scroll-y="true" class="scroll-view f-grow h0 mt20 pb20" :scroll-with-animation="true">
            <view
                @click.stop="toSpecialDay(item._id)"
                v-for="(item, index) in specialDay"
                :key="item._id"
                class="scroll-view-item h-start-center f12 mr20 p-r"
            >
                <view class="f-grow p-r w0 h100 v-start-start p25">
                    <!--                    <view style="right: 0; top: 0; width: 60rpx; height: 100rpx" class="h-center p-a">-->
                    <!--                        <image src="/static/more.svg" style="width: 6rpx; height: 30rpx"></image>-->
                    <!--                    </view>-->

                    <!--                  日期名称-->
                    <view class="h-start-center w100">
                        <image
                            v-if="SpecialDayType[item.type] === '提醒日'"
                            src="/static/alert.svg"
                            style="width: 50rpx; height: 50rpx"
                        ></image>
                        <image
                            v-if="SpecialDayType[item.type] === '生日'"
                            src="/static/birthday.svg"
                            style="width: 50rpx; height: 50rpx"
                        ></image>
                        <image
                            v-if="SpecialDayType[item.type] === '纪念日'"
                            src="/static/commemorate.svg"
                            style="width: 50rpx; height: 50rpx"
                        ></image>
                        <view class="f16 f-grow w0 f32 ellipsis ml8 fc-black">{{
                            SpecialDayType[item.type] === '生日' ? item.name + SpecialDayType[item.type] : item.name
                        }}</view>
                        <view class="ml30"></view>
                    </view>

                    <view class="fc-gray f28 h-start-center mt10">
                        <view>{{ item.normalTime }}</view>
                        <view
                            v-if="SpecialDayType[item.type] === '纪念日' && totalDay(item.time) > 0"
                            class="h-start-center"
                        >
                            <view class="ml10 mr8 mtn4 f32">|</view>
                            <view class="mr8">{{ totalDay(item.time) }}</view>
                            <view>天</view>
                        </view>
                        <view v-if="item.type === SpecialDayType['生日']" class="h-start-center mt5">
                            <view class="ml10 mr8 mtn4 f32">|</view>
                            <view v-if="item.age" class="mr8 fc-orange">{{ item.age }}</view>
                            <view v-else class="mr8 fc-orange">{{ item.allDay }}</view>
                            <view>{{ item.age ? '岁' : '天' }}</view>
                        </view>
                    </view>

                    <view v-if="item.remainDay" class="h-start-center fc-gray f28 mt10">
                        <template v-if="item.remainDay < 0 && item.type === SpecialDayType['提醒日']">
                            <view class="">距离{{ item.name }}已经过了</view>
                            <view class="f36 ml8 mr8 fc-red">{{ 0 - item.remainDay }}</view>
                            <view>天</view>
                        </template>
                        <template v-else>
                            <view class="">距离{{ SpecialDayType[item.type] }}还有</view>
                            <view class="f36 ml8 mr8 fc-red">{{ item.remainDay }}</view>
                            <view>天</view>
                        </template>
                    </view>
                    <view v-else class="f32 w100 ellipsis mr2 fc-orange mt10">
                        今天是{{ item.name + '的' + SpecialDayType[item.type] }}
                    </view>
                </view>
            </view>
            <uni-load-more
                @clickLoadMore="clickLoadMore"
                :contentText="{
                    contentdown: '点击查看更多',
                }"
                :status="loading ? 'loading' : hasMore ? 'more' : 'noMore'"
            ></uni-load-more>
        </scroll-view>

        <view v-if="showHomeTipShare" :style="'top:' + navStatusHeight + 'px'" class="self-mask showHomeTipShare">
            <uni-transition class="p-a mask-position" mode-class="slide-right" :duration="500" :show="showHomeTipShare">
                <image src="/static/circle.svg" class="circle" mode="widthFix" />
                <image src="/static/arrow.svg" class="arrow" mode="widthFix" />
                <view class="alert">点击可进入分享页面</view>
            </uni-transition>
            <image @click="closeShareTip.func" src="/static/next.svg" class="know" mode="widthFix" />
        </view>

        <view v-if="showHomeTipSlider" :style="'top:' + navStatusHeight + 'px'" class="self-mask showHomeTipSlider">
            <uni-transition
                class="p-a mask-position"
                mode-class="slide-right"
                :duration="500"
                :show="showHomeTipSlider"
            >
                <view class="alert">点击或滑动可切换卡片</view>
            </uni-transition>
            <image @click="closeKnowTip.func" src="/static/know.svg" class="know" mode="widthFix" />
        </view>
    </view>
</template>

<script setup>
import SSwiper from '@/components/blackmonth-swiper'
import dayjs from 'dayjs'
import { computed, onMounted, ref, nextTick, beforeMount } from 'vue'
import { arriveDay, getAgeAll, getGrowTime, totalDay, totalYear, setTime, getAge } from '../../utils/getAge'
import ColorArr from './color-arr'
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
import { onShow, onLoad, onReachBottom, onShareAppMessage } from '@dcloudio/uni-app'
import { orderBy } from 'lodash'
import { SpecialDayType } from '@/utils/emnu' //不支持onLoad
import { tipFactory } from '@/utils/common'

const navStatusHeight = ref(uni.$navStatusHeight)
// 海报模板数据

const colorArr = ref(ColorArr)
let startTime = null
let startType = null
let leap = false
let endTime = null
const time1 = ref(dayjs().format('YYYY-MM-DD'))
const time2 = ref(dayjs().format('HH:mm:ss'))
const time3 = ref(dayjs().format('d'))
const week = computed(() => {
    let result = ''
    switch (+time3.value) {
        case 0:
            result = '日'
            break
        case 1:
            result = '一'
            break
        case 2:
            result = '二'
            break
        case 3:
            result = '三'
            break
        case 4:
            result = '四'
            break
        case 5:
            result = '五'
            break
        case 6:
            result = '六'
            break
    }
    return result
})
const ageOnly = ref()
const ageAll = ref('')
const months = ref('0')
const days = ref('0')
const hours = ref('0')

const loading = ref()
const hasMore = ref()

const birthDay = ref('0')
const specialDay = ref([])

let interer = null
const showEndTime = ref(false)

const swiperList = computed(() => {
    const a = [
        {
            value: ageOnly.value + '岁',
            label: '',
            unit: ageAll.value,
        },
    ]
    const c = [
        {
            value: months.value,
            label: '度过了',
            unit: '月',
        },
        {
            value: days.value,
            label: '经历了',
            unit: '天',
        },
        {
            value: hours.value,
            label: '相当于',
            unit: '小时',
        },
    ]
    if (showEndTime.value) {
        c.push(
            ...[
                {
                    value: dayjs(endTime).diff(dayjs(startTime), 'year') + '岁',
                    label: '计划离开年龄',
                    unit: '',
                },
                {
                    value: dayjs(endTime).format('YYYY-MM-DD'),
                    label: '计划离开日期',
                    unit: '剩余天数 ' + dayjs(endTime).diff(dayjs(), 'day'),
                },
            ],
        )
    }
    const b = []
    const result = setTime(startTime, startType, leap)
    if (!startType) {
        const { astro, Animal } = result
        const obj = {
            label: Animal,
            value: dayjs(startTime).format('YYYY-MM-DD'),
            unit: astro,
        }
        b.push(obj)
    } else {
        const { lYear, IMonthCn, IDayCn, cYear, cMonth, cDay, astro, Animal } = result
        const obj = {
            label: `${Animal} ${IMonthCn}${IDayCn}`,
            value: `${cYear}-${cMonth}-${cDay}`,
            unit: astro,
        }
        b.push(obj)
    }

    let obj
    if (birthDay.value) {
        obj = {
            value: birthDay.value,
            label: '距生日还有',
            unit: '天',
        }
    } else {
        obj = {
            value: 'Happy Birthday!',
            label: '生日快乐!',
            unit: Math.floor(ageOnly.value) + '岁 ',
        }
    }
    return [...a, ...b, obj, ...c]
})

const userInfo = computed(() => {
    return store.userInfo
})

const db = uniCloud.database()

const showHomeTipShare = ref(false)
const showHomeTipSlider = ref(false)

onShow(async () => {
    init()
    await guidModal()
    await beforeGuideModal()
})

async function guidModal() {
    await openShareTip()
    await openKnowTip()
}
/**
 * 使用工厂函数tipFactory创建打开引导页方法，实现异步控制；
 */
const closeShareTip = ref({ func: () => {} })
const openShareTip = tipFactory('showHomeTipShare', showHomeTipShare, closeShareTip)

const closeKnowTip = ref({ func: () => {} })
const openKnowTip = tipFactory('showHomeTipSlider', showHomeTipSlider, closeKnowTip)

//引导提示后的各类提示
async function beforeGuideModal() {
    /**
     * 若上一个提示引导至了其他页面，则返回Promise.reject(),将中断当前函数执行，后继提示不会弹出，
     * 若没有，则完成后执行下一个提示；
     */

    //分享按钮提示
    const sceneRes = await uni.getStorageSync('sceneDetails')
    if (sceneRes) {
        uni.removeStorage({
            key: 'sceneDetails',
        })
        saveSceneId(sceneRes)

        await showAddSpecialDayModal(sceneRes)
    }
    //纪念日、生日、提醒日到期提醒
    const importRes = await uni.getStorageSync('importantId')
    if (importRes) {
        uni.removeStorage({
            key: 'importantId',
        })
        await showImportantDayModal(importRes)
    }
}

async function showImportantDayModal(id) {
    try {
        const modalRes = await uni.showModal({
            title: '提示',
            content: `明天是个重要的日子哦`,
            confirmText: '立即查看',
        })
        if (modalRes.confirm) {
            uni.navigateTo({
                url: '/pages/special-days/detail?id=' + id,
            })
            Promise.reject()
        }
    } catch (e) {}
}
async function showAddSpecialDayModal(sceneDetailsJson) {
    try {
        let sceneDetails = JSON.parse(sceneDetailsJson)
        const { nickname, name, type, time, leap, lunar } = sceneDetails
        const modalRes = await uni.showModal({
            content: `${nickname}给你分享了“${name === nickname ? '他/她的' : name}${SpecialDayType[type]}”，是否创建`,
        })
        if (modalRes.confirm) {
            uni.navigateTo({
                url:
                    '/pages/special-days/add?shareDay=' +
                    JSON.stringify({
                        name,
                        type,
                        time,
                        leap,
                        lunar,
                    }),
            })
            return Promise.reject()
        }
    } catch (e) {}
}
function saveSceneId(sceneDetailsJson) {
    let sceneDetails = JSON.parse(sceneDetailsJson)
    const { userId, _id, sceneId } = sceneDetails
    //如果导入用户分享的二维码时，二维码中的用户id与自身的邀请用户id一致，且inviter_scene_id为空
    //则视为该用户为该二维码引流的新用户，将二维码id写入当前用户信息中，以便后期分析用户来源
    //之所以采取该实现逻辑，在于不想更改uni-id-page中注册逻辑
    if (userId === userInfo.value.inviter_uid[0] && !userInfo.value.inviter_scene_id) {
        db.collection('uni-id-users').where("'_id' == $cloudEnv_uid").update({
            inviter_special_day_id: _id,
            inviter_scene_id: sceneId,
        })
        //发放给邀请人
        inviterAward(userId)
    }
}

async function inviterAward(userId) {
    const uniScores = db.collection('uni-id-scores')
    try {
        const res = await uniScores
            .where({
                user_id: userId,
            })
            .field('balance')
            .orderBy('create_date desc')
            .limit(1)
            .get()
        await uniScores.add({
            user_id: userId,
            balance: res?.result?.data[0].balance + 5,
            score: 5,
            type: 1,
            comment: '邀请新用户获得',
        })
    } catch (e) {
        console.log(e)
    }
}

function clickLoadMore() {
    uni.switchTab({
        url: '/pages/special-days/list',
    })
}

function toSpecialDay(id) {
    uni.navigateTo({
        url: '/pages/special-days/detail?id=' + id,
    })
}

async function genPost(obj, index) {
    if (index === 1) {
        obj.value = obj.value.slice(5)
    }
    obj.shareDetails = {
        time: startTime,
        lunar: startType,
        leap,
        type: SpecialDayType['生日'],
        name: userInfo.value.nickname || 'momo',
        _id: userInfo._id, //分享用户自身生日时，使用用户id作为分享详情_id
    }
    uni.navigateTo({
        url: '/pages/home/poster-setting?data=' + JSON.stringify(obj),
    })
}

async function init() {
    let startData = {
        start_time: dayjs('1993-04-23').valueOf(),
        startType: 0,
        leap: false,
        end_time: dayjs('2100-1-1').valueOf(),
        show_end_time: false,
        end_time: dayjs('2100-1-1').valueOf(),
    }
    try {
        const startData = JSON.parse(uni.getStorageSync('startData'))
        const endData = JSON.parse(uni.getStorageSync('endData'))
        startData = { ...startData, ...endData }
    } catch (e) {
        try {
            const db = uniCloud.database()
            const {
                result: { errCode, data },
            } = await db
                .collection('start-end-time')
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                })
                .get()
            startData = data[0]
        } catch (e) {
            console.log(e)
        }
    }
    startTime = startData.start_time
    startType = startData.startType
    endTime = startData.end_time
    leap = startData.leap
    showEndTime.value = startData.show_end_time
    startInterval()
    getSpecialDays()
}

function startInterval() {
    const ageDetails = getAge(startTime, startType, leap)
    const { cYear, cMonth, cDay, remainDay, oneBirthTotalDay, aYear, aMonth } = ageDetails
    console.log(ageDetails)
    let solarTime = `${cYear}-${cMonth}-${cDay}`
    months.value = dayjs().diff(solarTime, 'month')
    days.value = dayjs().diff(solarTime, 'day')
    hours.value = dayjs().diff(solarTime, 'hour')
    birthDay.value = remainDay
    ageAll.value = `${aYear}岁${aMonth}个月`

    // 将打开app时记录的日期，在setInterval外获取，解决用户在晚上12点前打开，一直停留到该页面过12点，导致currentDayFloat计算错误
    const openAppDay = dayjs().format('YYYY-MM-DD 00:00:00') //

    let currentDayFloat = dayjs().diff(openAppDay, 'day', true)
    //生日当天remainDay为0,做无需ayear+1
    if (remainDay === 0) {
        ageOnly.value = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(7)
    } else {
        ageOnly.value = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(7)
    }

    if (interer) {
        clearInterval(interer)
        interer = null
    }
    interer = setInterval(() => {
        //生日当天remainDay为0,则无需ayear+1
        currentDayFloat = dayjs().diff(openAppDay, 'day', true)
        if (remainDay === 0) {
            ageOnly.value = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(7)
        } else {
            ageOnly.value = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(7)
        }

        time2.value = dayjs().format('HH:mm:ss')
        //晚上00:00:00时刻，更新所有时刻
        if (time2.value.indexOf('00:00:00') > -1) {
            time1.value = dayjs().format('YYYY-MM-DD')
            time3.value = dayjs().format('d')
            clearInterval(interer)
            interer = null
            startInterval()
            getSpecialDays()
        }
    }, 1000)
}

async function getSpecialDays() {
    loading.value = true
    try {
        let {
            result: { errCode, data },
        } = await db
            .collection('special-days')
            .aggregate()
            .match({
                user_id: db.getCloudEnv('$cloudEnv_uid'),
            })
            .end()

        if (errCode == 0) {
            data.forEach((item) => {
                const { time, lunar, leap, type } = item

                if (type === SpecialDayType['提醒日']) {
                    item.normalTime = dayjs(time).format('YYYY-MM-DD')
                    item.remainDay = dayjs(time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'days')
                } else {
                    const { allDay, remainDay, aYear, cYear, cMonth, cDay, lYear, IMonthCn, IDayCn } = getAge(
                        time,
                        lunar,
                        leap,
                    )
                    item.remainDay = remainDay
                    item.age = aYear
                    if (item.age === 0) {
                        item.allDay = allDay
                    }
                    if (!lunar) {
                        item.normalTime = `${cYear}-${cMonth}-${cDay}`
                    } else {
                        item.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
                    }
                }
                //解决提醒日remain为负，即提醒日已经过去后，排序在前面的问题
                if (item.remainDay >= 0) {
                    item.order = 0
                } else {
                    item.order = 1
                }
            })
            data = orderBy(data, ['order', 'remainDay'])
            if (data.length > 3) {
                hasMore.value = true
                data = data.slice(0, 3)
            } else {
                hasMore.value = false
            }
            specialDay.value = data
        }
    } catch (e) {
        console.log(e)
    }
    loading.value = false
}
</script>
<style lang="scss">
.home {
    background: $primary-bg;
    color: #ffffff;
    font-size: 36rpx;
}

@keyframes logo-rotate {
    from {
        transform: rotate(0);
    }

    to {
        transform: rotate(360deg);
    }
}

.rotate {
    animation: logo-rotate 3s linear infinite;
}

.scroll-view {
    white-space: nowrap;
    overflow: hidden;

    .scroll-view-item {
        width: 670rpx;
        margin: 0 40rpx 30rpx;
        height: 202rpx;
        mix-blend-mode: normal;
        border-radius: 20rpx;
        background: #ffffff99;
        box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
    }
}

.showHomeTipShare {
    .mask-position {
        left: 300rpx;
        top: 250rpx;
        width: 300rpx;
        height: 600rpx;
    }

    .circle {
        width: 200rpx;
        position: absolute;
        left: 200rpx;
        top: 0;
    }

    .arrow {
        width: 80rpx;
        position: absolute;
        left: 200rpx;
        top: 110rpx;
        transform: rotateY(180deg);
    }

    .alert {
        color: white;
        width: 200rpx;
        position: absolute;
        left: 100rpx;
        top: 250rpx;
    }
}

.showHomeTipSlider {
    .mask-position {
        left: 300rpx;
        top: 350rpx;
        width: 300rpx;
        height: 600rpx;
    }

    .alert {
        color: white;
        width: 200rpx;
        position: absolute;
        left: 0rpx;
        top: 250rpx;
    }
}

.know {
    width: 200rpx;
    position: fixed;
    left: 275rpx;
    bottom: 200rpx;
}
</style>
