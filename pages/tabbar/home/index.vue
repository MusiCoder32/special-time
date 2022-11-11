<template>
    <view>{{ day }}</view>
    <view>{{ ageAll }}</view>
    <view>{{ ageOnly }}</view>
    <view>{{ month }}</view>
    <view>{{ days }}</view>
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
const ageOnly = ref('')
const month = ref('')
const days = ref('')

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
        ageOnly.value = dayjs().diff(startTime, 'year', true).toFixed(7) + '岁 '
        month.value = dayjs().diff(startTime, 'month') + '月'
        days.value = dayjs().diff(startTime, 'day') + '天'
    }, 1000)
}
</script>
<style></style>
