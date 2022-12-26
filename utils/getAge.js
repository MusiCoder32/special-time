import dayjs from 'dayjs'
import { lunar2solar, solar2lunar } from './calendar'

//获取当月的天数
function getDaysOfMonth(dateStr) {
    let date = new Date(dateStr)
    let year = date.getFullYear()
    let mouth = date.getMonth() + 1
    let day = 0

    if (mouth == 2) {
        day = isLeapYear(year) ? 29 : 28
    } else if (mouth == 1 || mouth == 3 || mouth == 5 || mouth == 7 || mouth == 8 || mouth == 10 || mouth == 12) {
        day = 31
    } else {
        day = 30
    }
    return day
}

//判断是否为闰年
function isLeapYear(year) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

//获取出生年龄，周岁、月、天、时、分、秒 ,无法应对农历生日，废弃
export function getAgeAll(birthday) {
    if (!birthday) {
        return '00岁'
    }
    let now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth() + 1
    let day = now.getDate()
    let hour = now.getHours()
    let minute = now.getMinutes()
    let second = now.getSeconds()

    let myDate = new Date(birthday)
    let myYear = myDate.getFullYear()
    let myMonth = myDate.getMonth() + 1
    let myDay = myDate.getDate()
    let myHour = myDate.getHours()
    let myMinute = myDate.getMinutes()
    let mySecond = myDate.getSeconds()

    let gapSecond = second - mySecond
    if (gapSecond < 0) {
        minute -= 1
        gapSecond = 60 - mySecond + second
    }
    let gapMinute = minute - myMinute
    if (gapMinute < 0) {
        hour -= 1
        gapMinute = 60 - myMinute + minute
    }
    let gapHour = hour - myHour
    if (gapHour < 0) {
        day -= 1
        gapHour = 24 - myHour + hour
    }
    let gapDay = day - myDay
    if (gapDay < 0) {
        month -= 1
        gapDay = getDaysOfMonth(birthday) - myDay + day
    }
    let gapMonth = month - myMonth
    if (gapMonth < 0) {
        year -= 1
        gapMonth = 12 - myMonth + month
    }
    let gapYear = year - myYear
    if (gapYear < 0) {
        gapYear = 0
    }

    return (
        gapYear +
        '岁 ' +
        (gapMonth < 10 ? '0' + gapMonth : gapMonth) +
        '月 ' +
        (gapDay < 10 ? '0' + gapDay : gapDay) +
        '天 '
        // +
        // (gapHour < 10 ? '0' + gapHour : gapHour) +
        // '时 ' +
        // (gapMinute < 10 ? '0' + gapMinute : gapMinute) +
        // '分 ' +
        // (gapSecond < 10 ? '0' + gapSecond : gapSecond) +
        // '秒'
    )
}

//获取出生天数、时、分、秒
export function getGrowTime(birthday) {
    if (!birthday) {
        return '00天 00时 00分 00秒'
    }
    let currentTime = new Date().getTime()
    let myTime = new Date(birthday).getTime()
    let gapSec = parseInt((currentTime - myTime) / 1000)
    let day = 0
    let hour = 0
    let min = 0
    let sec = 0

    function compute() {
        if (gapSec / 3600 > 0) {
            hour = (gapSec - (gapSec % 3600)) / 3600
            gapSec = gapSec % 3600
            if (gapSec / 60 > 0) {
                min = (gapSec - (gapSec % 60)) / 60
                sec = gapSec % 60
            } else {
                sec = gapSec
            }
        } else {
            if (gapSec / 60 > 0) {
                min = (gapSec - (gapSec % 60)) / 60
                sec = gapSec % 60
            } else {
                sec = gapSec
            }
        }
    }

    if (gapSec / (60 * 60 * 24) > 0) {
        day = (gapSec - (gapSec % (60 * 60 * 24))) / (60 * 60 * 24)
        gapSec = gapSec % (60 * 60 * 24)
        compute()
    } else {
        compute()
    }
    return (
        (day < 10 ? '0' + day : day) +
        '天 ' +
        (hour < 10 ? '0' + hour : hour) +
        '时 ' +
        (min < 10 ? '0' + min : min) +
        '分 ' +
        (sec < 10 ? '0' + sec : sec) +
        '秒'
    )
}

export function totalDay(time) {
    return dayjs().diff(time, 'day')
}

export function totalYear(time) {
    return dayjs().diff(time, 'year')
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

    if (lunar) {
        const currentBirthLunarDay = lunar2solar(year, lMonth, lDay)
        currentBirthDay = dayjs(`${currentBirthLunarDay.cYear}-${currentBirthLunarDay.cMonth}-${currentBirthLunarDay.cDay} 00:00:00`)
        const preBirthLunarDay = lunar2solar(year - 1, lMonth, lDay)
        preBrithDay = dayjs(`${preBirthLunarDay.cYear}-${preBirthLunarDay.cMonth}-${preBirthLunarDay.cDay} 00:00:00`)
        const nextBirthLunarDay = lunar2solar(year + 1, lMonth, lDay)
        nextBirthDay = dayjs(`${nextBirthLunarDay.cYear}-${nextBirthLunarDay.cMonth}-${nextBirthLunarDay.cDay} 00:00:00`)
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
            oneBirthTotalDay,
        }
    } else {
        //今年生日过了，当前日期与今年生日相比
        oneBirthTotalDay = nextBirthDay.diff(currentBirthDay, 'day')
        result = {
            aYear: year - cYear,
            aMonth: currentDay.diff(currentBirthDay, 'month'),
            remainDay: oneBirthTotalDay - currentYearBirthDiff,
            oneBirthTotalDay,
        }
    }
    return { ...result, ...birthDayAllObj }
}

export function arriveDay(time, lunar = false) {
    const currentDay = dayjs(dayjs().format('YYYY-MM-DD 00:00:00'))
    const year = currentDay.year()
    let thatTime
    //农历生日算法
    if (lunar) {
        const { lMonth, lDay } = time
        //获取当年农历对应的公历日期
        const { cYear, cMonth, cDay } = lunar2solar(year, lMonth, lDay)
        const currentYearSolar = dayjs(`${cYear}-${cMonth}-${cDay}`)

        if (currentDay.isBefore(currentYearSolar, 'day')) {
            thatTime = dayjs(`${cYear}-${cMonth}-${cDay}`)
        } else if (currentDay.isSame(currentYearSolar, 'day')) {
            return 0
        } else {
            const { cYear, cMonth, cDay } = lunar2solar(year + 1, lMonth, lDay)
            thatTime = dayjs(`${cYear}-${cMonth}-${cDay}`)
        }
    } else {
        const dayObject = dayjs(time)
        const date = dayObject.date()
        const month = dayObject.month() + 1
        thatTime = dayjs(`${year}-${month}-${date}`)
    }
    if (currentDay.isBefore(thatTime, 'day')) {
        return thatTime.diff(currentDay, 'day')
    } else if (currentDay.isSame(thatTime, 'day')) {
        return 0
    }
    return thatTime.add(1, 'year').diff(currentDay, 'day') + 1
}

export function setTime(timestamp, lunar, leap = false) {
    const currentDate = dayjs(timestamp)
    const date = currentDate.date()
    const month = currentDate.month() + 1
    const year = currentDate.year()
    if (lunar) {
        return lunar2solar(year, month, date, leap)
    }
    return solar2lunar(year, month, date, leap)
}
