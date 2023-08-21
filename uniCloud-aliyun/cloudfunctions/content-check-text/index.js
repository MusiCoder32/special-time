'use strict';
	// 引入uni-sec-check公共模块
	const UniSecCheck = require('uni-sec-check');
	// 初始化实例

exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
	const { content } = event
	const uniSecCheck = new UniSecCheck({
		provider: 'mp-weixin',
		requestId: context.requestId , // 云函数内则写 context.requestId 云对象内则写 this.getUniCloudRequestId()
	});
	
					const checkRes = await uniSecCheck.textSecCheck({
						// 文本内容，不可超过500KB
						content,
						// 微信小程序端 开放的唯一用户标识符
						// openid,
						// 场景值（1 资料；2 评论；3 论坛；4 社交日志）
						scene: 3,
						// 接口版本号，可选1或2，但1的检测能力很弱  支持微信登录的项目，微信小程序端 可改用模式2 详情：https://uniapp.dcloud.net.cn/uniCloud/uni-sec-check.html#%E4%BD%BF%E7%94%A8%E5%89%8D%E5%BF%85%E7%9C%8B
						version: 1
					})

	//返回数据给客户端
	return checkRes
};
