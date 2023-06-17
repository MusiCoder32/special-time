import CryptoJS from 'crypto-js'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { encode } from './code'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

const APPID = '18e5d49f'
const APISecret = 'NGM0MGI2ZmUzYWYyYmJkYzE1ZjkzM2Y3'
const APIKey = '236d07ab2df56510e591fb24daf5e2c5'
const host = 'spark-api.xf-yun.com'

//鉴权url
export function getAuthorizationUrl() {
    //获取鉴权时间 date
    const RFC1123_FORMAT = 'ddd, DD MMM YYYY HH:mm:ss [GMT]'
    const date = dayjs().utc().format(RFC1123_FORMAT)
    console.log('rfc1123', date)

    //拼接生成字符串tmp
    const tmp = `host: ${host}\ndate:${date}\nGET /v1.1/chat HTTP/1.1` //注意空格必须保留

    //tmp加密获取smp_sha
    const hash = CryptoJS.HmacSHA256(tmp, APISecret)

    //tmp_sha进行base64编码生成signature
    const signature = CryptoJS.enc.Base64.stringify(hash)
    console.log('signature', signature)

    //获得 authorization_origin
    const authorization_origin = `api_key="${APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    console.log('authorization_origin', authorization_origin)
    //获得authorization
    const authorization = encode(authorization_origin)
    console.log('authorization', authorization)
    //获取httpurl
    const params = encodeURIComponent(`authorization=${authorization}&date=${date}&host=${host}`)
    return `wss://spark-api.xf-yun.com/v1.1/chat?authorization=${encodeURIComponent(
        authorization,
    )}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}}`
}
