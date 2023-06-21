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
    <view class="p25">
        <!--        <uni-easyinput-->
        <!--            suffixIcon="search"-->
        <!--            v-model="searchValue"-->
        <!--            placeholder="输入日期名称搜索"-->
        <!--            confirmType="search"-->
        <!--            clearable-->
        <!--            :trim="true"-->
        <!--            @clear="getList"-->
        <!--            @change="getList"-->
        <!--            @confirm="getList"-->
        <!--            @iconClick="getList"-->
        <!--        >-->
        <!--        </uni-easyinput>-->
        <view v-if="shareList.length" class="h-start-center br20 p20 bg-white f-wrap mt20">
            <view class="v-center mb20 p-r" v-for="(item, index) in shareList" :key="item.id" style="width: 33.33%">
                <view @click="handleItemClick(item._id)" class="w100 h100 p-a z1 top-0 left-0 op0"></view>
                <view class="v-center">
                    <view style="width: 180rpx; letter-spacing: -2rpx" class="f30 t-center ellipsis mb10">
                        {{ item.name }}
                    </view>
                    <uni-file-picker
                        class="h-center"
                        readonly
                        disable-preview
                        :modelValue="item.poster[0]"
                        :imageStyles="{
                            width: '225rpx',
                            height: '360rpx',
                            border: {
                                radius: '20rpx',
                            },
                        }"
                        file-mediatype="image"
                    >
                    </uni-file-picker>

                    <view class="h-center w100 mt5">
                        <image
                            v-if="SpecialDayType[item.type] === '提醒日'"
                            src="/static/alert.svg"
                            style="width: 40rpx; height: 40rpx"
                        ></image>
                        <image
                            v-if="SpecialDayType[item.type] === '生日'"
                            src="/static/birthday.svg"
                            style="width: 40rpx; height: 40rpx"
                        ></image>
                        <image
                            v-if="SpecialDayType[item.type] === '纪念日'"
                            src="/static/commemorate.svg"
                            style="width: 40rpx; height: 40rpx"
                        ></image>

                        <uni-dateformat class="f28 ml5 fc-gray" format="yyyy-MM-dd" :date="item.time"></uni-dateformat>
                    </view>
                    <view class="w100 h-end-center">
                        <uni-icons type="star-filled" size="20" color="#ccc"></uni-icons>
                        <text class="fc-red f24">{{ item.favorite }}</text>
                    </view>
                </view>
            </view>
        </view>
        <uni-load-more :status="loadStatus"></uni-load-more>
    </view>
</template>

<script setup>
import { SpecialDayType } from '@/utils/emnu'
import UniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons'
import { isLogin, shareMessageCall, shareTimelineCall, toLogin } from '@/utils/common'

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)

const db = uniCloud.database()
const data = reactive({
    searchValue: '',
})
const { searchValue } = toRefs(data)

const category = ref([])
const tabIndex = ref(0)
const listObj = ref({})
const loadStatus = ref('loading')

const shareList = computed(() => {
    console.log('update')
    let result = []
    const type = category.value[tabIndex.value]
    if (type) {
        result = listObj.value[type] || []
    }
    return result
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

init()

function isDeleted() {
    const deleteId = uni.getStorageSync('shareDayDeleteId')
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
        listObj.value[type] = [...list]
        uni.removeStorage({ key: 'specialDayDeleteId' })
    }
}

function handleItemClick(id) {
    const type = category.value[tabIndex.value]
    uni.navigateTo({
        url: `./detail?id=${id}&type=${type}`,
    })
}

async function init() {
    const { result } = await uniCloud.callFunction({
        name: 'time-ground-category',
    })

    category.value = ['热门', '最新', ...result, '生日', '纪念日', '提醒日', '我的分享']
    getList(true)
}

async function getList(init = false) {
    loadStatus.value = 'loading'
    const type = category.value[tabIndex.value]
    let start = listObj.value[type]?.length || 0
    if (init) {
        start = 0
    }

    let dayRes
    const collect = db.collection('special-days-share')
    switch (type) {
        case '热门':
            dayRes = await collect
                .orderBy('favorite desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case '最新':
            dayRes = await collect
                .orderBy('create_date desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case '生日':
        case '纪念日':
        case '提醒日':
            dayRes = await collect
                .where({
                    type: SpecialDayType[type],
                })
                .orderBy('favorite desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break

        case '我的分享':
            dayRes = await collect
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                })
                .orderBy('create_date desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
        default:
            dayRes = await collect
                .where({
                    category: type,
                })
                .orderBy('favorite desc')
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
    listObj.value[type] = [...list]
    if (dayRes.result.data.length < 20) {
        loadStatus.value = 'nomore'
    } else {
        loadStatus.value = 'more'
    }
}

function sectionClick(index) {
    console.log(index)
}

function tabClick(item, index) {
    tabIndex.value = index
    const type = category.value[tabIndex.value]
    if (!listObj.value[type]) {
        getList()
    }
}
</script>

<style lang="scss" scoped>
.active {
    color: #007aff;
    border-bottom: 4rpx solid #007aff;
}
</style>
