'use strict';


const db = uniCloud.database();
const dbCmd = db.command

async function getId(lemmaId) {
    let idArr = []
    const res = await db.collection('start-friends').where({
        lemmaId,
    }).field({
        lemmaId: true,
        friends: true
    }).get()
    res.data.forEach(async item => {
        item.friends.forEach(async child => {
            idArr.push(child.lemmaId)
            let brr = await getId(child.lemmaId)
            idArr.push(...brr)
        })
    })
    return idArr
}

exports.main = async (event, context) => {
    //event为客户端上传的参数
    console.log('event : ', event)

    const res = await db.collection('start-friends').where({
        lemmaTitle: /^朴.*/
    }).field({
        lemmaId: true
    }).get()

    res.data.forEach(ss => {
        let id = ss.lemmaId
        const removeRes = db.collection('start-friends').where({
            lemmaId: id
        }).remove()
    })


    // db.collection('start-friends').where({
    //     lemmaTitle:title
    // }).remove()

    //返回数据给客户端
    return event
};