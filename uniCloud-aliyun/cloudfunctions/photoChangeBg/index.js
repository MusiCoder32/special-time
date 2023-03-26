'use strict';

// 云函数入口文件
const cv = require('opencv4nodejs')

// 云函数入口函数
exports.main = async (event, context) => {
  // 加载证件照片
  const image = cv.imdecode(Buffer.from(event.image))

  // 生成背景图片
  const background = new cv.Mat(image.rows, image.cols, cv.CV_8UC3, [0, 0, 255])

  // 将证件照片转换成灰度图像
  const grayImage = image.cvtColor(cv.COLOR_BGR2GRAY)

  // 使用Canny算子进行边缘检测
  const edges = grayImage.canny(100, 200)

  // 将边缘检测结果转换成二值图像
  const binaryEdges = edges.threshold(0, 255, cv.THRESH_BINARY)

  // 创建掩膜
  const mask = binaryEdges.cvtColor(cv.COLOR_GRAY2BGR)

  // 反转掩膜
  const invertedMask = mask.bitwiseNot()

  // 应用掩膜到证件照片
  const maskedImage = image.bitwiseAnd(mask)

  // 应用掩膜到背景图片
  const maskedBackground = background.bitwiseAnd(invertedMask)

  // 合并证件照片和背景图片
  const finalImage = maskedImage.add(maskedBackground)

  // 将结果转换成base64编码的字符串
  const result = cv.imencode('.jpg', finalImage).toString('base64')

  // 返回结果
  return {
    result
  }
}
