const express=require("express");
const axios = require('axios');
const decoder = new TextDecoder('UTF-8')

var router=express.Router();
router.post("/",(req,res)=>{
    const {messages} = req.body;
    const YOUR_API_KEY = 'YOUR_API_KEY'
    //可联系qq1403888190，获取在windows下，配置axios通过vpn代理请求，实现对chatgpt接口的访问的代码。
    //即通过windows本地的代理，在无需海外服务器的情况下，即可访问chatgpt，费用200元，先付费后提供，无法解决保证退费。
    axios.post('https://api.openai.com/v1/chat/completions',{
        model: 'gpt-3.5-turbo',
        messages,
        stream:true
    },{
        headers: {
            Authorization: `Bearer ${YOUR_API_KEY}`,
        },
        responseType: 'stream',
        timeout: 60 * 1000,
    }).then(result=>{
        const stream = result.data;
        res.set('Transfer-Encoding', 'chunked');
        stream.on('data', (chunk) => {
            const allStr = chunk.toString()
            const urlStr = encodeURIComponent(allStr)//解决中文乱码
            const newBuffer = Buffer.from(urlStr)
            res.write(newBuffer);//若无需解决小程序中文乱码问题，无需编码，可直接res.write(chunk)
        });
        stream.on('end', () => {
            res.end();
        });
    }).catch(e=>{
        res.send(JSON.stringify({
            code:500,
            message:'访问chatgpt失败，请稍后再试'
        }))
    })
})
module.exports=router;
