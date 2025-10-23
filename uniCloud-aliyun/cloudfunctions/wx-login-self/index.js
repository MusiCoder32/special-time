'use strict';

const db = uniCloud.database();
const users = db.collection('uni-id-users');
const uniIdCommon = require('uni-id-common');

exports.main = async (event, context) => {
	const uniIdCommonInstance = uniIdCommon.createInstance({
		context: context
	});
	const time1 = +new Date()
	console.log('连接到登录云函数时间', time1)

	const { code, scene, specialDayId, sceneId, inviteUserId, token } = event;

	let result = { userInfo: {} };
	let needCreateToken = false; // 是否需要创建新token

	// 获取客户端ip
	const login_ip = context.CLIENTIP || event.clientIP || '';
	const login_date = new Date();

	// 1. 优先检查token是否有效
	if (token) {
		try {
			// 尝试检查token，如果需要刷新会自动处理
			const checkTokenResult = await uniIdCommonInstance.checkToken(token, { autoRefresh: true });
			
			if (checkTokenResult.errCode === 0 && checkTokenResult.uid) {
				// token有效，直接返回用户信息
				result.userInfo = checkTokenResult.userInfo;
				
				// 更新用户最后登录信息
				users.doc(checkTokenResult.uid).update({
					last_login_date: login_date,
					last_login_ip: login_ip,
				});
				
				// 如果token被刷新了，返回新token
				if (checkTokenResult.token && checkTokenResult.token !== token) {
					result.token = checkTokenResult.token;
					result.tokenExpired = checkTokenResult.tokenExpired;
				}
				
				// token有效，直接返回
				return result;
			}
		} catch (error) {
			console.log('token校验失败，将进行重新登录:', error);
			// token失效，继续下面的登录流程
		}
	}

	// 2. token无效或不存在，进行微信登录
	if (code) {
		// 1. 用 code 换 openid

		const wxRes = await uniCloud.request({
			url: 'https://api.weixin.qq.com/sns/jscode2session',
			data: {
				appid: 'wxaa7dc591ce7b3ea0',
				secret: 'ff481854d47c9dfcb93528231464ab21',
				js_code: code,
				grant_type: 'authorization_code'
			}
		});
		const { openid } = wxRes.data;
		if (!openid) return { code: 1, msg: '微信登录失败' };

		// 2. 查找用户
		let userRes = await users.where({ 'wx_openid.mp': openid }).get();

		if (userRes.data.length === 0) {
			// 3. 新用户自动注册
			const newUserInfo = {
				wx_openid: { mp: openid },
				createTime: Date.now(),
				register_date: login_date,
				register_ip: login_ip,
				last_login_date: login_date,
				last_login_ip: login_ip,
				inviter_special_day_id: specialDayId, //用于后续统计分享日期数据
				inviter_scene_id: sceneId, //分享来源记录（海报id,群聊链接id,朋友圈id）
			}
			if (inviteUserId) {
				newUserInfo.inviter_uid = [inviteUserId]
			}
			const addRes = await users.add(newUserInfo);
			result.userInfo._id = addRes.id
			result.newUser = true
			needCreateToken = true // 新用户需要生成token
			//记录邀请信息，并发放奖励
			setTimeout(() => {
				setInviteInfo(inviteUserId, result.userInfo._id, scene)
			}, 1000);

		} else {
			//当为老用户，且本地缓存丢失时，返回完整的用户信息
			//其他情况下，仅返回userId
			result.userInfo = userRes.data[0]
			needCreateToken = true // 老用户重新登录也需要生成token
		}
	} else {
		// 3. 既没有有效token，也没有code，无法登录
		return { code: 1, msg: '登录参数不足，请重新登录' };
	}

	// 3. 如果需要创建token
	if (needCreateToken && result.userInfo._id) {
		try {
			const createTokenResult = await uniIdCommonInstance.createToken({
				uid: result.userInfo._id
			});
			
			if (createTokenResult.errCode === 0) {
				result.token = createTokenResult.token;
				result.tokenExpired = createTokenResult.tokenExpired;
			}
		} catch (error) {
			console.log('创建token失败：', error);
		}
	}

	return result;
};

async function setInviteInfo(inviteUserId, userId, scene) {

	//scene存在，表明是扫码进入，需要scene获取邀请人信息
	if (scene) {
		const sceneRes = await getsceneRes(scene)
		if (sceneRes) {
			const params = {
				inviter_scene_id: sceneRes.sceneId,
				inviter_special_day_id: sceneRes.specialDayId,
				inviter_uid: [sceneRes.userId]
			}
			users.doc(userId).update(params);
			inviterAward(sceneRes.userId, 5, '邀请新用户获得')
		}

	} else {
		inviterAward(inviteUserId, 5, '邀请新用户获得')
	}
}


async function getsceneRes(scene) {
	const scene_db = db.collection('scene')
	const sceneRes = await scene_db
		.where({
			_id: scene,
		})
		.get()
	const sceneData = JSON.parse(sceneRes?.result?.data[0]?.details)
	//确认分享海报有效再执行
	if (sceneData) {
		return { sceneId: scene, userId: sceneData.userId, specialDayId: sceneData.specialDayId }
	} else {
		console.log('数据库中未查询到分享海报信息')
		return null
	}


}

async function inviterAward(userId, score, comment) {
	const uniScores = db.collection('uni-id-scores')
	try {
		const res = await uniScores
			.where({
				user_id: userId,
			})
			.field('balance')
			.orderBy('create_date desc')
			.limit(1)
			.get()
		let balance = 0
		try {
			balance = res.result.data[0].balance
		} catch (e) { }
		await uniScores.add({
			user_id: userId,
			balance: balance + score,
			score: score,
			type: 1,
			comment,
		})
	} catch (e) {
		console.log(e)
	}
}