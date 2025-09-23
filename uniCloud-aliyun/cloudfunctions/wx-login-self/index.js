'use strict';

const { result } = require("lodash");

const db = uniCloud.database();
const users = db.collection('uni-id-users');

exports.main = async (event, context) => {
	const time1 = +new Date()
	console.log('连接到登录云函数时间', time1)

	const { code, scene, specialDayId, sceneId, _id, inviteUserId } = event;

	let result = { code: 0, userInfo:{_id} }


	// 获取客户端ip
	const login_ip = context.CLIENTIP || event.clientIP || '';
	const login_date = new Date();

	if (!_id && code) {
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
			result.newUser = true			//记录邀请信息，并发放奖励
			setTimeout(() => {
				setInviteInfo(inviteUserId, result._id, scene)
			}, 1000);

		} else {
			//当为老用户，且本地缓存丢失时，返回完整的用户信息
			//其他情况下，仅返回userId
			result = userRes.data[0]
		}
	} else {
		// 4. 老用户，更新登录时间、ip、设备信息
		users.doc(userId).update({
			last_login_date: login_date,
			last_login_ip: login_ip,
		});
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