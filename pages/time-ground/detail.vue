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
            <view v-else-if="data" class="list-details">
                <uni-section class="br20" title="分享用户" type="line">
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
                                :modelValue="data.user_id[0].avatar_file"
                            ></uni-file-picker>
                            <view class="ml5">{{ data.user_id[0].nickname }}</view>
                        </view>
                    </template>
                </uni-section>

                <uni-section class="mb20 mtn10 br20" title="收藏量" type="line">
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
                    <view class="detail-item">
                        <text class="f32 fc-66 mr40">日期</text>
                        <text class="fc-black f32">{{ data.normalTime }}</text>
                    </view>
                    <view class="detail-item">
                        <text class="f32 fc-66 mr40">类型</text>
                        <text class="fc-black f32">{{ options.type_valuetotext[data.type] }}</text>
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
                        <text class="f32 fc-66 mr40">相册</text>
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
            </view>
            <view class="h-between-center mt20">
                <view v-if="type === '我的分享'" class="f-grow del-btn f36 white h-center" @click="deleteDay(data)"
                    >删除</view
                >
                <view v-else class="f-grow edit-btn f36 white h-center" @click="useDay(data)">收藏</view>
            </view>
            <ad-video :show-loading="false" ref="adVideo" :action="() => addSpecialDay(data)" />
        </unicloud-db>
    </view>
</template>

<script setup>
import AdVideo from '@/components/ad-video.vue'
import { setTime } from '@/utils/getAge'
import { SpecialDayType } from '@/utils/emnu'
import dayjs from 'dayjs'
import { enumConverter } from '@/js_sdk/validator/special-days'
import { isLogin, toLogin, inviterAward } from '@/utils/common'
import { store } from '@/uni_modules/uni-id-pages/common/store'
import { debounce } from 'lodash'

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

const type = ref()

const udb = ref()

let groundUpadateId = null

onLoad((e) => {
    let detailId = e.id
    type.value = e.type
    collectionList.value = [
        db
            .collection('special-days-share')
            .where('_id=="' + detailId + '"')
            .field('name,time,type,lunar,leap,favorite,remark,avatar,poster,_id,ground_id,user_id')
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
        db.collection('special-days-share').doc(data._id).remove()
        uni.setStorageSync('shareDayDeleteId', data._id)
        uni.navigateBack()
    }
}

const useDay = debounce(async function (data) {
    if (!isLogin()) {
        return toLogin()
    }
    const { userType, nickname, avatar_file, _id } = store.userInfo
    const { user_id } = data
    if (user_id[0]._id === _id) {
        return uni.showToast({
            title: '无法收藏自己分享的日期',
            icon: 'none',
        })
    }

    const groundRes = await db
        .collection('special-days')
        .where({
            user_id: db.getCloudEnv('$cloudEnv_uid'),
            ground_id: data._id,
        })
        .get()
    if (groundRes.result.data.length > 0) {
        const modalRes = await uni.showModal({
            title: '提示',
            content: '你已收藏该日期，需要更新该日期吗？',
            icon: 'error',
        })
        if (!modalRes.confirm) {
            return
        }
        groundUpadateId = groundRes.result.data[0]._id
    } else {
        groundUpadateId = null
    }

    //如果是vip用户，直接创建，不消耗时光币
    if (userType === 1 || userType === 2) {
        addSpecialDay(data)
    } else {
        adVideo.value.beforeOpenAd({
            useScore: 1,
            comment: `收藏${nickname || 'momo'}分享的${SpecialDayType[data.type]}:${data.name}`,
        })
    }
})

async function addSpecialDay(data) {
    console.log(data)
    const { name, time, type, lunar, leap, remark, avatar, poster, _id, user_id, favorite } = data

    const params = {
        name,
        time,
        type,
        lunar,
        remark,
        leap,
        avatar,
        poster,
        ground_id: _id,
    }

    // 使用 clientDB 提交数据
    uni.showLoading({
        mask: true,
    })
    try {
        if (groundUpadateId) {
            const res = await db.collection('special-days').doc(groundUpadateId).update(params)
            //如果更新成功
            uni.hideLoading()

            if (res.result.updated) {
                uni.showToast({
                    icon: 'none',
                    title: `更新成功`,
                })
            }
        } else {
            const res = await db.collection('special-days').add(params)
            console.log(res)
            const { result } = res
            uni.hideLoading()

            if (result.errCode === 0) {
                uni.showToast({
                    icon: 'none',
                    title: `收藏成功`,
                })
                //发放奖励给分享用户
                inviterAward(
                    user_id[0]._id,
                    1,
                    `${store.userInfo.nickname || 'momo'}收藏了你分享的${SpecialDayType[type]}:${name}`,
                )
                //更新收藏量
                db.collection('special-days-share')
                    .doc(_id)
                    .update({
                        favorite: favorite + 1,
                    })
            } else {
                uni.showToast({
                    icon: 'none',
                    title: result.message,
                })
            }
        }
    } catch (e) {
        uni.hideLoading()
        console.log(e)
    }
}

function handleLoad(data) {
    const { time, lunar, leap, name, type } = data
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
