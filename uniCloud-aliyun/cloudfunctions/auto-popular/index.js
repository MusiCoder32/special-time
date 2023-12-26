'use strict';
const axios = require('axios')
const qs = require('qs')
const crypto = require('crypto');


const db = uniCloud.database();
const collection = db.collection('special-days-share')
const $ = db.command.aggregate

const appKey = 'red.kuugLilJ1TLbFruW'

const appSecret = 'b1b497f11eb7e1eaea101f3d5eaeef01'

const bookApi = {
    async getAccessToken() {
        const timestamp = new Date().getTime()
        const nonce = Math.random()
        const expires_in = timestamp + 12 * 60 * 60 * 1000
        const signature = sha256(qs.stringify({
            nonce,
            timeStamp:timestamp,
            appKey,
            appSecret,
        }))
        console.log(signature)
        const res = await axios({
            method: 'POST',
            url: 'https://edith.xiaohongshu.com/api/sns/v1/ext/access/token',
            data: JSON.stringify({
                app_key:appKey,
                nonce,
                timestamp,
                signature,
                expires_in
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        console.log(222,res)

    }
}


function sha256(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

async function getBirthdays() {
    try {
        const res = await collection
            .aggregate()
            .addFields({
                formattedDate: {
                    $dateToString: {
                        format: '%m-%d',
                        date: {
                            $add: [new Date('1970-01-01'), '$time'], // 假设你的时间戳字段为 timestampField
                        },
                    },
                },
            })
            .match({
                formattedDate: '01-01', // 替换成你需要的日期
            })
            .project({
                _id: 1, // 显示默认的 _id 字段
                formattedDate: 1, // 显示 formattedDate 字段
                name: 1, // 显示其他需要的字段，如果有的话
            })
            .end();
    
        return {
            code: 200,
            data: res.data,
            msg: '查询成功',
        };
    } catch (error) {
        return {
            code: 500,
            data: null,
            msg: '查询失败：' + error.message,
        };
    }
}

exports.main = async (event, context) => {
const res = await bookApi.getAccessToken()
console.log(res);
return {}
};