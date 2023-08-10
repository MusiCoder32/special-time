module.exports = {
    trigger: {
        beforeUpdate: async function({
            collection,
            operation,
            docId,
            updateData,
            clientInfo
        } = {}) {
            if (typeof docId === 'string') {
                updateData.update_date = Date.now() // 更新数据的update_date字段赋值为当前服务器时间
                if (!updateData.avatar) {
                    const db = uniCloud.database()
                    db.collection('special-days').doc(docId).update({
                        avatar: db.command.remove()
                    })
                }
            }
        },
    },
}