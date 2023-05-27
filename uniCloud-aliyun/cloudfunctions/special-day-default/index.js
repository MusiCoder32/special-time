'use strict'

function shuffle(array){
    let res = [], random;
    while(array.length>0){
        random = Math.floor(Math.random()*array.length);
        res.push(array[random]);
        array.splice(random, 1);
    }
    return res;
}

exports.main = async (event, context) => {
    const SpecialDayType = {
        纪念日: 0,
        生日: 1,
        提醒日: 2,
    }
    const LunarType = {
        公历: 0,
        农历: 1,
    }
    const days = [
        {
            type: SpecialDayType['生日'],
            lunar: LunarType['公历'],
            name: '祖国母亲',
            time: -639100800000,
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['公历'],
            name: '改革开放',
            time: 281923200000,
        },
        {
            type: SpecialDayType['提醒日'],
            lunar: LunarType['公历'],
            name: '坐着高铁去台湾',
            time: 2082672000000,
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['公历'],
            name: '相遇的那个夏天',
            time: new Date('2019-7-21').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['公历'],
            name: '我们结婚啦',
            time: new Date('2020-8-11').getTime(),
        },
        {
            type: SpecialDayType['生日'],
            lunar: LunarType['公历'],
            name: '大宝',
            time: new Date('2022-2-15').getTime(),
        },
        {
            type: SpecialDayType['生日'],
            lunar: LunarType['公历'],
            name: '二宝',
            time: new Date('2023-2-15').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['农历'],
            name: '春节',
            time: new Date('1949-1-1').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['农历'],
            name: '春节',
            time: new Date('1949-1-1').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['公历'],
            name: '五一',
            time: new Date('1949-5-1').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['农历'],
            name: '端午',
            time: new Date('1949-5-5').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['农历'],
            name: '520恋爱',
            time: new Date('1949-5-20').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['农历'],
            name: '七夕',
            time: new Date('1949-7-7').getTime(),
        },
        {
            type: SpecialDayType['纪念日'],
            lunar: LunarType['公历'],
            name: '元旦',
            time: new Date('1949-1-1').getTime(),
        },
    ]

    //返回数据给客户端
    return shuffle(days)
}
