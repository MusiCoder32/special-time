'use strict'
exports.main = async (event, context) => {
    //event为客户端上传的参数
    const category = ['热点日期','明星相关','著名人物', '传统节日', '国际节日']

    //返回数据给客户端
    return category
}
