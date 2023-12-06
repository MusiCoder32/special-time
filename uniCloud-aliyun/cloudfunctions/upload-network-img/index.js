const axios = require('axios')
// const uniCloud = require('uni-cloud');

exports.main = async (event, context) => {
    // 图片的 URL
    // const imageUrl =
    // 	'https://bkimg.cdn.bcebos.com/smart/1ad5ad6eddc451da81cb2f591faa4566d01609249470-bkimg-process,v_1,rw_1,rh_1,maxl_216,pad_1,color_ffffff?x-bce-process=image/format,f_auto'

    const { imageUrl, lemmaId } = JSON.parse(event.body)

    try {
        // 获取网络图片数据
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
        })
        const imageData = Buffer.from(response.data, 'binary')

        // 上传图片至云储存
        const result = await uniCloud.uploadFile({
            cloudPath: `images/start/${lemmaId}/${Date.now()}.jpg`, // 云储存中的路径，可自定义:

            fileContent: imageData,
            cloudPathAsRealPath: true,
        })

        // 返回上传结果
        return {
            code: 200,
            message: 'File uploaded successfully',
            data: result,
        }
    } catch (error) {
        console.error('Error uploading file:', error.message)
        return {
            code: 500,
            message: 'File upload failed',
            error: error.message,
        }
    }
}
