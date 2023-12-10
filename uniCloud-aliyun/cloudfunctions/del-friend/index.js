'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
    //event为客户端上传的参数
const res = await db.collection('special-days-share').where({
	poster:[]
}).remove()

const ids = [12341234,34123423]
	const res = await db.collection('start-friends').where({
		lemmaId:{
			$in:ids
		}
	}).remove()
console.log(res);

    //返回数据给客户端
    return res
};