// article.schema.ext.js
module.exports = {
    trigger: {
        beforeUpdate: async function ({ collection, operation, where, updateData, clientInfo } = {}) {
            const id = where && where._id
            if (typeof id === 'string') {
                updateData.update_date = Date.now() // 更新数据的update_date字段赋值为当前服务器时间
            }
        },
    },
}
