'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
	
	//返回数据给客户端
	return [
		{
			key:'card-photo',
			name:'证件照',
			color:'#B7D7C9'
		},
	{
		key:'visit-home',
			name:'看房',
			color:'#D7C9B7'
		},
	]
};
