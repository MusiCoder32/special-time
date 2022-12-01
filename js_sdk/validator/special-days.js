// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "name": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "名称",
    "label": "名称"
  },
  "time": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "timestamp"
      }
    ],
    "title": "日期",
    "label": "日期"
  },
  "type": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      },
      {
        "range": [
          {
            "text": "纪念日",
            "value": 0
          },
          {
            "text": "生日",
            "value": 1
          },
          {
            "text": "提醒日",
            "value": 2
          }
        ]
      }
    ],
    "title": "类型",
    "defaultValue": 0,
    "label": "类型"
  }  ,
  "lunar": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      },
      {
        "range": [
          {
            "text": "公历",
            "value": 0
          },
          {
            "text": "农历",
            "value": 1
          }
        ]
      }
    ],
    "title": "日期类型",
    "defaultValue": 0,
    "label": "日期类型"
  }
}

const enumConverter = {
  "type_valuetotext": {
    "0": "纪念日",
    "1": "生日",
    "2": "提醒日",
  }
}

export { validator, enumConverter }
