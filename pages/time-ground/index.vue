<template>
    <view class="p25">
        <uni-easyinput
            prefixIcon="search"
            v-model="searchValue"
            placeholder="输入日期名称搜索"
            confirmType="search"
            :trim="true"
            @confirm="searchClick"
            @iconClick="searchClick"
        >
        </uni-easyinput>

        <view class="br20 p20 bg-white mt20">
            <scroll-view class="nowrap w100" :scroll-x="true">
                <view
                    class="t-center pt20 pb20"
                    style="display: inline-block; width: 150rpx"
                    v-for="(item, index) in category"
                    :key="item"
                    @click="tabClick(item, index)"
                    :class="{ active: tabIndex === index }"
                >
                    {{ item }}
                </view>
            </scroll-view>
            <view class="h-start-center f-wrap mt20">
                <view class="v-center" v-for="(item, index) in shareList" :key="item.id" style="width: 33.33%">
                    <view class="v-center">
                        <view style="width: 180rpx; letter-spacing: -2rpx" class="f30 t-center ellipsis mb10">
                            {{ item.name }}
                        </view>
                        <uni-file-picker
                            class="h-center"
                            readonly
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

                            <uni-dateformat
                                class="f28 ml5 fc-gray"
                                format="yyyy-MM-dd"
                                :date="item.time"
                            ></uni-dateformat>
                        </view>
                        <view class="w100 h-end-center">
                            <uni-icons type="star-filled" size="20" color="#ccc"></uni-icons>
                            <text class="fc-red f24">{{ item.favorite }}</text>
                        </view>
                    </view>
                </view>
            </view>
            <uni-load-more status="nomore"></uni-load-more>
        </view>
    </view>
</template>

<script setup>
import { SpecialDayType } from '@/utils/emnu'
import UniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons'

const db = uniCloud.database()
const data = reactive({
    searchValue: '',
})
const { searchValue } = toRefs(data)

const category = ref([])
const tabIndex = ref(0)
const listObj = ref({})

const shareList = computed(() => {
    let result = []
    const type = category.value[tabIndex.value]
    if (type) {
        result = listObj.value[type] || []
    }
    return result
})

init()

async function init() {
    const { result } = await uniCloud.callFunction({
        name: 'time-ground-category',
    })

    category.value = ['热门', '最新', '生日', '纪念日', '提醒日', ...result, '我的']
    getList()
}

async function getList() {
    const type = category.value[tabIndex.value]

    let list = []
    if (listObj.value[type]) {
        list = listObj.value[type]
    } else {
        listObj.value[type] = list
    }
    let dayRes
    const collect = db.collection('special-days-share')
    switch (type) {
        case '热门':
            dayRes = await collect
                .orderBy('favorite desc')
                .skip(list.length) // 跳过前20条
                .limit(20) // 获取20条
                .get()

            break
        case '最新':
            dayRes = await collect
                .orderBy('create_date desc')
                .skip(list.length) // 跳过前20条
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
                .skip(list.length) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break

        case '我的':
            dayRes = await collect
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                })
                .orderBy('create_date desc')
                .skip(list.length) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
        default:
            dayRes = await collect
                .where({
                    category: type,
                })
                .orderBy('favorite desc')
                .skip(list.length) // 跳过前20条
                .limit(20) // 获取20条
                .get()
            break
    }
    if (Array.isArray(dayRes.result?.data)) {
        list.push(...dayRes.result.data)
    }
    listObj.value[type] = [...list]
}

function searchClick() {
    console.log(searchValue.value)
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
