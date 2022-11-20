import dayjs from 'dayjs'
import calendar from './calendar'

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

//获取出生年龄，周岁、月、天、时、分、秒
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
        '天 ' +
        (gapHour < 10 ? '0' + gapHour : gapHour) +
        '时 ' +
        (gapMinute < 10 ? '0' + gapMinute : gapMinute) +
        '分 ' +
        (gapSecond < 10 ? '0' + gapSecond : gapSecond) +
        '秒'
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

export function arriveDay(time) {
    const dayObject = dayjs(time)
    const currentDay = dayjs()

    const date = dayObject.date()
    const month = dayObject.month() + 1
    const year = currentDay.year()
    const thatTime = dayjs(`${year}-${month}-${date}`)
    if (currentDay.isBefore(thatTime, 'day') || currentDay.isSame(thatTime, 'day')) {
        return thatTime.diff(currentDay, 'day')
    }
    return thatTime.add(1, 'year').diff(currentDay, 'day')
}

export function setTime(timestamp, lunar,leap=false) {
    const currentDate = dayjs(timestamp)
    const date = currentDate.date()
    const month = currentDate.month() + 1
    const year = currentDate.year()
    const method = lunar ? 'lunar2solar' : 'solar2lunar'
    return calendar[method](year, month, date,leap)
}