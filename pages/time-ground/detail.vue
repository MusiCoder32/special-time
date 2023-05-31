<template>
    <view class="p25">
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
                        <view>{{ data.favorite }}</view>
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
        </unicloud-db>
        <view class="h-between-center mt40">
            <view class="f-grow edit-btn f36 white h-center" @click="useDay(data)">收藏</view>
        </view>
    </view>
</template>

<script setup>
import { setTime } from '@/utils/getAge'
import { SpecialDayType } from '@/utils/emnu'
import dayjs from 'dayjs'
import { enumConverter } from '@/js_sdk/validator/special-days'

const db = uniCloud.database()

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

const udb = ref()

onLoad((e) => {
    let detailId = e.id
    collectionList.value = [
        db
            .collection('special-days-share')
            .where('_id=="' + detailId + '"')
            .field('name,time,type,lunar,leap,favorite,remark,avatar,poster,_id,ground_id,user_id')
            .getTemp(),
        db.collection('uni-id-users').field('nickname,avatar,avatar_file,_id').getTemp(),
    ]
})

function useDay(data) {
    console.log(data)
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
