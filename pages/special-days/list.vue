<template>
    <view class="">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            loadtime="manual"
            v-slot:default="{ data, pagination, loading, hasMore, error }"
            :collection="collectionList"
            where="user_id==$cloudEnv_uid"
            field="name,time,type,lunar,sort,update_date,create_date"
        >
            <view class="fc-black" v-if="error">{{ error.message }}</view>
            <view v-if="currentPositionArr.length > 0" class="mt20 p-r">
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
                                <view v-if="item.age" class="mr8 fc-orange">{{ item.age }}</view>
                                <view v-else class="mr8 fc-orange">{{ item.allDay }}</view>
                                <view>{{ item.age ? '岁' : '天' }}</view>
                            </view>
                        </view>

                        <view v-if="item.remainDay" class="h-start-center fc-gray f28 mt10 w100">
                            <template v-if="item.remainDay < 0 && item.type === SpecialDayType['提醒日']">
                                <view class="h-between-center w100">
                                    <view class="">距离{{ item.name }}已经过了</view>
                                    <view class="h-center">
                                        <view class="f36 ml8 mr8 fc-red">{{ 0 - item.remainDay }}</view>
                                        <view>天</view>
                                    </view>
                                </view>
                            </template>
                            <template v-else>
                                <view class="h-between-center w100">
                                    <view class="h-start-center">
                                        <view class="">下一次{{ SpecialDayType[item.type] }}</view>
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
                    :status="loading ? 'loading' : hasMore ? 'more' : 'noMore'"
                ></uni-load-more>
            </view>
        </unicloud-db>
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
    </view>
</template>
<script setup>
import { totalDay, getAge } from '@/utils/getAge'
import dayjs from 'dayjs'
import { SpecialDayType } from '@/utils/emnu'
import { orderBy } from 'lodash'
import { tipFactory, shareMessageCall, shareTimelineCall } from '@/utils/common'
import { store } from '@/uni_modules/uni-id-pages/common/store'

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)

const udb = ref()

let isMobile = false
//单行高度
const rowHeight = 200
//单行margin
const rowMargin = 40

//记录列表数据
const listData = ref([])

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

onMounted(async () => {
    openDragTip()
    if (uni.$startScene === 1154) {
        const data = [
            {
                type: 1,
                lunar: 0,
                name: '祖国母亲',
                time: -639100800000,
            },
            {
                type: 0,
                lunar: 0,
                name: '改革开放',
                time: 281923200000,
            },
            {
                type: 2,
                lunar: 0,
                name: '坐着高铁去台湾',
                time: 2082672000000,
            },
        ]
        handleLoad(data)
    }
})

const closeDragTip = ref({ func: () => {} })
const openDragTip = tipFactory('showDragTip', showDragTip, closeDragTip)

/** 初始化各个控件的位置 */
function initPosition() {
    let tempArray = []
    for (let i = 0; i < listData.value.length + 1; i++) {
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

    if (recordDragIndex.value !== index && uni.$startScene !== 1154) {
        const promiseArr = []
        for (let i = 0; i < listData.value.length; i++) {
            const { _id } = listData.value[i]
            let p = new Promise(async (resolve, reject) => {
                try {
                    await udb.value.update(_id, { sort: i }, { showToast: false, needLoading: false })
                    resolve()
                } catch (e) {
                    console.log(e)
                    reject()
                }
            })
            promiseArr.push(p)
        }
        uni.showLoading({ mask: true })
        try {
            await Promise.all(promiseArr)
            uni.hideLoading()
            uni.showToast({
                title: '修改成功',
                icon: 'success',
            })
        } catch (e) {
            console.log(e)
            uni.hideLoading()
        }
    }
    currentDragIndex.value = -1
    recordDragIndex.value = -1
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
            if (item.age === 0) {
                item.allDay = allDay
            }
            item.nextBirthDay = nextBirthDay

            if (!lunar) {
                item.normalTime = `${cYear}-${cMonth}-${cDay}`
            } else {
                item.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
            }
        }
    })
    listData.value = orderBy(data, ['sort', 'create_time'])
    initPosition()
}
</script>

<script>
import { store } from '@/uni_modules/uni-id-pages/common/store'

const db = uniCloud.database()
export default {
    data() {
        return {
            collectionList: 'special-days',
            loadMore: {
                contentdown: '',
                contentrefresh: '',
                contentnomore: '',
            },
        }
    },
    onPullDownRefresh() {
        this.$refs.udb.loadData(
            {
                clear: true,
            },
            () => {
                uni.stopPullDownRefresh()
            },
        )
    },
    onShow() {
        if (uni.$startScene !== 1154) {
            this.$refs.udb.loadData(
                {
                    clear: true,
                },
                () => {
                    uni.stopPullDownRefresh()
                },
            )
        }
    },
    onReachBottom() {
        this.$refs.udb.loadMore()
    },
    methods: {
        handleItemClick(id) {
            uni.navigateTo({
                url: './detail?id=' + id,
            })
        },
        fabClick() {
            // 打开新增页面
            uni.navigateTo({
                url: './add',
                events: {
                    // 监听新增数据成功后, 刷新当前页面数据
                    refreshData: () => {
                        this.$refs.udb.loadData({
                            clear: true,
                        })
                    },
                },
            })
        },
    },
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
</style>
