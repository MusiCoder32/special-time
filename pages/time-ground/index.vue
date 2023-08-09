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
    let result = []
    const type = category.value[tabIndex.value]
    if (type) {
        result = listObj.value[type] || []
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

onMounted(() => {
    init()
})

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
    category.value = ['热门', '最新', '关注', '分享', ...result, '生日', '纪念日', '提醒日']
    getList(true)
}

async function getList(init = false) {
    console.log('getlist')
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
