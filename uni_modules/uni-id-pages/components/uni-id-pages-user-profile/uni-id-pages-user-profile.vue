<template>
	<uni-popup ref="popup" type="bottom">
		<view class="box">
			<text class="headBox">绑定资料</text>
			<text class="tip">获取你的微信头像和昵称，完善你的个人资料</text>
			<view class="btnBox">
				<text @click="closeMe(null)" class="close">关闭</text>
				<button class="agree uni-btn" type="primary" @click="getUserProfile">确定</button>
			</view>
		</view>
	</uni-popup>
</template>

<script setup>
	import {
		defineEmits,
		ref
	} from 'vue'
	const db = uniCloud.database();
	const usersTable = db.collection('uni-id-users')
	let userId = ''
	const emit = defineEmits(['next'])
	const popup = ref()

	async function open(uid) {
		userId = uid
		popup.value.open()
	}
	async function getUserProfile() {
		uni.showLoading();
		try {
			let res = await uni.getUserProfile({
				desc: "用于设置账户昵称和头像",
			})
			console.log("userInfo", res);
			if (res.errMsg != "getUserProfile:ok") {
				await closeMe(null)
			} else {
				let {
					avatarUrl,
					nickName
				} = res.userInfo;

				let {
					tempFilePath
				} = await uni.downloadFile({
					url: avatarUrl,
				});
				console.log(tempFilePath)
				const extName = tempFilePath.split('.').pop() || 'jpg'
				const cloudPath = 'user/avatar/' + userId + '/' + Date.now() + '-avatar.' + extName;
				// console.log(tempFilePath);
				const result = await uniCloud.uploadFile({
					filePath: tempFilePath,
					cloudPath,
					fileType: 'image'
				});
				console.log(result)
				let userInfo = {
					"nickname": nickName,
					"avatar_file": {
						name: cloudPath,
						extname: "jpg",
						url: result.fileID
					}
				}
				await closeMe(userInfo)
			}

		} catch (e) {
			console.log('error:',e)
		}
		uni.hideLoading();

	}

	async function closeMe(userInfo = {
		nickname: "匿名微信用户"
	}) {
		
		uni.showLoading()
		try {
			const res = await usersTable.where('_id==$env.uid').update(userInfo)
		} catch (e) {
			uni.showModal({
				content: err.message || '请求服务失败',
				showCancel: false
			})
		}
		uni.hideLoading()
		popup.value.close()
		emit('next')
	}

	defineExpose({
		open,
	})
</script>

<style lang="scss" scoped>
	@import "@/uni_modules/uni-id-pages/common/login-page.scss";

	view {
		display: flex;
	}

	.box {
		background-color: #FFFFFF;
		height: 200px;
		width: 750rpx;
		flex-direction: column;
		border-top-left-radius: 15px;
		border-top-right-radius: 15px;
	}

	.headBox {
		padding: 20rpx;
		height: 80rpx;
		line-height: 80rpx;
		text-align: left;
		font-size: 16px;
		color: #333333;
		margin-left: 15rpx;
	}

	.tip {
		color: #666666;
		text-align: left;
		justify-content: center;
		margin: 10rpx 30rpx;
		font-size: 18px;
	}

	.btnBox {
		margin-top: 45rpx;
		justify-content: center;
		flex-direction: row;
	}

	.close,
	.agree {
		text-align: center;
		width: 200rpx;
		height: 80upx;
		line-height: 80upx;
		border-radius: 5px;
		margin: 0 20rpx;
		font-size: 14px;
	}

	.close {
		color: #999999;
		border-color: #EEEEEE;
		border-style: solid;
		border-width: 1px;
		background-color: #FFFFFF;
	}

	.close:active {
		color: #989898;
		background-color: #E2E2E2;
	}

	.agree {
		color: #FFFFFF;
	}

	/* #ifdef MP */
	.agree::after {
		border: none;
	}

	/* #endif */
	.agree:active {
		background-color: #F5F5F6;
	}
</style>
