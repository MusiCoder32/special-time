<template>
    <ad-rewarded-video
        ref="adRewardedVideo3"
        adpid="1281160936"
        :preload="true"
        :loadnext="true"
        v-slot:default="{ loading, error }"
        @load="onadload"
        @close="onadclose"
        @error="onaderror"
    >
        <!--            <view class="ad-error" v-if="error">{{ error }}</view>-->
    </ad-rewarded-video>
    <uni-popup ref="message" class="br10" type="dialog">
        <self-popup-dialog
            type="info"
            :cancelText="modalOption.cancelText"
            :confirmText="modalOption.confirmText"
            :title="modalOption.title"
            :content="modalContent"
            @close="dialogClose"
        />
    </uni-popup>
</template>

<script setup>
import { debounce } from 'lodash'
import { ref } from 'vue'
import { SpecialDayType } from '../utils/emnu'
import SelfPopupDialog from './self-popup-dialog'

const emit = defineEmits(['adEndClose', 'next'])
const startAdTime = ref(0)
const adRewardedVideo3 = ref() //全局层面不能重复
const balance = ref(0)
const useScore = ref(1)
const comment = ref('')
const message = ref()

const modalOption = {
    title: '时光币不足',
    cancelText: '观看视频',
    confirmText: '邀请用户',
}
const modalContent = ref('')
const db = uniCloud.database()

const props = defineProps({
    action: {
        required: true,
        type: Function,
        default: () => {},
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
            uni.showLoading({ mask: true })
            try {
                if (comment.value) {
                    await props.action()
                    uni.hideLoading()
                    await setbalance(score, `观看激励视频赠送`)
                    await setbalance(-useScore.value, comment.value)
                } else {
                    await setbalance(score, `观看激励视频赠送`)
                    uni.hideLoading()
                }
            } catch (e) {
                uni.hideLoading()
            }
        } catch (e) {
            console.log(e)
        }
    }
}, 1000)
function onaderror(e) {
    // 广告加载失败
    console.log('onaderror: ', e.detail)
}
async function beforeOpenAd(obj = {}) {
    // 若obj为空，代表赚取
    useScore.value = obj.useScore
    comment.value = obj.comment
    const useContent = `需花费 ${useScore.value} 时光币，目前剩余为 ${balance.value} 。`
    const getContent = `1. 每邀请成功一个新用户，可获得 5 时光币。\n2. 帮助新用户完成头像与昵称设置，双方可再获得 5 时光币。\n3. 观看视频，可获取 2~5 时光币。`
    try {
        await getbalance()
        //如果剩余足够时光币,且有comment，说明是消耗
        if (comment.value && balance.value >= useScore.value) {
            const modalRes = await uni.showModal({
                title: '提示',
                content: `需花费 ${useScore.value} 时光币，目前剩余 ${balance.value} 时光币，是否继续？`,
            })
            if (modalRes.confirm) {
                uni.showLoading({ mask: true })
                try {
                    await props.action()
                    setbalance(-useScore.value, comment.value)
                    uni.hideLoading()
                } catch (e) {}
            }
        } else {
            modalContent.value = comment.value ? useContent + '\n' + getContent : getContent
            message.value.open()
        }
    } catch (e) {
        console.log(e)
    }
}

function dialogClose() {
    openAd()
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
