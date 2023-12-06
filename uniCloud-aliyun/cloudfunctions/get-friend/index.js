'use strict';

const db = uniCloud.database();
const startFriendTable = db.collection('start-friends');
exports.main = async (event, context) => {
	//event为客户端上传的参数
	
	const {where,limit=1} = JSON.parse(event.body)
	const res =await startFriendTable.where(where).field({
		lemmaTitle:true,lemmaId:true,coverPic:true
		}).limit(limit).get()	
	//返回数据给客户端
	return res
};
