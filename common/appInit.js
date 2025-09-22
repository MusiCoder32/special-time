
const db = uniCloud.database()
export default async function () {



	//clientDB的错误提示
	function onDBError(errObj) {
		// 错误码详见https://uniapp.dcloud.net.cn/uniCloud/clientdb?id=returnvalue
		const {
			code,
			message
		} = errObj
		errObj.message = errObj.message.replace("数据库验证失败：", "")
		console.log('onDBError', {
			code,
			message
		});
		// 处理错误
		console.error(code, message);
	}
	// 绑定clientDB错误事件
	db.on('error', onDBError)
}
