import uniStarterConfig from '@/uni-starter.config.js';
//应用初始化页
// #ifdef APP-PLUS
import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version';

// 实现，路由拦截。当应用无访问摄像头/相册权限，引导跳到设置界面 https://ext.dcloud.net.cn/plugin?id=5095
import interceptorChooseImage from '@/uni_modules/json-interceptor-chooseImage/js_sdk/main.js';
interceptorChooseImage()

// #endif
const db = uniCloud.database()
export default async function() {
	const debug = uniStarterConfig.debug;

	// uniStarterConfig挂载到getApp().globalData.config
	setTimeout(() => {
		getApp({
			allowDefault: true
		}).globalData.config = uniStarterConfig;
	}, 1)


	// 初始化appVersion（仅app生效）
	initAppVersion();

	//clientDB的错误提示
	function onDBError(errObj) {
		const {
			code, // 错误码详见https://uniapp.dcloud.net.cn/uniCloud/clientdb?id=returnvalue
			message
		} = errObj
		errObj.message = errObj.message.replace("数据库验证失败：","")
		console.log('onDBError', {
			code,
			message
		});
		// 处理错误
		console.error(code, message);
	}
	// 绑定clientDB错误事件
	db.on('error', onDBError)


	// 拦截云对象请求 iphone6会造成无法登陆
	uniCloud.interceptObject({
		async invoke({
			objectName, // 云对象名称
			methodName, // 云对象的方法名称
			params // 参数列表
		}) {
			// console.log('interceptObject',{
			// 	objectName, // 云对象名称
			// 	methodName, // 云对象的方法名称
			// 	params // 参数列表
			// });
			if(objectName == "uni-id-co" && (methodName.includes('loginBy') ||  ['login','registerUser'].includes(methodName) )){
				console.log(methodName)
				console.log('执行登录相关云对象');
				/**
				 * 1.微信登录时，不管是否是首次使用小程序，methodName始终为loginByWeixin;
				 * 2.但在uni-id-pages使用的云函数中会区分成login与regist;
				 * 3.只有在regist情况下，inviteCode才会生效，已注册用户即使通过有邀请码的链接（聊天分享、海报、朋友圈等）进入小程序，inviteCode也不会生效，不视为邀请的新用户
				 * 4.用户信息中不会直接存储邀请人的inviteCode，而是通过inviteCode查询到用户id，将其存入inviter_uid中
				 */
				console.log(uni.$inviteCode)
				params[0].inviteCode = uni.$inviteCode

				// console.log(params);
			}
			// console.log(params);
		},
		success(e) {
			console.log(e);
		},
		complete() {

		},
		fail(e){
			console.error(e);
			// if (debug) {
			// 	uni.showModal({
			// 		content: JSON.stringify(e),
			// 		showCancel: false
			// 	});
			// }else{
			// 	uni.showToast({
			// 		title: '系统错误请稍后再试',
			// 		icon:'error'
			// 	});
			// }
		}
	})


	// #ifdef APP-PLUS
	// 监听并提示设备网络状态变化
	uni.onNetworkStatusChange(res => {
		console.log(res.isConnected);
		console.log(res.networkType);
		if (res.networkType != 'none') {
			uni.showToast({
				title: '当前网络类型：' + res.networkType,
				icon: 'none',
				duration: 3000
			})
		} else {
			uni.showToast({
				title: '网络类型：' + res.networkType,
				icon: 'none',
				duration: 3000
			})
		}
	});
	// #endif

}
/**
 * // 初始化appVersion
 */
function initAppVersion() {
	// #ifdef APP-PLUS
	let appid = plus.runtime.appid;
	plus.runtime.getProperty(appid, (wgtInfo) => {
		let appVersion = plus.runtime;
		let currentVersion = appVersion.versionCode > wgtInfo.versionCode ? appVersion : wgtInfo;
		getApp({
			allowDefault: true
		}).appVersion = {
			...currentVersion,
			appid,
			hasNew: false
		}
		// 检查更新小红点
		callCheckVersion().then(res => {
			// console.log('检查是否有可以更新的版本', res);
			if (res.result.code > 0) {
				// 有新版本
				getApp({
					allowDefault: true
				}).appVersion.hasNew = true;
			}
		})
	});
	// 检查更新
	// #endif
}