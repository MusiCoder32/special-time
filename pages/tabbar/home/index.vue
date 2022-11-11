<template>
    <view v-if="day" class="v-center">
        <view>你已存在{{ day }}</view>
        <view>你已经{{ ageAll }}</view>
        <view>你今年{{ ageOnly }}岁</view>
        <view>度过了{{ months }}月</view>
        <view>经历了{{ days }}天</view>
        <view>拥有过{{ hours }}时</view>
        <view>快乐过{{ minutes }}分</view>
        <view>经历过{{ seconds }}秒</view>
        <view>距自己的生日还有{{ birthDay }}天</view>
    </view>
</template>

<script setup>
import dayjs from 'dayjs'
import { onBeforeMount, onMounted, reactive, ref, computed } from 'vue'
import UniIdPagesBindMobile from '../../../uni_modules/uni-id-pages/components/uni-id-pages-bind-mobile/uni-id-pages-bind-mobile'
import { getAgeAll, getAgeOnly, getGrowAge, getGrowTime } from '../../../utils/getAge'
const prop = defineProps({
    data: {
        type: String,
    },
})
const info = ref({})
const ageAll = ref('')
const day = ref('')
const ageOnly = ref('0')
const months = ref('0')
const days = ref('0')
const hours = ref('0')
const minutes = ref('0')
const seconds = ref('0')
const birthDay = ref('0')

init()

async function init() {
    const db = uniCloud.database()

    const {
        result: { errCode, data },
    } = await db
        .collection('start-end-time')
        .where({
            user_id: db.getCloudEnv('$cloudEnv_uid'),
        })
        .get()

    if (errCode == 0) {
        if (data.length === 0) {
            uni.redirectTo({
                url: '/pages/tabbar/home/guide',
            })
        } else {
            info.value = data[0]
            startInterval()
        }
    } else {
        uni.showToast({
            icon: 'none',
            title: errCode,
        })
    }
}
function startInterval() {
    setInterval(() => {
        const startTime = info.value.start_time
        day.value = getGrowTime(startTime)
        ageAll.value = getAgeAll(startTime)
        ageOnly.value = dayjs().diff(startTime, 'year', true).toFixed(7)
        months.value = dayjs().diff(startTime, 'month')
        days.value = dayjs().diff(startTime, 'day')
        hours.value = dayjs().diff(startTime, 'hour')
        minutes.value = dayjs().diff(startTime, 'minute')
        seconds.value = dayjs().diff(startTime, 'second')
        birthDay.value = dayjs(startTime).add(1, 'year').diff(dayjs(), 'day')
    }, 1000)
}
</script>
<style></style>
