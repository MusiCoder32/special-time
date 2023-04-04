const reg = /\[{.*}]/g
axios
    .post('https://api.openai.com/v1/chat/completions', {
        messages,
    }, {
        responseType: 'steam',
        timeout: 60 * 1000,
        onDownloadProgress: (progressEvent) => {
            let arr = event.currentTarget.response.match(reg)
            let str = ''
            arr.forEach(item => {
                let arr = JSON.parse(item)
                str += (arr[0].delta.content || '')
            })
            console.log(str) //消息内容
        }
    })
    .then(response => {

    })
    .catch((e) => {
        console.log(e)
    })