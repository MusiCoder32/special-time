<template>
    <scroll-view class="z2 nowrap w100 p-s top-0 bg-primary pl20 pr20" :scroll-x="true">
        <view
            class="t-center pt30 pb20"
            style="display: inline-block; width: 150rpx"
            v-for="(item, index) in category"
            :key="item"
            @click="tabClick(item, index)"
            :class="{ active: tabIndex === index }"
        >
            {{ item }}
        </view>
    </scroll-view>

    <view v-if="currentPositionArr?.length === listData?.length" class="mt20 p-r bg-white">
        <view v-for="(item, index) in listData" :key="index" @click="handleItemClick(item._id)">
            <view
                class="scroll-view-item shadow v-start-start p25 p-a"
                :style="{
                    transition: currentDragIndex === index ? 'initial' : '.3s',
                    'z-index': currentDragIndex === index ? 1 : 0,
                    top: currentPositionArr[index].top + 'rpx',
                }"
            >
                <view
                    v-if="['全部', '提醒日', '纪念日', '生日'].includes(category[tabIndex])"
                    style="right: 0; top: 0; width: 60rpx; height: 100rpx"
                    class="h-center p-a"
                    @touchstart="handleTouchstart($event, index)"
                    @touchmove.stop="handleTouchmove"
                    @touchend.stop="handleTouchend"
                >
                    <image src="/static/more.svg" style="width: 6rpx; height: 30rpx"></image>
                </view>

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
                        v-if="item.type === SpecialDayType['纪念日'] && totalDay(item.time) > 0"
                        class="h-start-center"
                    >
                        <view class="ml10 mr8 mtn4 f32">|</view>
                        <view class="mr8 fc-orange">{{ totalDay(item.time) }}</view>
                        <view>天</view>
                    </view>
                    <view v-if="item.type === SpecialDayType['生日']" class="h-start-center mt5">
                        <view class="ml10 mr8 mtn4 f32">|</view>
                        <view class="mr8 fc-orange">{{ item.age }}</view>
                        <view>岁</view>
                        <view class="ml10 mr8 mtn4 f32">|</view>
                        <view class="mr8 fc-orange">{{ item.allDay }}</view>
                        <view>天</view>
                    </view>
                </view>

                <view v-if="item.remainDay" class="h-start-center fc-gray f28 mt10 w100">
                    <template v-if="item.remainDay < 0 && item.type === SpecialDayType['提醒日']">
                        <view class="h-between-center w100">
                            <view class="">距离{{ SpecialDayType[item.type] }}过去</view>
                            <view class="h-center">
                                <view class="f36 ml8 mr8 fc-red">{{ 0 - item.remainDay }}</view>
                                <view>天</view>
                            </view>
                        </view>
                    </template>
                    <template v-else>
                        <view class="h-between-center w100">
                            <view class="h-start-center">
                                <view class="">距离{{ SpecialDayType[item.type] }}</view>
                                <view class="ml8 mr8">{{ item.nextBirthDay }}</view>
                            </view>
                            <view class="h-start-center">
                                <view class="f36 ml8 mr8 fc-red">{{ item.remainDay }}</view>
                                <view>天</view>
                            </view>
                        </view>
                    </template>
                </view>
                <view v-else class="f32 w100 ellipsis mr2 fc-orange mt10"
                    >今天是{{ item.name + '的' + SpecialDayType[item.type] }}
                </view>
            </view>
        </view>
        <uni-load-more
            :style="'top:' + listData.length * 240 + 'rpx'"
            style="left: 50%; transform: translate(-50%, -50%)"
            class="p-a"
            :status="loadStatus"
        ></uni-load-more>
    </view>

    <uni-fab
        :pattern="{
            buttonColor: '#3494F8',
        }"
        ref="fab"
        horizontal="right"
        vertical="bottom"
        :pop-menu="false"
        @fabClick="fabClick"
    />

    <view v-if="showDragTip" class="self-mask">
        <uni-transition class="p-a mask-position" mode-class="slide-right" :duration="500" :show="showDragTip">
            <image src="/static/circle.svg" class="circle" mode="widthFix" />
            <image src="/static/arrow.svg" class="arrow" mode="widthFix" />
            <view class="alert">按住圈中的图标拖动，可以改变列表顺序哦</view>
        </uni-transition>
        <image @click="closeDragTip.func" src="/static/know.svg" class="know" mode="widthFix" />
    </view>
</template>
<script setup>
import { totalDay, getAge, setTime } from '@/utils/getAge'
import dayjs from 'dayjs'
import { SpecialDayType } from '@/utils/emnu'
import { orderBy } from 'lodash'
import { tipFactory, shareMessageCall, shareTimelineCall, isLogin, toLogin } from '@/utils/common'
import { store } from '@/uni_modules/uni-id-pages/common/store'

const db = uniCloud.database()
const category = ref(['全部', '最新', '生日', '纪念日', '提醒日'])
// const category = ref(['全部', '最新', '生日', '纪念日', '提醒日', '我的分享', '我的收藏'])

const collectionList = 'special-days'
const tabIndex = ref(0)
const listObj = ref({})

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)

const udb = ref()

const listData = computed(() => {
    let result = []
    const type = category.value[tabIndex.value]
    if (type) {
        result = listObj.value[type] || []
    }
    return result
})

let isMobile = false
//单行高度
const rowHeight = 200
//单行margin
const rowMargin = 40

// 记录所有控件的初始位置
const initPositionArr = ref([])

// 记录所有控件的当前位置
const currentPositionArr = ref([])

//拖动行初始index记录，拖动过程中currentDragIndex会不断更新值
const recordDragIndex = ref(-1)
//当前拖动行index
const currentDragIndex = ref(-1)
//手指当前位置，在touchmove中随时更新
const recordPosition = ref({ x: 0, y: 0 })

const showDragTip = ref(false)
const closeDragTip = ref({ func: () => {} })
const openDragTip = tipFactory('showDragTip', showDragTip, closeDragTip)
const loadStatus = ref('nomore')
onMounted(async () => {
    if (!isLogin()) {
        try {
            const res = await uniCloud.callFunction({
                name: 'special-day-default',
            })
            handleLoad(res.result, null, { current: 1 })
        } catch (e) {
            console.log(e)
        }
    } else {
        getList(true)
    }
    openDragTip()
})

onShow(() => {
    isDeleted()
})

onPullDownRefresh(async () => {
    await getList(true)
    uni.stopPullDownRefresh()
})

onReachBottom(() => {
    getList()
})

function isDeleted() {
    const deleteId = uni.getStorageSync('specialDayDeleteId')
    if (deleteId) {
        //删除所有类别中的该条数据
        Object.keys(listObj.value).forEach((key) => {
            let arr = listObj.value[key] || []
            arr = arr.filter((item) => {
                return item._id !== deleteId
            })
            listObj.value[key] = arr
        })

        const type = category.value[tabIndex.value]
        let list = listObj.value[type]
        /**
         *更新列表数量需选更新位置信息
         */
        initPosition(list.length)
        listObj.value[type] = list
        uni.removeStorage({ key: 'deleteId' })
    }
}

async function getList(init = false) {
    loadStatus.value = 'loading'
    const type = category.value[tabIndex.value]
    let start = listObj.value[type]?.length || 0
    if (init) {
        start = 0
    }

    let dayRes
    const collect = db.collection('special-days')
    switch (type) {
        case '全部':
            dayRes = await collect
                .where('"user_id" == $env.uid')
                .orderBy('sort asc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case '最新':
            dayRes = await collect
                .where('"user_id" == $env.uid')
                .orderBy('create_time desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case '生日':
        case '纪念日':
        case '提醒日':
            dayRes = await collect
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                    type: SpecialDayType[type],
                })
                .orderBy('sort asc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break

        case '我的收藏':
            dayRes = await collect
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                })
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
        default:
            dayRes = await collect
                .where({
                    category: type,
                })
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
    }

    let list = []
    if (listObj.value[type] && !init) {
        list = listObj.value[type]
    } else {
        listObj.value[type] = list
    }
    if (Array.isArray(dayRes.result?.data)) {
        list.push(...dayRes.result.data)
    }
    initPosition(list.length)
    listObj.value[type] = [...handleLoad(list)]
    if (dayRes.result.data.length < 20) {
        loadStatus.value = 'nomore'
    } else {
        loadStatus.value = 'more'
    }
}

function handleLoad(data) {
    data.forEach((item) => {
        const { time, lunar, leap, type } = item
        if (type === SpecialDayType['提醒日']) {
            item.remainDay = dayjs(time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'days')
            item.normalTime = dayjs(time).format('YYYY-MM-DD')
        } else {
            const { allDay, remainDay, aYear, cYear, cMonth, cDay, lYear, IMonthCn, IDayCn, nextBirthDay } = getAge(
                time,
                lunar,
                leap,
            )
            item.remainDay = remainDay
            item.age = aYear
            item.allDay = allDay
            item.nextBirthDay = nextBirthDay

            if (!lunar) {
                item.normalTime = `${cYear}-${cMonth}-${cDay}`
            } else {
                item.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
            }
        }
    })
    return data
}
function tabClick(item, index) {
    tabIndex.value = index
    const type = category.value[tabIndex.value]
    const list = listObj.value[type] || []
    if (!list.length) {
        getList()
    } else {
        initPosition(list.length)
    }
}
function handleItemClick(id) {
    if (!isLogin()) {
        return toLogin()
    }
    uni.navigateTo({
        url: './detail?id=' + id,
    })
}
function fabClick() {
    if (!isLogin()) {
        return toLogin()
    }
    uni.navigateTo({
        url: './add',
        events: {
            // 监听新增数据成功后, 刷新当前页面数据
            refreshData: () => {
                getList()
            },
        },
    })
}

/** 初始化各个控件的位置 */
function initPosition(len) {
    let tempArray = []
    for (let i = 0; i < len; i++) {
        tempArray[i] = {
            left: 0,
            top: i * (rowHeight + rowMargin),
        }
    }
    initPositionArr.value = JSON.parse(JSON.stringify(tempArray))
    currentPositionArr.value = JSON.parse(JSON.stringify(tempArray))
}

/** 处理手指触摸后移动 */
function handleTouchmove(event) {
    const { pageX, pageY } = event.touches[0]

    // 获取移动的差
    const curDragPosition = currentPositionArr.value[currentDragIndex.value]
    curDragPosition.top = curDragPosition.top + 2 * (pageY - recordPosition.value.y) // pageX为px计数，故需乘2转为rpx

    // 更新手指当前位置
    recordPosition.value = { x: pageX, y: pageY }
    const curTop = currentPositionArr.value[currentDragIndex.value].top
    const initTop = initPositionArr.value[currentDragIndex.value].top
    // 向下拖动
    if (currentDragIndex.value < listData.value.length - 1 && curTop > initTop + rowMargin + rowHeight / 2) {
        changePosition(currentDragIndex.value + 1)
    }
    // 向上拖动
    else if (currentDragIndex.value > 0 && curTop < initTop - rowMargin - (rowHeight / 3) * 2) {
        changePosition(currentDragIndex.value - 1)
    }
}

/**
 * 处理交换控件位置的方法 -
 * @param {number} index	需要与第几个下标交换位置
 * */
function changePosition(index) {
    // 判断是否在交换中
    if (isMobile) {
        return
    }
    isMobile = true

    // 记录当前操控的控件数据
    let tempControls = listData.value[currentDragIndex.value]
    // 交换位置
    listData.value[currentDragIndex.value] = listData.value[index]
    listData.value[index] = tempControls

    let top = initPositionArr.value[currentDragIndex.value].top
    // 调整控件位置数据
    currentPositionArr.value[index].top = currentPositionArr.value[currentDragIndex.value].top
    currentPositionArr.value[currentDragIndex.value].top = top

    // 改变当前选中的位置
    currentDragIndex.value = index

    // 交换结束
    isMobile = false
}

/** 处理手指触摸开始事件 */
function handleTouchstart(event, index) {
    const { pageX, pageY } = event.touches[0]
    // 记录一些数据
    currentDragIndex.value = index
    recordDragIndex.value = index
    recordPosition.value = { x: pageX, y: pageY }
}

/** 处理手指松开事件 */
async function handleTouchend(event) {
    // 将操控的控件归位
    const index = currentDragIndex.value
    currentPositionArr.value[index].top = initPositionArr.value[index].top

    if (recordDragIndex.value !== index && isLogin()) {
        const preSort = listData.value[index - 1]?.sort || index - 1
        const nextSort = listData.value[index + 1]?.sort || index + 1
        const newSort = (preSort + nextSort) / 2
        const _id = listData.value[index]._id
        uni.showLoading({ mask: true })
        try {
            const { result } = await db.collection('special-days').doc(_id).update({ sort: newSort })
            uni.hideLoading()
            if (result.updated) {
                uni.showToast({
                    title: '修改成功',
                    icon: 'success',
                })
            }
        } catch (e) {
            console.log(e)
            uni.hideLoading()
        }
    }
    currentDragIndex.value = -1
    recordDragIndex.value = -1
}
</script>

<style lang="scss">
.scroll-view-item {
    left: 0;
    width: 670rpx;
    margin: 0 40rpx 30rpx;
    height: 200rpx;
    mix-blend-mode: normal;
    background: #ffffff99;
}
.mask-position {
    left: 300rpx;
    top: 270rpx;
    width: 300rpx;
    height: 600rpx;
}
.circle {
    width: 150rpx;
    position: absolute;
    left: 300rpx;
    top: 0;
}
.arrow {
    width: 80rpx;
    position: absolute;
    left: 250rpx;
    top: 110rpx;
    transform: rotateY(180deg);
}
.alert {
    color: white;
    width: 300rpx;
    position: absolute;
    left: 110rpx;
    top: 250rpx;
}

.know {
    width: 200rpx;
    position: fixed;
    left: 275rpx;
    bottom: 200rpx;
}
.active {
    color: #007aff;
    border-bottom: 4rpx solid #007aff;
}
</style>
