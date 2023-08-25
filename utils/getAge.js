import dayjs from 'dayjs'
import { lunar2solar, solar2lunar } from './calendar'
import { SpecialDayType } from '@/utils/emnu'


export function totalDay(time) {
    return dayjs().diff(time, 'day')
}

export function getAge(birthDay, lunar = false, leap = false) {
    birthDay = dayjs(birthDay)
    let birthDayAllObj

    if (lunar) {
        birthDayAllObj = lunar2solar(birthDay.year(), birthDay.month() + 1, birthDay.date(), leap)
    } else {
        birthDayAllObj = solar2lunar(birthDay.year(), birthDay.month() + 1, birthDay.date(), leap)
    }
    const { lYear, lMonth, lDay, IMonthCn, IDayCn, cYear, cMonth, cDay } = birthDayAllObj
    const currentDay = dayjs(dayjs().format('YYYY-MM-DD 00:00:00'))
    let currentBirthDay
    let preBrithDay
    let nextBirthDay
    let remainDay = 0
    let oneBirthTotalDay
    const year = currentDay.year()
	
	const solarTime =  dayjs(`${cYear}-${cMonth}-${cDay}`).format('YYYY-MM-DD 00:00:00')
	const allDay = currentDay.diff(solarTime,'day')

    if (lunar) {
        const currentBirthLunarDay = lunar2solar(year, lMonth, lDay) //过生日时不按闰月过，故无需传入leap
        currentBirthDay = dayjs(
            `${currentBirthLunarDay.cYear}-${currentBirthLunarDay.cMonth}-${currentBirthLunarDay.cDay} 00:00:00`,
        )
        const preBirthLunarDay = lunar2solar(year - 1, lMonth, lDay)
        preBrithDay = dayjs(`${preBirthLunarDay.cYear}-${preBirthLunarDay.cMonth}-${preBirthLunarDay.cDay} 00:00:00`)
        const nextBirthLunarDay = lunar2solar(year + 1, lMonth, lDay)
        nextBirthDay = dayjs(
            `${nextBirthLunarDay.cYear}-${nextBirthLunarDay.cMonth}-${nextBirthLunarDay.cDay} 00:00:00`,
        )
    } else {
        currentBirthDay = dayjs(`${year}-${cMonth}-${cDay} 00:00:00`)
        preBrithDay = dayjs(`${year - 1}-${cMonth}-${cDay} 00:00:00`)
        nextBirthDay = dayjs(`${year + 1}-${cMonth}-${cDay} 00:00:00`)
    }
    const currentYearBirthDiff = currentDay.diff(currentBirthDay, 'day')
    let result = {}
    if (currentYearBirthDiff === 0) {
        oneBirthTotalDay = nextBirthDay.diff(currentBirthDay, 'day')
        result = {
            aYear: year - cYear,
            aMonth: 0,
            remainDay: 0,
            oneBirthTotalDay,
        }
    } else if (currentYearBirthDiff < 0) {
        //今年生日还没到，当前日期与去年生日相比
        remainDay = -currentYearBirthDiff
        oneBirthTotalDay = currentBirthDay.diff(preBrithDay, 'day')
        result = {
            aYear: year - cYear - 1,
            aMonth: currentDay.diff(preBrithDay, 'month'),
            remainDay,
            oneBirthTotalDay, //上次生日到下次生日的总天数，若为农历，该值甚至会为380多
            nextBirthDay: currentBirthDay.format('YYYY-MM-DD'), //下个生日公历日期
        }
    } else {
        //今年生日过了，当前日期与今年生日相比
        oneBirthTotalDay = nextBirthDay.diff(currentBirthDay, 'day')
        result = {
            aYear: year - cYear,
            aMonth: currentDay.diff(currentBirthDay, 'month'),
            remainDay: oneBirthTotalDay - currentYearBirthDiff,
            oneBirthTotalDay,
            nextBirthDay: nextBirthDay.format('YYYY-MM-DD'),
        }
    }
    return { ...result, ...birthDayAllObj,allDay }
}

//时间换算成农历或公历日期对象
export function setTime(timestamp, lunar, leap = false) {
    const currentDate = dayjs(timestamp)
    const date = currentDate.date()
    const month = currentDate.month() + 1
    const year = currentDate.year()
    if (lunar) {
        return lunar2solar(year, month, date, leap)
    }
    return solar2lunar(year, month, date)
}

export function getDateDetails(date) {
    const result = { ...date }
    const { time, lunar, leap, type } = result
    if (type === SpecialDayType['提醒日']) {
        result.remainDay = dayjs(time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'days')
        result.normalTime = dayjs(time).format('YYYY-MM-DD')
    } else {
        const { allDay, remainDay, aYear, cYear, cMonth, cDay, lYear, IMonthCn, IDayCn, nextBirthDay } = getAge(
            time,
            lunar,
            leap,
        )
        result.remainDay = remainDay
        result.age = aYear
        result.allDay = allDay
        result.nextBirthDay = nextBirthDay

        if (!lunar) {
            result.normalTime = `${cYear}-${cMonth}-${cDay}`
        } else {
            result.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
        }
    }
    return result
}
