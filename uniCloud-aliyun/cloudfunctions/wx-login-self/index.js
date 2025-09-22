'use strict';

const db = uniCloud.database();
const users = db.collection('uni-id-users');

exports.main = async (event, context) => {
	const time1 = +new Date()
	console.log('连接到登录云函数时间',time1)

	const { code, inviteCode } = event;
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
	const time2 = +new Date()
	console.log('微信code登录换取openid耗时',time2,time2-time1)
	const { openid } = wxRes.data;
	if (!openid) return { code: 1, msg: '微信登录失败' };

	// 获取客户端ip
	const login_ip = context.CLIENTIP || event.clientIP || '';
	const login_date = new Date();

	// 2. 查找用户

	let userRes = await users.where({ 'wx_openid.mp': openid }).get();
	let userId;
	const time3 = +new Date()
	console.log('通过openid查到到用户耗时',time3,time3-time2)
	if (userRes.data.length === 0) {
		// 3. 新用户自动注册
		const addRes = await users.add({
			wx_openid: { mp: openid },
			createTime: Date.now(),
			register_date: login_date,
			register_ip: login_ip,
			last_login_date: login_date,
			last_login_ip: login_ip,
		});
		userId = addRes.id;
	} else {

		// 4. 老用户，更新登录时间、ip、设备信息
		userId = userRes.data[0]._id;
		users.doc(userId).update({
			last_login_date: login_date,
			last_login_ip: login_ip,
		});
		const time4 = +new Date()
		console.log('更新用户最后一次登录信息耗时',time4,time4-time4)
	}
	return { code: 0, userId };
};