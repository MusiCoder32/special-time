'use strict'
//OpenAI SDK、uniCloud.httpclient.request方式 二选一。云函数中访问失败，改为前端直接请求
// const {
//  Configuration,
//  OpenAIApi
// } = require("openai");

exports.main = async (event, context) => {
    //event为客户端上传的参数
    console.log('event : ', event)
    // const configuration = new Configuration({
    //  apiKey: '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',
    // });
    // const openai = new OpenAIApi(configuration);
    // const {
    //  data: {
    //      choices
    //  },
    //  status,
    //  statusText
    // } = await openai.createCompletion({
    //  model: "text-davinci-003",
    //  prompt: `input:${event.body}?
    //   output:`,
    //  max_tokens: 300,
    //  temperature: 1,
    //  stop: ['output:']
    // });
    const YOUR_API_KEY = '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'
    // const {
    //     data: { choices },
    //     status,
    //     statusText,
    // } = await uniCloud.httpclient.request('https://api.openai.com/v1/chat/completions', {
    //     method: 'POST',
    //     data: {
    //         // GPT-3 模型。详细介绍请参考：https://platform.openai.com/docs/models/overview
    //         model: 'gpt-3.5-turbo',
    //         messages: [{ role: 'user', content: 'Hello!' }],
    //         max_tokens: 300,
    //         temperature: 0.6,
    //         stop: ['output:'],
    //     },
    //     headers: {
    //         Authorization: `Bearer ${YOUR_API_KEY}`,
    //     },
    //     timeout: 10000,
    //     contentType: 'json', // 指定以application/json发送data内的数据
    //     dataType: 'json', // 指定返回值为json格式，自动进行parse
    // })
    //返回数据给客户端
    return {
        YOUR_API_KEY
    }
}
