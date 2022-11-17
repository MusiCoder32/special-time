# 插件使用说明
1. 在你需要的地方添加如下演示代码即可

# 基本用法

## 示例
```html
<!-- html代码 --->
<FatFatMeng-PopupShare
ref="PopupShare"
:SharelistConfing="SharelistConfing"
@changeShare="changeShareTap"
></FatFatMeng-PopupShare>


<button	type="default" 
@click="ShowShare"
>打开点开分享弹窗</button>

```

```javascript
// js代码
export default {
	data() {
		return {
			// [PopupShare分享插件]控制显示需要的分享item项
			SharelistConfing:[
				// 不填则使用组件内置的
				
				// @isShow  是否显示当前项
				// @Images  如果为空则使用插件自带的图标，否则用你自定义的
				// @name    如果为空则使用插件自带的名称，否则用你自定义的
				
				//{isShow:true,Images:'',name:''},
			]
		}
	},
	methods:{
		// @通过组件ref调用弹窗方法
		// 打开分享弹窗
		ShowShare(){
			this.$refs.PopupShare.open()
		}
		
		// 分享item项被点击时的事件回调
		changeShareTap(event){
			// 返回值 event={index:索引项,name:名称}
			uni.showModal({
				title:"索引 = " + event.index,
				content:"名称 = " + event.name
			})
		}
		
	}
}

```

## API

### changeShare Events

|事件称名|说明|返回值|
|:-:|:-:|:-:|
|changeShare|选择触发|event = {index,name}：所选参数|


