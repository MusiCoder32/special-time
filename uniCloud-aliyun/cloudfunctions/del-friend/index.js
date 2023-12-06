'use strict';


const db = uniCloud.database();
const dbCmd = db.command

exports.main = async (event, context) => {
    //event为客户端上传的参数
    console.log('event : ', event)
	const {lemmaId} = JSON.parse(event.body)
    db.collection('start-friends').where({
        lemmaId
    }).remove()

    //返回数据给客户端
    return event
};