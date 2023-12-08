'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
    //event为客户端上传的参数
    console.log('event : ', event)
    const { _id } = JSON.parse(event.body)
    const res = await db.collection('start-friends').doc(_id).remove()

    //返回数据给客户端
    return res
};