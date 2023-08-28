<template>
    <scroll-view class="z2 nowrap w100 p-s top-0 bg-primary pl20 pr20" :scroll-x="true">
        <view
            class="t-center pt30 pb20"
            style="display: inline-block; width: 150rpx; border-bottom: 4rpx solid #fff"
            v-for="(item, index) in category"
            :key="item"
            @click="tabClick(item, index)"
            :class="{ active: tabIndex === index }"
        >
            {{ item }}
        </view>
    </scroll-view>
    <view class="h-end-center mt20">
        <text class="f30 fc-gray mr10">按距离日期排序</text>
        <switch color="#3494f8" style="transform: scale(0.7)" :checked="dateSort" @change="dateSortChange"></switch>
    </view>
    <view class="p20">
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
        <view v-if="shareList.length" class="h-start-center br20 p20 bg-white f-wrap">
            <template v-for="item in shareList" :key="item.id">
                <list-item class="w33" :model-value="item" />
            </template>
        </view>
        <uni-load-more :status="loadStatus"></uni-load-more>
    </view>
</template>

<script setup>
import { SpecialDayType } from '@/utils/emnu'
import { shareMessageCall, shareTimelineCall } from '@/utils/common'
import ListItem from '@/pages/time-ground/list-item'
import { store } from '@/uni_modules/uni-id-pages/common/store'
import { getDateDetails } from '@/utils/getAge'
import { orderBy } from 'lodash'

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
const dateSort = ref(true) //首次进入默认分类为分部，默认按距离最近日期分类，切换到其他类别时则不再默认分类
let initDateSort = true //用于判断是否是首次切换日期分类，若是，则将dateSort置为false

const shareList = computed(() => {
    let result = []
    const type = category.value[tabIndex.value]
    if (type) {
        result = listObj.value[type] || []
    }
    result = [...result]
    if (dateSort.value) {
        result = orderBy(result, ['overTime', 'remainDay'])
    }
    return result
})

onShow(() => {
    const shareStatus = uni.getStorageSync('shareStatus')
    uni.removeStorage({ key: 'shareStatus' })
    if (shareStatus === 'del') {
        isDeleted() //如何有删除id则
    } else if (shareStatus === 'add') {
        console.log(store.otherUserInfo.favorite_ground_id)
        getList(true)
    } else if (shareStatus === 'unfollow') {
        const deleteId = uni.getStorageSync('shareUnfollowId')
        uni.removeStorage({ key: 'shareUnfollowId' })
        let arr = listObj.value['关注'] || []
        arr = arr.filter((item) => {
            return item._id !== deleteId
        })
        listObj.value['关注'] = arr
    }
})

onPullDownRefresh(async () => {
    await getList(true)
    uni.stopPullDownRefresh()
})

onReachBottom(() => {
    getList()
})

onLoad((e) => {
    if (e.tabIndex) {
        tabIndex.value = +e.tabIndex
    }
    init()
})

function dateSortChange(e) {
    console.log(e)
    dateSort.value = !dateSort.value
}

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

async function init() {
    const { result } = await uniCloud.callFunction({
        name: 'time-ground-category',
    })
    category.value = ['全部', '热门', '关注', '分享', ...result, '生日', '纪念日', '提醒日']
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
        case '全部':
            dayRes = await collect
                .orderBy('create_date desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case '关注':
            // .where(`_id in ${store.otherUserInfo.favorite_ground_id || []}`)
            dayRes = await collect
                .where({
                    _id: db.command.in(store.otherUserInfo.favorite_ground_id || []),
                })
                .orderBy('update_date desc')
                .skip(start) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
        case '分享':
            dayRes = await collect
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                })
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
        list = [...listObj.value[type]]
    }
    let tempArr = dayRes.result?.data
    if (Array.isArray(tempArr)) {
        tempArr = tempArr.map((item) => getDateDetails(item))
        list.push(...tempArr)
    }
    listObj.value[type] = [...list]
    if (dayRes.result.data.length < 20) {
        loadStatus.value = 'nomore'
    } else {
        loadStatus.value = 'more'
    }
}

function tabClick(item, index) {
    if (initDateSort) {
        dateSort.value = false
        initDateSort = false
    }
    tabIndex.value = index
    const type = category.value[tabIndex.value]
    if (!listObj.value[type]) {
        getList()
    }
}
</script>

<style lang="scss">
page {
    background: $primary-bg;
}
.active {
    color: #007aff;
    border-bottom: 4rpx solid #007aff !important;
}
</style>
