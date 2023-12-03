'use strict';

const db = uniCloud.database();
const startFriendTable = db.collection('start-friends');
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
	const {_id,friends} = JSON.parse(event.body)
	const res =await startFriendTable.doc(_id).update({friends})	
	//返回数据给客户端
	return res
};
