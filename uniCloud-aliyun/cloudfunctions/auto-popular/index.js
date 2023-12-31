'use strict'

const dayjs = require('dayjs')
const db = uniCloud.database()
const collection = db.collection('special-days-share')
const $ = db.command.aggregate

async function getBirthdays() {
    const currentDay = dayjs().add(8, 'hour').format('MM-DD') // 服务器时区为0时区
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
                        timezone: '+08:00',
                    },
                },
            })
            .match({
                formattedDate: currentDay, // 替换成你需要的日期
                category: '明星相关',
            })
            .project({
                _id: 1, // 1显示字段，0不显示字段
                formattedDate: 1,
                poster: 1,
                time: 1,
                name: 1,
                lemmaId: 1,
                remark: 1,
                posterUpdated: 1,
            })
            .end()
            
            
            for (var i = 0; i < res.data.length; i++) {
                let item = res.data[i]
                if(!item.posterUpdated) {
                    let imgUrl = []
                    item.poster.forEach(item=>{
                        imgUrl.push(item.url)
                    })
                    const resDel = await uniCloud.deleteFile({
                         fileList:imgUrl
                     })
                     console.log(resDel);
                }
                
  
            }

        return {
            code: 200,
            data: res.data,
            currentDay,
            msg: '查询成功',
        }
    } catch (error) {
        return {
            code: 500,
            data: null,
            msg: '查询失败：' + error.message,
        }
    }
}

exports.main = async (event, context) => {
    const res = await getBirthdays()
    return res
}
