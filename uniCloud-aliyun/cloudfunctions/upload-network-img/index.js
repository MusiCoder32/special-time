'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
     // const networkImameUrl = JSON.parse(event.body).url
    const networkImameUrl = 'https://bkimg.cdn.bcebos.com/smart/1ad5ad6eddc451da81cb2f591faa4566d01609249470-bkimg-process,v_1,rw_1,rh_1,maxl_216,pad_1,color_ffffff?x-bce-process=image/format,f_auto'
    // uni.downloadFile({
    //     url:networkImameUrl,
    //     success(upRes) {
    //         const tempFilePath = upRes.tempFilePath;
    //         console.log(tempFilePath,44444)
    //     }
    // })
    
          const result = await uniCloud.uploadFile({
            filePath: networkImameUrl,
            cloudPath: 'test.jpg',
            onUploadProgress: function(progressEvent) {
              console.log(progressEvent);
              var percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
            }
          });
          console.log(result);
    

    
	
	//返回数据给客户端
	return event
};
