// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
module.exports = {
	_before: function () { // 通用预处理器

	},
	/**
	 * method1方法描述
	 * @param {string} param1 参数1描述
	 * @returns {object} 返回值描述
	 */
	async add(params) {
		// 参数校验，如无参数则不需要
		if (!params) {
			return {
				errCode: 'PARAM_IS_NULL',
				errMsg: '参数不能为空'
			}
		}
		const db = uniCloud.database();
		const startEndTime = db.collection('start-end-time')
		const res = await startEndTime.add(params)
		// 业务逻辑
		
		// 返回结果
		return res
	}
}
