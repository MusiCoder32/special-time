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
    </view>
    <view class="pl25 pr25 h-between-center">
        <text class="f32">最热推荐</text>
        <uni-icons type="right" class="f30" />
    </view>
    <view class="pl25 pr25 h-between-center f-wrap">
        <view style="width: 220rpx; height: 390rpx" class="br20 p-r" v-for="(item, index) in hotList" :key="item.id">
            <view class="p-r">
                <view class="h-center">
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
                    <text class="white">{{ item.time }}</text>
                </view>
                <text class="f30">
                    {{ item.name }}
                </text>
            </view>
            <view class="p-a left-0 top-0 w100 h100 bg-primary">
                <!--            <image :src="item.imgs[0]"></image>-->
            </view>
        </view>
    </view>
</template>

<script setup>
import UniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons'

const data = reactive({
    searchValue: '',
})
const { searchValue } = toRefs(data)
function searchClick() {
    console.log(searchValue.value)
}
</script>

<style lang="scss" scoped></style>
