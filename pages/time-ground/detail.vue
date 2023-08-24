<template>
    <view class="pl25 pr25 pt25 pb40">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            v-slot:default="{ data, loading, error, options }"
            :options="options"
            :collection="collectionList"
            :getone="true"
            :manual="true"
        >
            <view v-if="error">{{
                error.message.indexOf('timeout') ? '请检查网络后重试' : '连接错误，请退出重试'
            }}</view>
            <view v-else-if="loading">
                <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
            </view>
            <view v-else-if="data" class="list-details p-r">
                <uni-section v-if="data?.user_id[0]" class="br20" title="分享用户" type="line">
                    <template v-slot:right>
                        <view class="h-end-center">
                            <uni-file-picker
                                readonly
                                :del-icon="false"
                                disable-preview
                                :imageStyles="{
                                    width: '64rpx',
                                    height: '64rpx',
                                    border: {
                                        radius: '50%',
                                    },
                                }"
                                file-mediatype="image"
                                :modelValue="data?.user_id[0].avatar_file"
                            ></uni-file-picker>
                            <view class="ml5">{{ data?.user_id[0].nickname }}</view>
                        </view>
                    </template>
                </uni-section>

                <uni-section class="mb20 mtn10 br20" title="关注" type="line">
                    <template v-slot:right>
                        <view class="h-end-center">
                            <uni-icons type="star-filled" size="20" color="#ccc"></uni-icons>
                            <text class="fc-red f28 ml5">{{ data.favorite }}</text>
                        </view>
                    </template>
                </uni-section>

                <!--                <view class="detail-item h-start-center">-->
                <!--                    <text class="f32 fc-66 mr40">分享用户</text>-->
                <!--                    <text class="fc-black f-grow w0 ellipsis f32">{{ data.user_id[0].nickname }}</text>-->
                <!--                </view>-->
                <!--                <view class="detail-item h-start-center">-->
                <!--                    <text class="f32 fc-66 mr40">收藏量</text>-->
                <!--                    <text class="fc-black f-grow w0 ellipsis f32">{{ data.favorite }}</text>-->
                <!--                </view>-->

                <view class="pl20 pr20">
                    <view class="detail-item h-start-center">
                        <text class="f32 fc-66 mr40">名称</text>
                        <text class="fc-black f-grow w0 ellipsis f32">{{ data.name }}</text>
                    </view>
                    <view class="detail-item h-start-center">
                        <text class="f32 fc-66 mr40">日期</text>
                        <text class="fc-black f32">{{
                            SpecialDayType[data.type] === '节日' ? data.normalTime?.slice(5) : data.normalTime
                        }}</text>
                        <view class="h-start-center" v-if="data.type !== SpecialDayType['提醒日']">
                            <text class="fc-gray ml10 f32">(</text>
                            <text class="fc-gray f30 ml2">{{ data.nextBirthDay }}</text>
                            <text class="fc-gray f24 ml2 mr2">下</text>
                            <text class="fc-gray f32">)</text>
                        </view>
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
                        <text class="f32 fc-66 mr40">海报</text>
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
                <view class="h-between-center p-a w100 pb40" style="bottom: -180rpx">
                    <template v-if="isLogin()">
                        <button
                            v-if="role.includes('admin')"
                            class="f-grow ml20 mr20 bg-red"
                            type="warn"
                            @click="deleteDay(data)"
                            >删除</button
                        >
                        <button
                            v-else-if="
                                data?.user_id && data.user_id[0]?._id === store.userInfo._id && !role.includes('admin')
                            "
                            class="f-grow ml20 mr20 bg-red"
                            type="warn"
                            @click="deleteDay(data)"
                            >删除</button
                        >
                        <button
                            v-if="
                                data?.user_id &&
                                data.user_id[0]?._id !== store.userInfo._id &&
                                !store.otherUserInfo.favorite_ground_id?.includes(data?._id)
                            "
                            class="f-grow ml20 mr20 bg-blue"
                            type="primary"
                            @click="followed(data)"
                            >关注</button
                        >
                        <button
                            v-if="store.otherUserInfo.favorite_ground_id?.includes(data?._id)"
                            class="f-grow ml20 mr20 bg-red"
                            type="warn"
                            @click="unfollowed(data)"
                            >取消关注</button
                        >
                        <button type="primary" class="f-grow ml20 mr20 bg-blue" open-type="share"> 分享 </button>
                    </template>
                    <button v-else class="f-grow ml20 mr20 bg-blue" type="primary" @click="toLogin">关注</button>
                </view>
            </view>
        </unicloud-db>
    </view>
    <ad-video :show-loading="false" ref="adVideo" :action="() => addSpecialDay(data)" />
</template>

<script setup>
/**
 * 设计思路，收藏日期不可再次分享，防止用户恶意分享
 * 当用户删除分享日期时，找到源头日期，清除其中的ground_id，保证用户可以二次分享
 * */

import AdVideo from '@/components/ad-video.vue'
import { getAge, setTime } from '@/utils/getAge'
import { SpecialDayType } from '@/utils/emnu'
import dayjs from 'dayjs'
import { enumConverter } from '@/js_sdk/validator/special-days'
import { isLogin, toLogin, inviterAward, shareMessageCall, shareTimelineCall } from '@/utils/common'
import { mutations, store } from '@/uni_modules/uni-id-pages/common/store'
import { debounce, difference } from 'lodash'

const db = uniCloud.database()
const adVideo = ref()
const collectionList = ref([])
const loadMore = ref({
    contentdown: '',
    contentrefresh: '',
    contentnomore: '',
})
const options = ref({
    // 将scheme enum 属性静态数据中的value转成text
    ...enumConverter,
})

const role = computed(() => {
    let result = []
    try {
        result = store.userInfo.role || []
    } catch (e) {
        console.log(e)
    }
    return result
})

const udb = ref()
let timeGroundDetailId

onShareAppMessage(() => shareMessageCall({ timeGroundDetailId }))
onShareTimeline(() => shareTimelineCall({ timeGroundDetailId }))
onLoad((e) => {
    timeGroundDetailId = e.timeGroundDetailId
    collectionList.value = [
        db
            .collection('special-days-share')
            .where('_id=="' + timeGroundDetailId + '"')
            .field('name,time,type,lunar,leap,favorite,remark,avatar,poster,_id,ground_id,user_id,user_day_id')
            .getTemp(),
        db.collection('uni-id-users').field('nickname,avatar,avatar_file,_id').getTemp(),
    ]
})

async function deleteDay(data) {
    const modalRes = await uni.showModal({
        title: '提示',
        content: '将从时光广场移除该分享日期，请确认是否删除？',
    })
    if (modalRes.confirm) {
        try {
            await db.collection('special-days-share').doc(data._id).remove()
            uni.setStorageSync('shareStatus', 'del')
            uni.setStorageSync('shareDayDeleteId', data._id)
            if (store.userInfo._id === data.user_id[0]._id) {
                await db.collection('special-days').doc(data.user_day_id).update({ ground_id: null })
            }
        } catch (e) {
            console.log(e)
        }

        uni.navigateBack()
    }
}

const followed = debounce(async function (data) {
    if (!isLogin()) {
        return toLogin()
    }
    const { userType, nickname, avatar_file, _id } = store.userInfo
    const { user_id } = data
    if (user_id[0]._id === _id) {
        return uni.showToast({
            title: '无法关注自己分享的日期',
            icon: 'none',
        })
    }

    //如果是vip用户，直接创建，不消耗时光币
    if (userType === 1 || userType === 2) {
        addSpecialDay(data)
    } else {
        adVideo.value.beforeOpenAd({
            useScore: 1,
            comment: `关注${nickname || 'momo'}分享的${SpecialDayType[data.type]}:${data.name}`,
        })
    }
})

const unfollowed = debounce(async function (data) {
    const { _id } = data
    uni.showLoading({
        mask: true,
    })
    try {
        const arr = store.otherUserInfo.favorite_ground_id || []
        arr.push(_id)
        const res = await mutations.setOtherUserInfo({
            favorite_ground_id: difference(arr, [_id]),
        })
        if (res) {
            uni.setStorageSync('specialStatus', 'del')
            uni.setStorageSync('shareStatus', 'unfollow')
            // 删除数据成功后跳转到list页面
            uni.setStorageSync('specialDayDeleteId', _id)
            uni.setStorageSync('shareUnfollowId', _id)
        }
    } catch (e) {
        console.log(e)
    }
    uni.hideLoading()
})

async function addSpecialDay(data) {
    const { _id, favorite, user_id, name, type } = data
    // 使用 clientDB 提交数据
    uni.showLoading({
        mask: true,
    })
    try {
        const arr = store.otherUserInfo.favorite_ground_id || []
        arr.push(_id)
        const res = await mutations.setOtherUserInfo({
            favorite_ground_id: arr,
        })

        if (res) {
            uni.showToast({
                icon: 'none',
                title: `关注成功`,
            })
            udb.value.update(
                _id,
                { favorite: favorite + 1 },
                { needLoading: false, showToast: false, needConfirm: false },
            )
            //发放奖励给分享用户
            inviterAward(
                user_id[0]._id,
                1,
                `${store.userInfo.nickname || 'momo'}关注了你分享的${SpecialDayType[type]}:${name}`,
            )
        } else {
            uni.showToast({
                icon: 'none',
                title: '关注失败，请稍后重试',
            })
        }
        uni.setStorageSync('specialStatus', 'add')
        uni.setStorageSync('shareStatus', 'add')
    } catch (e) {
        console.log(e)
    }
    uni.hideLoading()
}

function handleLoad(data) {
    const { time, lunar, leap, type } = data
    if (type === SpecialDayType['提醒日']) {
        data.normalTime = dayjs(time).format('YYYY-MM-DD')
    } else {
        const { cYear, cMonth, cDay, lYear, IMonthCn, IDayCn, nextBirthDay, Animal, astro } = getAge(time, lunar, leap)
        data.Animal = Animal
        data.astro = astro
        data.nextBirthDay = nextBirthDay
        if (!lunar) {
            data.normalTime = dayjs(time).format('YYYY-MM-DD')
        } else {
            data.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
            data.solarDate = `${cYear}-${cMonth}-${cDay}`
        }
    }
}
</script>

<style lang="scss">
page {
    background: $primary-bg;
}

.warning-color {
    color: #ffcc33;
}
</style>
