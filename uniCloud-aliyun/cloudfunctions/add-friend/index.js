'use strict';

const db = uniCloud.database();
const startFriendTable = db.collection('start-friends');
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
	const res =await startFriendTable.add(JSON.parse(event.body))	
	//返回数据给客户端
	return res
};
