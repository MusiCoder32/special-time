//使用express构建web服务器 --11:25
const express = require('express');

const bodyParser = require('body-parser');
const cors=require('cors')
/*引入路由模块*/
var index=require("./routes/index");

var app = express();
var server = app.listen(8000);
//使用body-parser中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//托管静态资源到public目录下
app.use(express.static('public'));

/*使用路由器来管理路由*/
app.use(cors({
  // origin:"http://localhost:8080",
		 origin:"*",
    credentials:true
}));
app.use("/index",index);

