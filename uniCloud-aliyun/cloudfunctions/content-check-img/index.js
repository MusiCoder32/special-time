'use strict';
	// 引入uni-sec-check公共模块
	const UniSecCheck = require('uni-sec-check');
	// 初始化实例

exports.main = async (event, context) => {
	//event为客户端上传的参数
	const { image } = event
	const uniSecCheck = new UniSecCheck({
		provider: 'mp-weixin',
		requestId: context.requestId , // 云函数内则写 context.requestId 云对象内则写 this.getUniCloudRequestId()
	});
	

  const checkRes = await uniSecCheck.imgSecCheck({
    image, // 待检测的图片URL
    scene: 3, // 表示资料类场景
    version: 1 // 调用检测API的版本号
  })

	//返回数据给客户端
	return checkRes
};
