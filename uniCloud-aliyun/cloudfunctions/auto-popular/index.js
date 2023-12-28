'use strict'


const db = uniCloud.database()
const collection = db.collection('special-days-share')
const $ = db.command.aggregate

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
                        // timezone: '+08:00'
                    },
                },
            })
            .match({
                formattedDate: '01-31', // 替换成你需要的日期
            })
            .project({
                _id: 1, // 1显示字段，0不显示字段
                formattedDate: 1,
                poster:1,
                name: 1,
            })
            .end()

        return {
            code: 200,
            data: res.data,
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
