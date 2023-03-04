import pagesJson from '@/pages.json'
import config from '@/uni_modules/uni-id-pages/config.js'

const uniIdCo = uniCloud.importObject("uni-id-co")
const db = uniCloud.database();
const usersTable = db.collection('uni-id-users')

let hostUserInfo = uni.getStorageSync('uni-id-pages-userInfo')||{}
// console.log( hostUserInfo);
const data = {
	userInfo: hostUserInfo,
	hasLogin: Object.keys(hostUserInfo).length != 0
}

async function setUserInfoAward(userId) {
	let comment = '新用户设置头像与昵称奖励'
	let showTip = false
	if(!userId) {
		userId = db.getCloudEnv('$cloudEnv_uid')
		showTip = true
	} else {
		comment = '邀请'+comment
	}
	const uniScores = db.collection('uni-id-scores')
	const res = await uniScores.where({
		user_id:userId
	}).field('balance').orderBy('create_date desc').limit(1).get()
	const balance  =  res?.result?.data[0]?.balance  || 0
	
	    const addRes = await uniScores.add({
			user_id:userId,
	        balance: balance + 5,
	        score: 5,
	        type: 1,
	        comment,
	    })
		if(addRes.result.code == 0 && showTip) {
			const modalRes = await uni.showModal({
				title:'首次设置头像与昵称成功，获得5时光币',
				showCancel:false
			})
			if(modalRes.confirm) {
				uni.navigateBack()
			}
		}
}

// console.log('data', data);
// 定义 mutations, 修改属性
export const mutations = {
	// data不为空，表示传递要更新的值(注意不是覆盖是合并),什么也不传时，直接查库获取更新
	async updateUserInfo(data = false) {
		if (data) {
			usersTable.where('_id==$env.uid').update(data).then(e => {
				// console.log(e);
				if (e.result.updated) {
					uni.showToast({
						title: "更新成功",
						icon: 'none',
						duration: 3000
					});
					this.setUserInfo(data)
				} else {
					uni.showToast({
						title: "没有改变",
						icon: 'none',
						duration: 3000
					});
				}
			})

		} else {
			try {
				let res = await usersTable.where("'_id' == $cloudEnv_uid")
						.field('_id,mobile,nickname,username,email,avatar_file,my_invite_code,userType,inviter_scene_id,inviter_uid')
						.get()
				this.setUserInfo(res.result.data[0])
			} catch (e) {
				this.setUserInfo({},{cover:true})
				console.error(e.message, e.errCode);
			}
		}
	},
	async setUserInfo(data, {cover}={cover:false}) {
					//判断是否是首次完成昵称与头像设置。由于头像和昵称设置后不能再置为null，故可这样判断
		if(data.nickname || data.avatar_file) {
			const {nickname,avatar_file,inviter_uid=[]} = store.userInfo
			if(!nickname && avatar_file && data.nickname) {
				//发放给当前用户
				setUserInfoAward()
				//发放给邀请用户
				setUserInfoAward(inviter_uid[0])
			}else if(!avatar_file && nickname && data.avatar_file) {
				setUserInfoAward()
				setUserInfoAward(inviter_uid[0])
			}
		}
		// console.log('set-userInfo', data);
		let userInfo = cover?data:Object.assign(store.userInfo,data)
		store.userInfo = Object.assign({},userInfo)
		store.hasLogin = Object.keys(store.userInfo).length != 0
		// console.log('store.userInfo', store.userInfo);
		uni.setStorage({
			key: "uni-id-pages-userInfo",
			data:store.userInfo
		})
		return data
	},
	async logout() {
		// 1. 已经过期就不需要调用服务端的注销接口	2.即使调用注销接口失败，不能阻塞客户端
		if(uniCloud.getCurrentUserInfo().tokenExpired > Date.now()){
			try{
				await uniIdCo.logout()
			}catch(e){
				console.error(e);
			}
		}
		uni.removeStorageSync('uni_id_token');
		uni.setStorageSync('uni_id_token_expired', 0)
		uni.redirectTo({
			url: `/${pagesJson.uniIdRouter?.loginPage ?? 'uni_modules/uni-id-pages/pages/login/login-withoutpwd'}`,
		});
		uni.$emit('uni-id-pages-logout')
		this.setUserInfo({},{cover:true})
	},

	loginBack (e = {}) {
		const {uniIdRedirectUrl = ''} = e
		let delta = 0; //判断需要返回几层
		let pages = getCurrentPages();
		// console.log(pages);
		pages.forEach((page, index) => {
			if (pages[pages.length - index - 1].route.split('/')[3] == 'login') {
				delta++
			}
		})
		// console.log('判断需要返回几层:', delta);
		if (uniIdRedirectUrl) {
			return uni.reLaunch({
				url: uniIdRedirectUrl
			})
		}
		// #ifdef H5
		if (e.loginType == 'weixin') {
			// console.log('window.history', window.history);
			return window.history.go(-3)
		}
		// #endif

		if (delta) {
			const page = pagesJson.pages[0]
			return uni.reLaunch({
				url: `/${page.path}`
			})
		}

		uni.navigateBack({
			delta
		})
	},
	loginSuccess(e = {}){
		const {
			showToast = true, toastText = '登录成功', autoBack = true, uniIdRedirectUrl = '', passwordConfirmed
		} = e
		// console.log({toastText,autoBack});
		if (showToast) {
			uni.showToast({
				title: toastText,
				icon: 'none',
				duration: 3000
			});
		}
		this.updateUserInfo()

		uni.$emit('uni-id-pages-login-success')

		if (config.setPasswordAfterLogin && !passwordConfirmed) {
			return uni.redirectTo({
				url: uniIdRedirectUrl ? `/uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd?uniIdRedirectUrl=${uniIdRedirectUrl}&loginType=${e.loginType}`: `/uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd?loginType=${e.loginType}`,
				fail: (err) => {
					console.log(err)
				}
			})
		}

		if (autoBack) {
			this.loginBack({uniIdRedirectUrl})
		}
	}

}

// #ifdef VUE2
import Vue from 'vue'
// 通过Vue.observable创建一个可响应的对象
export const store = Vue.observable(data)
// #endif

// #ifdef VUE3
import {
	reactive
} from 'vue'
// 通过Vue.observable创建一个可响应的对象
export const store = reactive(data)
// #endif
