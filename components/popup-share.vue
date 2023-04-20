<template>
	<view class="uni-popup-share">
		<view class="uni-share-title"><text class="uni-share-title-text">{{shareTitleText}}</text></view>
			<view class="h-around-center pt10">
				<view class="v-center" v-for="(item,index) in bottomData" :key="index">
          <button
              type="primary"
              class="br40 h-center"
              :style="{ width: '60rpx', height: '60rpx', background: '#1cbbb4', padding: '0 !important' }"
          >
            <uni-icons class="mt8 mr8" color="white" :type="item.icon" size="30"></uni-icons>
          </button>
					<text class="uni-share-text">{{item.text}}</text>
				</view>
		</view>
		<view class="uni-share-button-box">
			<button class="uni-share-button" @click="close">{{cancelText}}</button>
		</view>
	</view>
</template>

<script setup>
const shareTitleText = '分享到'
const cancelText = '取消'
const bottomData =  [{
  text: '微信好友',
  icon: 'redo',
  name: 'wx'
},
  {
    text: '朋友圈',
    icon: 'pyq',
    name: 'wx'
  },
]

</script>
<style lang="scss" >
	.uni-popup-share {
		background-color: #fff;
		border-top-left-radius: 11px;
		border-top-right-radius: 11px;
	}
	.uni-share-title {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		align-items: center;
		justify-content: center;
		height: 40px;
	}
	.uni-share-title-text {
		font-size: 14px;
		color: #666;
	}



	.uni-share-content-item {

	}

	.uni-share-content-item:active {
		background-color: #f5f5f5;
	}

	.uni-share-image {
		width: 60rpx;
		height: 60rpx;
	}

	.uni-share-text {
		margin-top: 10px;
		font-size: 14px;
		color: #3B4144;
	}

	.uni-share-button-box {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		padding: 10px 15px;
	}

	.uni-share-button {
		flex: 1;
		border-radius: 50px;
		color: #666;
		font-size: 16px;
	}

	.uni-share-button::after {
		border-radius: 50px;
	}
</style>
