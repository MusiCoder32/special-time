'use strict';

const db = uniCloud.database();
const startFriendTable = db.collection('start-friends');
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
	const obj = JSON.parse(event.body)
	const _id = obj._id
	delete obj._id
	const res =await startFriendTable.doc(_id).update(obj)	
	//返回数据给客户端
	return res
};
