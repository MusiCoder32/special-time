'use strict';
const db = uniCloud.database();
const collection = db.collection('special-days-share')
const $ = db.command.aggregate

exports.main = async (event, context) => {

    const res = await collection
        .aggregate()
        .project({
            formatDate: $.dayOfMonth('$time')
        })
        .limit(1)
        .end()

    // const res = await collection.where({
    // 		lunar:0,
    //         time:
    // 	}).field({
    //         time:true,
    //         lunar:true,
    //         name:true,
    //     }).limit(1).get()
    console.log(res);

    //返回数据给客户端
    return res
};