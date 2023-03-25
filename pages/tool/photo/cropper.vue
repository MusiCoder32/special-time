<template>
    <view class="cropper">
        <view class="cropper-mask"></view>
        <view class="cropper-content">
            <view class="cropper-image-wrapper">
                <image ref="image" class="cropper-image" :src="src" mode="aspectFill" />
            </view>
            <view class="cropper-crop-wrapper">
                <view class="cropper-crop" :style="cropStyle" @touchmove="onCropTouchMove">
                    <image class="cropper-crop-image" :src="src" mode="aspectFill" :style="cropImageStyle" />
                </view>
                <view class="cropper-crop-dashed"></view>
            </view>
            <view class="cropper-buttons">
                <button class="cropper-button" @click="onCancelClick">取消</button>
                <button class="cropper-button" @click="onConfirmClick">确定</button>
            </view>
        </view>
    </view>
</template>
<script setup>
import { reactive, onMounted } from 'vue'

const props = defineProps({
    src: {
        type: String,
        default: '',
    },
})

const emit = defineEmits('change')

const state = reactive({
    cropX: 0,
    cropY: 0,
    cropSize: 200,
    imageWidth: 0,
    imageHeight: 0,
})

const cropStyle = computed(() => ({
    width: `${state.cropSize}px`,
    height: `${state.cropSize}px`,
    transform: `translate(${state.cropX}px, ${state.cropY}px)`,
}))

const cropImageStyle = computed(() => ({
    width: `${state.imageWidth}px`,
    height: `${state.imageHeight}px`,
    transform: `translate(-${state.cropX}px, -${state.cropY}px)`,
}))

const onImageLoad = () => {
    const image = refs.image
    state.imageWidth = image.width
    state.imageHeight = image.height
}

const onCropTouchMove = (event) => {
    const touch = event.touches[0]
    const { clientX, clientY } = touch
    const { x, y } = event.target.getBoundingClientRect()
    const dx = clientX - x - state.cropSize / 2
    const dy = clientY - y - state.cropSize / 2
    const maxX = state.imageWidth - state.cropSize
    const maxY = state.imageHeight - state.cropSize
    state.cropX = Math.max(0, Math.min(maxX, dx))
    state.cropY = Math.max(0, Math.min(maxY, dy))
}

const onCancelClick = () => {
    uni.navigateBack()
}

const onConfirmClick = () => {
    uni.showLoading({
        title: '裁剪中...',
    })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = state.cropSize
    canvas.height = state.cropSize
    const image = refs.image
    ctx.drawImage(image, state.cropX, state.cropY, state.cropSize, state.cropSize, 0, 0, state.cropSize, state.cropSize)
    const base64 = canvas.toDataURL()
    uni.hideLoading()
    emit('change', base64)
}

onMounted(() => {
    const query = uni.createSelectorQuery()
    query
        .select('.cropper-crop')
        .boundingClientRect((rect) => {
            state.cropSize = rect.width
            state.cropX = (state.imageWidth - state.cropSize) / 2
            state.cropY = (state.imageHeight - state.cropSize) / 2
        })
        .exec()
})
</script>
<style scoped>
.cropper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    background-color: #000000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.cropper-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.5;
    background-color: #000000;
}

.cropper-content {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.cropper-image-wrapper {
    width: 100%;
    height: 0;
    padding-top: 100%;
    position: relative;
}

.cropper-image {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.cropper-crop-wrapper {
    width: 100%;
    height: 0;
    padding-top: 100%;
    position: relative;
    margin-top: -100%;
}

.cropper-crop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px dashed #ffffff;
    box-sizing: border-box;
}

.cropper-crop-image {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.cropper-crop-dashed {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60%;
    height: 60%;
    margin-top: -30%;
    margin-left: -30%;
    border: 1px dashed #ffffff;
    box-sizing: border-box;
}

.cropper-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 20px;
    box-sizing: border-box;
    margin-top: 20px;
}

.cropper-button {
    background-color: #ffffff;
    color: #000000;
    border-radius: 20px;
    padding: 10px 20px;
    font-size: 14px;
}
</style>
