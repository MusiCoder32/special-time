'use strict';
const db = uniCloud.database();
const collection = db.collection('special-days-share')
const $ = db.command.aggregate


exports.main = async (event, context) => {
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
};