import { isNaN } from 'lodash'
export enum SpecialDayType {
    纪念日,
    生日,
    提醒日,
    节日,
}

export const dayTypeOption = []

export enum LunarType {
    公历,
    农历,
}
export const lunarOption = []

export enum StartScene {
    朋友圈 = 1154,
    聊天分享 = 1007,
}

const optionArr = [
    {
        type: SpecialDayType,
        option: dayTypeOption,
    },
    {
        type: LunarType,
        option: lunarOption,
    },
]
optionArr.forEach((item) => {
    for (const key in item.type) {
        if (isNaN(+key)) {
            item.option.push({
                text: key,
                value: item.type[key],
            })
        }
    }
})
