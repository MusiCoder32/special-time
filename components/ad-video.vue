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
import { SpecialDayType, StartScene } from '../utils/emnu'
import SelfPopupDialog from './self-popup-dialog'
import { store } from '@/uni_modules/uni-id-pages/common/store'

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
    freeKey: {
        type: String,
    },
    freeCount: {
        type: Number,
        default: 3,
    },
    showLoading: {
        type: Boolean,
        default: true,
    },
    record: {
        type: Boolean, //由于观看广告发放的时光币不一定够扣除的时光币，故不记录时光币情况，只要观看就发放奖励
        default: true,
    },
    action: {
        required: true,
        type: Function,
        default: () => {},
    },
})

let freeCount = props.freeKey ? uni.getStorageSync(props.freeKey) ?? props.freeCount : 0
debugger

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
            if (props.showLoading) {
                uni.showLoading({ mask: true })
            }
            try {
                /**
                 * 如果从聊天分享打开，且未登录情况，且未设置免费使用次数，观看完广告直接发放奖励
                 */
                if (uni.$startScene === StartScene['聊天分享'] && !store.userInfo._id && !freeCount) {
                    await props.action()
                    if (props.showLoading) {
                        uni.hideLoading()
                    }
                } else {
                    if (comment.value) {
                        //record为fasle,代表观看广告就赠送，不记录时光币
                        if (props.record) {
                            await props.action()
                            if (props.showLoading) {
                                uni.hideLoading()
                            }
                            await setbalance(score, `观看激励视频赠送`)
                            await setbalance(-useScore.value, comment.value)
                        } else {
                            await props.action()
                        }
                    } else {
                        //如果没有备注，代表是消耗，代表是时光币列表仅赚取行为
                        await setbalance(score, `观看激励视频赠送`)
                        if (props.showLoading) {
                            uni.hideLoading()
                        }
                    }
                }
            } catch (e) {
                if (props.showLoading) {
                    uni.hideLoading()
                }
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
    /**
     * 朋友圈中默认不开启广告，方便获客
     * 聊天分享根据用户未登录时不开起广告
     * */
    if (
        uni.$startScene === StartScene['朋友圈'] ||
        (uni.$startScene === StartScene['聊天分享'] && !store.userInfo._id && freeCount > 0)
    ) {
        freeCount--
        uni.setStorage({
            key: props.freeKey,
            data: freeCount,
        })
        if (props.showLoading) {
            uni.showLoading({ mask: true })
        }
        try {
            await props.action()
            if (props.showLoading) {
                uni.hideLoading()
            }
        } catch (e) {}
        return
    }
    /**
     * 如果从聊天分享打开，且未登录情况，且未设置免费使用次数，则只需观看广告
     */
    if (uni.$startScene === StartScene['聊天分享'] && !store.userInfo._id && !freeCount) {
        return watchAd()
    }

    try {
        await getbalance()
        //如果剩余足够时光币,且有comment，说明是消耗
        if (comment.value && balance.value >= useScore.value) {
            const modalRes = await uni.showModal({
                title: '提示',
                content: `需花费 ${useScore.value} 时光币，目前剩余 ${balance.value} 时光币，是否继续？`,
            })
            if (modalRes.confirm) {
                if (props.showLoading) {
                    uni.showLoading({ mask: true })
                }
                try {
                    await props.action()
                    setbalance(-useScore.value, comment.value)
                    if (props.showLoading) {
                        uni.hideLoading()
                    }
                } catch (e) {}
            }
        } else {
            //有canavas页面只能使用原生弹窗，故不支持分享好友
            if (obj.native) {
                watchAd()
            } else {
                modalContent.value = comment.value ? useContent + '\n' + getContent : getContent
                message.value.open()
            }
        }
    } catch (e) {
        console.log(e)
    }
}
async function watchAd() {
    const modalRes = await uni.showModal({
        title: '时光币不足',
        content: '可观看视频，免费' + comment.value,
        confirmText: '立即观看',
    })
    if (modalRes.confirm) {
        openAd()
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
    try {
        const remainScore = balance.value + score
        //如果扣分score超出用户剩余，则扣至0即可，防止出现负分
        if (remainScore < 0) {
            score = -balance.value
            balance.value = 0
        } else {
            balance.value = remainScore
        }
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
