const express = require('express')
const app = express();
const port = 8080;
const fs = require('fs');
// const db = require('./db/index.js');
var WebSocket = require('ws');
const cookieParser = require("cookie-parser");  
const bodyParser = require('body-parser');


// 添加 body-parser 中间件
app.use(bodyParser.json());
app.use(express.json()) // for parsing application/json
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))
app.all('*',function(req,res,next){
  res.header('Access-Control-Allow-Origin', '*');//的允许所有域名的端口请求（跨域解决）
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
})
const key2name = {
  1694139351660: '变量提升：JavaScript是按顺序执行的么？',
  1694139597109: '参透了浏览器的工作原理，可以解决80%的难题',
  1694139632055: 'Chrome架构：仅仅打开了1个页面，为什么有4个进程',
}
// 查询一遍用户表
const queryUser = (req, callback) => {
  db.query(`select id,username,user_password,user_type from medicine_users where username = '${req.body.user_name}'`, [], callback);
}
// 第一次测试使用的get请求
app.get('/first', (req, res) => {
  res.send({code: 0, message: '请求成功', name: '李白', age: 17});
});
// 请求前端目录
app.get('/frontend_technology_catalog', (req, res) => {
  const data = [];
  for (key in key2name) {
    data.push({
      key,
      label: key2name[key],
    }) 
  }
  res.send({
    code: 0,
    message: '请求成功',
    data: data,
  });
})
// 根据key请求前端技术内容
app.get('/frontend_content/:contentId', (req, res) => {
  const { contentId } = req.params;
  fs.readFile(`./public/frontend/${contentId}.md`, 'utf8', (err, data) => {
    if (err) {
      console.error('读取文件错误', err);
      res.status(500).send('读取文件错误');
      return;
    }

    // 将文件内容作为响应发送给客户端
    res.send({
      code: 0,
      message: '请求成功',
      data: data,
    });
  });
})
// 登录请求
app.post('/login', (req, res) => {
  queryUser(req, function (results, fields) {
    if (!results.length) {
      res.status(402).send({code: 2, message: '该用户不存在'})
      return;
    }
    if (results[0].user_password === req.body.pass_word) {
      res.send({code: 0, message: '登录成功', data: results[0]})
      return;
    } else {
      res.status(402).send({code: 1, message: '密码错误'})
    }
  })
});
// 注册账号
app.post('/register', (req, res) => {
  queryUser(req, (results, fields) => {
    if (results.length) {
      res.status(401).send({code: 1, message: '该用户已存在'})
      return;
    };    
    db.query(`insert into medicine_users (username, user_type, user_password, members_point)
    values ('${req.body.user_name}', '0', '${req.body.pass_word}', 0)`, [], function (results, fields) {
      res.send({code: 0, message: '注册成功', data: {user_name: req.body.user_name, pass_word: req.body.pass_word}});
    })
  })
});
// 注销账号
app.post('/delete_user', (req, res) => {
  db.query(`delete from medicine_users where id = ${req.body.user_id}`, [], function(results, fields) {
    res.send({code: 0, message: '注销成功', data: results || {}});
  });
});
// 修改密码
app.post('/edit_user', (req, res) => {
  db.query(`update medicine_users set user_password='${req.body.pass_word}' where id = ${req.body.user_id}`, [], function(results, fields) {
    res.send({code: 0, message: '修改成功', data: results || {}});
  });
});
let count = 1;
// 修改密码
app.post('/scdd', (req, res) => {
  res.status(200).send({code: 0, message: '成功'});
  // console.log(req.body.data);
  console.log(JSON.parse(Buffer.from(req.body.data, 'base64').toString()));
  console.log(count++);
});
// app.use(express.static('public'))
// var wss = new WebSocket.Server({ port: 8081 });
// wss.on('connection', function connection(ws) {
  // console.log('server: receive connection.');
  
  // ws.on('message', function incoming(message) {
  //     console.log('server: received: %s', message);
  // });

  // setInterval(() => {
  //   ws.send('李白')
  // }, 1000);
// });
app.listen(port, () => {
  console.log(`正在监听${port}端口`);
})
