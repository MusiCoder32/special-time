<template>
<!--    <ad-rewarded-video-->
<!--        ref="adRewardedVideo3"-->
<!--        adpid="1281160936"-->
<!--        :preload="true"-->
<!--        :loadnext="true"-->
<!--        v-slot:default="{ loading, error }"-->
<!--        @load="onadload"-->
<!--        @close="onadclose"-->
<!--        @error="onaderror"-->
<!--    >-->
<!--        &lt;!&ndash;            <view class="ad-error" v-if="error">{{ error }}</view>&ndash;&gt;-->
<!--    </ad-rewarded-video>-->
</template>

<script setup>
import { debounce } from 'lodash'
import { ref } from 'vue'
import { SpecialDayType } from '../utils/emnu'
const emit = defineEmits(['adEndClose', 'next'])
const startAdTime = ref(0)
const adRewardedVideo3 = ref() //全局层面不能重复
const balance = ref(0)
const useScore = ref(1)
const comment = ref('')
const db = uniCloud.database()

const props = defineProps({
    action: {
        required: true,
        type: Function,
    },
})

function onadload(e) {
    console.log('广告数据加载成功')
}
const onadclose = debounce(async function (e) {
    const detail = e.detail
    // 用户点击了【关闭广告】按钮
    if (detail && detail.isEnded) {
        // 每次赠送五分之广告时长的时光币,最少两个，最多五个
        let score = Math.floor((+new Date() - startAdTime.value) / 1000 / 5)
        score = Math.min(score, 5)
        score = Math.max(score, 2)
        // 正常播放结束
        try {
            //无法展示这么多文，省掉
            // let title = ''
            // const remainScore = balance.value - useScore.value
            // if (remainScore >= 0) {
            //     title = `获得 ${score}时光币，本次使用后剩余 ${remainScore} 时光币`
            // } else {
            //     title = `获得 ${score}时光币，合计剩余 ${remainScore} 时光币，不足部分将由系统自动补足`
            // }
            // uni.showLoading({ title })
            uni.showLoading({ mask: true })


          uni.showLoading()
          try {
            await props.action()
            uni.hideLoading()
          } catch (e) {}
            await setbalance(score, `观看激励视频赠送`)
            await setbalance(-balance.value, comment.value)
        } catch (e) {
            console.log(e)
        }
    }
}, 1000)
function onaderror(e) {
    // 广告加载失败
    console.log('onaderror: ', e.detail)
}
async function beforeOpenAd(a, b) {
    useScore.value = a
    comment.value = b
    try {
        await getbalance()
        //如果剩余足够时光币
        if (balance.value >= useScore.value) {
            const modalRes = await uni.showModal({
                title: '提示',
                content: `需花费 ${useScore.value} 时光币，目前剩余 ${balance.value} 时光币，是否继续？`,
            })
            if (modalRes.confirm) {
                uni.showLoading()
                try {
                    await props.action()
                    setbalance(-useScore.value, comment.value)
                    uni.hideLoading()
                } catch (e) {}
            }
        } else {
            const modalRes = await uni.showModal({
                title: '提示',
                content: `需花费 ${useScore.value} 时光币，您目前剩余 ${balance.value} 时光币,观看视频或邀请新用户可获得时光币`,
            })
            if (modalRes.confirm) {
                openAd()
            }
        }
    } catch (e) {
        console.log(e)
    }
}

function openAd() {
    adRewardedVideo3.value.show()
    startAdTime.value = +new Date()
}
async function getbalance() {
    uni.showLoading({ mask: true })
    try {
        const res = await db
            .collection('uni-id-scores')
            .where('"user_id" == $env.uid')
            .field('balance')
            .orderBy('create_date', 'desc')
            .limit(1)
            .get()
        balance.value = res.result.data[0]?.balance || 0
    } catch (e) {
        console.log(e)
    }

    uni.hideLoading()
}

async function setbalance(score, comment) {
    console.log(score)
    try {
        balance.value = balance.value + score
        let { result } = await db.collection('uni-id-scores').add({
            balance: balance.value,
            score,
            type: score > 0 ? 1 : 2,
            comment,
        })
    } catch (e) {
        console.log(e)
    }
}

defineExpose({
    beforeOpenAd,
})
</script>

<style scoped></style>
