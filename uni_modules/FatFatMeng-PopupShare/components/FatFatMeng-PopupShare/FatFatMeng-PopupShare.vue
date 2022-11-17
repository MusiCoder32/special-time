<template>
	<view>
		<button v-if="false" @click="open">打开弹窗</button>
		<uni-popup ref="popup" type="bottom">
			<text v-if="false" class="app-text">Popup</text>
			<view class="popou-box">
				<view class="popou-box__header">
					<text class="popou-box__header__title"
					>分享至</text>
				</view>
				<view class="popou-box__list">
					<!-- 已配置SharelistConfing -->
					<view class="popou-box__list__item"
					v-for="(item,index) in shareData" :key="index"
					@click="ShareItemTap(index,item)">
						<view v-if="item.isShow"
						class="popou-box__list__item__Imagebox">
							<image class="popou-box__list__item__Imagebox__Img" mode="widthFix"
							:src="item.imgurl"></image>
						</view>
						<text v-if="item.isShow"
						class="popou-box__list__item__text-name"
						>{{item.name}}</text>
					</view>
				</view>
				<view class="popou-box__cell" @click="close">
					<text class="popou-box__cell__title"
					>取消</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	// 导入静态分享文件数据
	import MixinsShareData from './mixins/shareData.js'
	export default {
		name:"FatFatMeng-PopupShare",
		mixins:[
			MixinsShareData
		],
		props:{
			SharelistConfing:{
				type:Array,
				default:()=>[]
			}
		},
		data() {
			return {
				
			};
		},
		created(){
			if (this.SharelistConfing.length!=0){
				this.shareData = this.SharelistConfing
			}else {
				// 使用内置默认的数据
			}
		},
		methods:{
			// 打开弹窗
			open(){
			// 通过组件定义的ref调用uni-popup方法 ,如果传入参数 ，type 属性将失效 ，仅支持 ['top','left','bottom','right','center']
			this.$refs.popup.open()
			},
			// 关闭弹窗
			close() {
				this.$refs.popup.close()
			},
			// 点击了分享item项
			ShareItemTap(index,item){
				//console.log("第"+Number(e+1)+"个")
				//不能把item回调回去，因为item是内置的，不是自定义的
				let event = {
					index:Number(index+1),//索引
					name:item.name
				}
				console.log("分享点击")
				console.log(event)
				this.$emit("changeShare",event)
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import './PopupShare.scss';
</style>
