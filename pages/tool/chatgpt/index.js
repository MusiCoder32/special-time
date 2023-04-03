const express=require("express");
const axios = require('axios');
const decoder = new TextDecoder('UTF-8')

var router=express.Router();
router.post("/",(req,res)=>{
    const {messages} = req.body;
    const YOUR_API_KEY = 'YOUR_API_KEY'
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
            const allStr = decoder.decode(chunk)
            const urlStr = encodeURIComponent(allStr)
            const newBuffer = Buffer.from(urlStr)
            res.write(newBuffer);
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
