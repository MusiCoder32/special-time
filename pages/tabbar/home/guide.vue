<template>
	<view>
		<view v-if="show" class="swiper-css zqui-rel" :style="{ height: hpx }">
			<swiper @change="swiperChange" :current="cur" class="swiper" :style="{ height: hpx }">
				<swiper-item @touchmove.stop="" class="flex1" v-for="(item, index) in timeList" :key="index">
					<view class=" title-box">
						<view class="guide-title">{{item.name}}</view>
						<view v-if="cur !==2" class="guide-subtitle">{{item.subtitle}}</view>
						<input @input="inputChange" class="guide-subtitle" v-else placeholder="在此输入纪念日名称" />
					</view>
					<date-picker :yearLength="index === 1? 100 : -100" :height="400" @change="dateChange($event,index)">
					</date-picker>
				</swiper-item>
			</swiper>
			<!-- 按钮样式切换 -->
			<template>
				<view class="dots">
					<block v-for="(item,index) in timeList" :key="index">
						<view class="dot" :class="{'active':  index == cur}"></view>
					</block>
				</view>
			</template>
			<!-- 第三张图使用按钮《立即进入》 -->
			<template>
				<view class="h-center" style="position: fixed;
		bottom: 200rpx;width: 750rpx;">
					<button v-if="cur > 0" class=" mr40 cu-btn footer" @click="pre">上一步</button>
					<button class=" cu-btn footer" @click="next">{{cur===2 ?'立即体验':'下一步'}}</button>
				</view>
			</template>
		</view>
	</view>
</template>

<script>
	import DatePicker from '/components/date-picker.vue'
	export default {
		components: {
			DatePicker
		},
		data() {

			return {

				//修改图片,文字描述
				timeList: [{
						name: '设置出生日期',
						subtitle: `这一天你出生了`,
						value: null
					},
					{
						name: '计划离开日期',
						subtitle: `这一天你圆满了`,
						value: null
					},
					{
						name: '设置一个纪念日',
						subtitle: ``,
						value: null
					}
				],
				show:false,
				hpx: '100%',
				cur: 0,
			};
		},
		async onLoad() {
			let that = this;
			uni.getSystemInfo({
				success: function(res) {
					that.hpx = res.windowHeight + 'px';
				}
			});
			this.getInfo()
		},
		onReady() {

		},
		methods: {
			async getInfo() {
				const db = uniCloud.database();
				uni.showLoading({
					mask: true
				})
				const {
					result: {
						errCode,
						data
					}
				} = await db.collection('start-end-time').where({
					user_id: db.getCloudEnv('$cloudEnv_uid')
				}).get()
				uni.hideLoading()
				if (errCode == 0) {
					if (data.length > 0) {
						uni.switchTab({
							url: '/pages/tabbar/home/index'
						});
					} else {
						this.show = true
					}
				} else {
					uni.showToast({
						icon: 'none',
						title: errCode
					})
				}
			},
			inputChange(e) {
				this.timeList[2].subtitle = e.detail.value
			},
			swiperChange(e) {
				this.cur = e.detail.current
			},
			dateChange({
				year,
				month,
				day
			}, index) {
				this.timeList[index].value = `${year}-${month}-${day}`
			},
			pre() {
				this.cur--
			},
			async next() {
				if (this.cur < 2) {
					this.cur++
				} else {
					if (!this.timeList[2].subtitle) {
						uni.showToast({
							icon: 'none',
							title: '请输入一个纪念日名称'
						})
					} else {
						const params = {
							start_time: this.timeList[0].value,
							end_time: this.timeList[1].value
						}

						const db = uniCloud.database();
						const startEndTime = db.collection('start-end-time')
						await startEndTime.add(params)
						uni.switchTab({
							url: '/pages/tabbar/home/index'
						});
					}

				}

			},
			guideAction(event) {
				let that = this,
					index = event.detail.current;
				that.cur = index;
			},

		}
	};
</script>

<style lang="scss">
	page {
		background-color: #FFFFFF;
		min-height: 100%;
		height: 100%;
	}

	.guide {
		flex-direction: column;
		flex: 1;
	}

	.flex1 {
		flex: 1;
		width: 100%;
		height: 100%;
	}

	.image-size {
		width: 630rpx;
		height: 600rpx;
		margin-left: 60rpx;
	}

	.title-box {
		padding: 180rpx 0 120rpx 64rpx;
	}

	.guide-title {
		font-size: 48rpx;
		font-weight: bold;
		color: rgba(58, 61, 68, 1);
	}

	.guide-subtitle {
		margin-top: 20rpx;
		font-size: 35rpx;
		color: rgba(131, 136, 146, 1);
		line-height: 50rpx;
	}

	.footer {
		width: 231rpx;
		height: 80rpx;
		text-align: center;

		font-size: 30rpx;
		color: #FFFFFF;
		background-color: #2B9939;
	}

	.btn-box {
		position: absolute;
		z-index: 999;
		right: 40rpx;
		top: 120rpx;
	}

	.dots {
		display: flex;
		justify-content: center;
		position: absolute;
		z-index: 999;
		height: 151rpx;
		left: 0;
		right: 0;
		bottom: 20rpx;
	}

	.passbtn {
		color: #838892;
		text-align: center;
		border-width: 1rpx;
		border-color: rgba(0, 0, 0, 0.5);
		border-style: solid;
		border-radius: 30rpx;
		font-size: 28rpx;
		padding-top: 10rpx;
		padding-bottom: 10rpx;
		padding-left: 25rpx;
		padding-right: 25rpx;
	}

	.dot {
		margin: 0 4rpx;
		width: 15rpx;
		height: 15rpx;
		background: #CDD2DD;
		border-radius: 8rpx;
		transition: all .6s;
	}

	.dot.active {
		width: 40rpx;
		background: #838892 !important;
	}

	/* 相对定位 */
	.zqui-rel {
		position: relative;
	}

	.swiper-css {
		width: 750rpx;
	}

	.swiper-item {
		width: 750rpx;
	}
</style>
