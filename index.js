const express = require('express')
const app = express();
const port = 8080;
const fs = require('fs');
const db = require('./db/index.js');
var WebSocket = require('ws');
// const schedule = require('node-schedule');
const cookieParser = require("cookie-parser");  
const bodyParser = require('body-parser');
const apiClient = require('./util/axios.js'); // 导入自定义的 Axios 实例

// const { exec } = require('child_process');

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

// 查询一遍用户表
const queryUser = (req, callback) => {
  db.query(`select id,username,password from users where username = '${req.body.user_name}'`, [], callback);
}

// 请求前端目录
app.get('/frontend_technology_catalog', (req, res) => {
  const data = [];
  db.query(`select ${'`key`'},title from article where type = 'front'`, [], (result) => {
    result.forEach(element => {
      data.push({
        key: element.key,
        label: element.title,
      }) 
    });
    res.send({
      code: 0,
      message: '请求成功',
      data: data,
    });
  });
})
// 根据key请求前端技术内容
app.get('/frontend_content/:contentId', (req, res) => {
  const { contentId } = req.params;
    db.query(`select content,title from article where ${'`key`'} = ${contentId}`, [], (result) => {
      console.log(result, 'resultresult')
      if (!result.length) {
        res.send({
          code: 0,
          message: '请求成功',
          data: {title: '', content: ''},
        });
      } else {
        res.send({
          code: 0,
          message: '请求成功',
          data: {title: result[0].title, content: result[0].content},
        });
      }
    });
});

app.post('/save_content', (req, res) => {
  const { id, content, title, type } = req.body;
  if (id) {
    db.query(`update article set content='${content}', title='${title}', type='${type}' where ${'`key`'} = ${id}`, [], function(results, fields) {
      res.send({code: 0, message: '保存成功', data: {id}});
      });
  } else {
    let key = (new Date()).getTime();
    db.query(`insert into article (type, title, content, ${'`key`'})
      values ('${type}','${title}','${content}','${key}')`, [], function (results, fields) {
        res.send({code: 0, message: '保存成功', data: {id: key}});
      })
  }
});

app.post('/delete_content', (req, res) => {
  const { id } = req.body;
  if (id) {
    db.query(`delete from article where ${'`key`'} = ${id}`, [], function(results, fields) {
        res.send({code: 0, message: '删除成功', data: {id}});
      });
  }
});
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
    db.query(`insert into users (username, password)
      values ('李白', '272320')`, [], function (results, fields) {
        console.log(results, fields)
      })
  });
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

app.get('/news', (req, res) => {
  db.query(`select * from news`, [], (result) => {
    const data = result.map(r => {
      const {title, href, img} = r
      return {
        title,
        href,
        img
      }
    })
    res.send({
      code: 0,
      message: '请求成功',
      data,
    });
  });
});

app.get('/weather', (req, res) => {
  db.query(`select * from weather_data`, [], (result) => {
    res.send({
      code: 0,
      message: '请求成功',
      data: result[0],
    });
  });
});

app.get('/stock_price', (req, res) => {
  db.query(`select * from stock_info`, [], (result) => {
    const data = result.map(r => {
      delete r.id;
      return r;
    })
    res.send({
      code: 0,
      message: '请求成功',
      data,
    });
  });
});

app.post('/wenxinworkshop', (req, res) => {
  const { messages } = req.body;
  apiClient.post('/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=24.4cdd94cd61a959652b52538642ee3d1d.2592000.1700815691.282335-41731833', {
    "messages": messages
  }).then(response => {
    res.send({code: 0, message: '请求成功', data: {result: response.data.result || '抱歉，可以把问题描述的在完整一些么'}});
  }).catch((err) => {
    res.send({code: -1, message: '请求失败', data: {result: '服务超时', err,}});
  })
});

const titleRegex = /<title>(.*?)<\/title>/;
const iconRegex = /<link[^>]*(rel=["']icon["']|rel=["']shortcut icon["'])[^>]*href=["']([^"']+)["']/g;
app.get('/get_title_icon', (req, res) => {
  const { src } = req.query;
  apiClient.get(src).then(response => {
    const html = response.data;
    const match_title = html.match(titleRegex);
    const match_icon = html.match(iconRegex);
    const data = {
      title: match_title[1],
    }
    if (match_icon) {
        // 匹配到的图标链接存储在matches数组中
        for (var i = 0; i < match_icon.length; i++) {
            // 提取href属性的值
            let iconLink = match_icon[i].match(/href=["']([^"']+)["']/)[1];
            // if () {}
            // 检查图标链接是否包含 http
            if (!iconLink.match(/^http/)) {
                var srcURL = new URL(src);
                // 如果不包含协议和域名，添加 src 的协议和域名
                if (iconLink.charAt(0) === '/') {
                    // 如果图标链接以斜杠开头，直接拼接协议和域名
                    iconLink = srcURL.protocol + "//" + srcURL.host + iconLink;
                } else {
                    // 否则，将协议和域名添加到图标链接的前面
                    iconLink = src + "/" + iconLink;
                    iconLink = srcURL.protocol + "//" + srcURL.host +'/'+ iconLink;
                }
            }
            data.icon = iconLink
        }
    } else {
        console.log("未找到图标链接");
    }
    res.send({code: 0, message: '请求成功', data});
  }).catch((err) => {
    res.send({code: 1, message: '请求失败', data: err});
  })
});


// 24.4cdd94cd61a959652b52538642ee3d1d.2592000.1700815691.282335-41731833




// apiClient.post('/oauth/2.0/token?grant_type=client_credentials&client_id=RAzDbN1aPg2vzpTEA1qZTyPB&client_secret=5vbU1fqGtXqiQbjNe81xavuQ8Tedh6fA').then((res) => {
//   console.log(res);
// })
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
