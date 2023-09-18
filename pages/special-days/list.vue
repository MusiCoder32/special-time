<template>
    <scroll-view class="z2 nowrap w100 p-s top-0 bg-primary pl20 pr20" :scroll-x="true">
        <template v-for="(value, key) in SpecialCategory" :key="key">
            <view
                v-if="isNaN(+key)"
                class="t-center pt30 pb20"
                style="display: inline-block; width: 150rpx; border-bottom: 4rpx solid #fff"
                @click="tabClick(value)"
                :class="{ active: tabValue === value }"
            >
                {{ key }}
            </view>
        </template>
    </scroll-view>
    <view class="h-end-center mb20 mt20">
        <text class="f30 fc-gray mr10">按距离日期排序</text>
        <switch color="#3494f8" style="transform: scale(0.7)" :checked="dateSort" @change="dateSortChange"></switch>
    </view>
    <view v-if="currentPositionArr?.length === listData?.length" class="mt20 p-r bg-white">
        <view v-for="(item, index) in listData" :key="index" @click="handleItemClick(item)">
            <view
                class="scroll-view-item shadow v-start-start p25 p-a"
                :style="{
                    transition: currentDragIndex === index ? 'initial' : '.1s',
                    'z-index': currentDragIndex === index ? 1 : 0,
                    top: currentPositionArr[index].top + 'rpx',
                }"
            >
                <view
                    v-if="
                        [
                            SpecialCategory['全部'],
                            SpecialCategory['提醒日'],
                            SpecialCategory['纪念日'],
                            SpecialCategory['生日'],
                        ].includes(tabValue)
                    "
                    style="right: 0; top: 0; width: 60rpx; height: 100rpx"
                    class="h-center p-a"
                    @touchstart.stop="handleTouchstart($event, index)"
                    @touchmove.stop="handleTouchmove"
                    @touchend.stop="handleTouchend"
                >
                    <image src="/static/more.svg" style="width: 6rpx; height: 30rpx"></image>
                </view>
                <list-item class="w100" :modelValue="item" />
            </view>
        </view>
        <uni-load-more
            :style="'top:' + ((listObj[tabValue]?.length || 0) * 240 + 20) + 'rpx'"
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
import { SpecialDayType, SpecialCategory } from '@/utils/emnu'
import { shareMessageCall, shareTimelineCall, tipFactory } from '@/utils/common'
import ListItem from '@/pages/special-days/list-item'
import { isNaN, orderBy, cloneDeep } from 'lodash'
import { store } from '@/uni_modules/uni-id-pages/common/store'
import { getDateDetails } from '@/utils/getAge'

const db = uniCloud.database()

const tabValue = ref(SpecialCategory['全部'])
const listObj = ref({})
const udb = ref()

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
const dateSort = ref(false)

const listData = computed(() => {
    let result = listObj.value[tabValue.value] || []
    result = [...result]
    if (dateSort.value) {
        result = orderBy(result, ['overTime', 'remainDay'])
    }
    return result
})

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)

onLoad(async (e) => {
    if (e.tabValue) {
        tabValue.value = +e.tabValue
    }
    openDragTip()
    getList(true)
})

onShow(() => {
    const specialStatus = uni.getStorageSync('specialStatus')
    uni.removeStorage({ key: 'specialStatus' })
    if (specialStatus === 'del') {
        isDeleted() //如何有删除id则
    } else if (specialStatus === 'add' || specialStatus === 'updateList' || specialStatus === 'update') {
        getList(true)
    }
})

onPullDownRefresh(async () => {
    await getList(true)
    uni.stopPullDownRefresh()
})

onReachBottom(() => {
    getList()
})

function dateSortChange() {
    dateSort.value = !dateSort.value
}

function isDeleted() {
    const deleteId = uni.getStorageSync('specialDayDeleteId')
    if (deleteId) {
        //删除所有类别中的该条数据
        let currentListDelIndex = 0
        Object.keys(listObj.value).forEach((key) => {
            let arr = listObj.value[key] || []
            if (key === tabValue.value) {
                arr = arr.filter((item, index) => {
                    if (item._id == deleteId) {
                        currentListDelIndex = index
                    }
                    return item._id !== deleteId
                })
            } else {
                arr = arr.filter((item) => {
                    return item._id !== deleteId
                })
            }

            listObj.value[key] = arr
        })

        let list = listObj.value[tabValue.value]
        /**
         *更新列表数量需选更新位置信息
         */
        currentPositionArr.value.pop()
        listObj.value[tabValue.value] = [...list]
        uni.removeStorage({ key: 'specialDayDeleteId' })
    }
}

async function getList(init = false) {
    loadStatus.value = 'loading'
    const type = tabValue.value
    let start = listObj.value[type]?.length || 0
    if (init) {
        start = 0
    }

    let dayRes
    let result

    const collect = db.collection('special-days')

    switch (type) {
        case SpecialCategory['全部']:
            dayRes = await collect
                .where('"user_id" == $env.uid')
                .orderBy('sort asc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case SpecialCategory['最新']:
            dayRes = await collect
                .where('"user_id" == $env.uid')
                .orderBy('create_date desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case SpecialCategory['生日']:
        case SpecialCategory['纪念日']:
        case SpecialCategory['提醒日']:
        case SpecialCategory['节日']:
            dayRes = await collect
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                    type: SpecialDayType[SpecialCategory[type]],
                })
                .orderBy('sort asc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break

        case SpecialCategory['分享']:
            dayRes = await db
                .collection('special-days-share')
                .where(`user_id==$cloudEnv_uid`)
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
        case SpecialCategory['关注']:
            dayRes = await db
                .collection('special-days-share')
                .where({
                    _id: db.command.in(store.otherUserInfo.favorite_ground_id || []),
                })
                .orderBy('update_date desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
        default:
            console.log('没找到类型，请核对分类名称')
            break
    }
    result = dayRes?.result?.data || []

    if (result.length > 0) {
        const tempArr = result.map((item) => {
            return getDateDetails(item)
        })
        let list = listObj.value[type]
        if (!list || init) {
            list = []
            currentPositionArr.value = []
            initPositionArr.value = []
        }
        initPosition(list.length, list.length + tempArr.length)
        list.push(...tempArr)
        listObj.value[type] = [...list]
    }
    if (result.length < 20) {
        loadStatus.value = 'nomore'
    } else {
        loadStatus.value = 'more'
    }
}

function tabClick(value) {
    if (value !== tabValue.value) {
        tabValue.value = value
        const list = listObj.value[tabValue.value] || []
        currentPositionArr.value = []
        if (!list.length) {
            getList()
        } else {
            initPosition(0, list.length)
        }
    }
}
function handleItemClick(date) {
    const { _id: id, user_day_id } = date
    if (tabValue.value === SpecialCategory['关注']) {
        uni.navigateTo({
            url: '/pages/time-ground/detail?specialDayId=' + id,
        })
    } else if (tabValue.value === SpecialCategory['分享']) {
        uni.navigateTo({
            url: './detail?specialDayId=' + user_day_id,
        })
    } else {
        uni.navigateTo({
            url: './detail?specialDayId=' + id,
        })
    }
}
function fabClick() {
    uni.navigateTo({
        url: './add',
    })
}

/** 初始化各个控件的位置 */
function initPosition(start, len) {
    for (let i = start; i < len; i++) {
        currentPositionArr.value[i] = {
            left: 0,
            top: i * (rowHeight + rowMargin),
        }
    }
    initPositionArr.value = cloneDeep(currentPositionArr.value)
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

    if (recordDragIndex.value !== index) {
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
page {
    background: $primary-bg;
}
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
    border-bottom: 4rpx solid #007aff !important;
}
</style>
