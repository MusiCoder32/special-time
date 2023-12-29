'use strict'

const db = uniCloud.database()
const shareTable = db.collection('special-days-share')
exports.main = async (event, context) => {
    //event为客户端上传的参数
    console.log('event : ', event)
    const {params,_id} = JSON.parse(event.body)
    const res = await shareTable.doc(_id).update(params)
    //返回数据给客户端
    return res
}
