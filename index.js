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
app.use(bodyParser.json({limit: '10mb'}));
app.use(express.json()) // for parsing application/json
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))

app.all('*',function(req,res,next){
  res.header('Access-Control-Allow-Origin', '*');//的允许所有域名的端口请求（跨域解决）
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // 允许发送身份凭证（如 cookies）
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

let access_token = '24.3a752bad7b97f23cc087b70c182b2852.2592000.1705200589.282335-41731834';
// let access_token = '24.4cdd94cd61a959652b52538642ee3d1d.2592000.1700815691.282335-41731833';
app.post('/wenxinworkshop', (req, res) => {
  const { messages } = req.body;
  apiClient.post('/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=' + access_token, {
    "messages": messages
  }).then(response => {
    const { error_code } = response.data;
    if (error_code && error_code === 111) {
      apiClient.post('/oauth/2.0/token?client_id=RAzDbN1aPg2vzpTEA1qZTyPB&client_secret=5vbU1fqGtXqiQbjNe81xavuQ8Tedh6fA&grant_type=client_credentials').then((r) => {
        access_token = r.data.access_token;
        console.log('认证过期', new Date())
        res.send({code: 0, message: '请求成功', data: {result: '抱歉，可以把问题描述的在完整一些么'}});
      })
      return;
    }
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
app.use(express.static('public'))

// 登录window11

// 查询window11用户 win11_user_name win11_avatar_img win11_telephone_number
const queryWin11User = (req, callback) => {
  db.query(`select * from win11_users where win11_user_name = '${req.body.user_name}'`, [], callback);
}

function generatePhoneNumber() {
  var phoneNumber = "1";
  for (var i = 0; i < 10; i++) {
    phoneNumber += Math.floor(Math.random() * 10);
  }
  return phoneNumber;
}


// 登录请求 如果存在直接登录，如果不存就直接注册
app.post('/win11_login', (req, res) => {
  queryWin11User(req, function (results, fields) {
    if (!results.length) {
      var phoneNumber = generatePhoneNumber();
      db.query(`insert into win11_users (win11_user_name, win11_avatar_img, win11_telephone_number)
        values ('${req.body.user_name}', '', ${phoneNumber})`, [], function (results, fields) {
          res.send({code: 0, message: '注册成功', data: {
            user_name: req.body.user_name,
            avatar_img: '',
            telephone_number: phoneNumber,
          }})
        })
      return;
    } else {
      res.send({code: 0, message: '登录成功', data: results[0]})
    }
  })
});

app.post('/change_avatar_img', (req, res) => {
  const { user_name, avatar_img, telephone_number } = req.body
    // 解码图片数据
  const base64Data = avatar_img.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // 保存为文件
  const filename = new Date().getTime()+'.jpg'; // 设置文件名
  fs.writeFileSync(`./public/avatar_img/${filename}`, buffer);
  db.query(`update win11_users set win11_avatar_img='http://152.136.52.163:8080/avatar_img/${filename}' where  win11_user_name='${user_name}'`, [], function(results, fields) {
    res.send({code: 0, message: '修改成功', data: {
      user_name: user_name,
      avatar_img: `http://152.136.52.163:8080/avatar_img/${filename}`,
      telephone_number: telephone_number,
    }})
  });
});

app.get('/avatar_of_telephone_number', (req, res) => {
  const { telephone_number } = req.query;
  db.query(`select * from win11_users where win11_telephone_number = '${telephone_number}'`, [], (result) => {
    if (result.length) {
      res.send({code: 0, message: '请求成功', data: result[0]});
    } else {
      res.send({code: 1, message: '暂无数据', data: {}});
    }
  })
});
app.get('/userinfo_of_teleorname', (req, res) => {
  const { telephone_number, user_name } = req.query;
  if (telephone_number) {
    db.query(`select * from win11_users where win11_telephone_number = '${telephone_number}'`, [], (result) => {
      if (result.length) {
        res.send({code: 0, message: '请求成功', data: result[0]});
      } else {
        res.send({code: 1, message: '暂无数据', data: {}});
      }
    })  
  }
  if (user_name) {
    db.query(`select * from win11_users where win11_user_name = '${user_name}'`, [], (result) => {
      if (result.length) {
        res.send({code: 0, message: '请求成功', data: result[0]});
      } else {
        res.send({code: 1, message: '暂无数据', data: {}});
      }
    })
  }
})


app.post('/add_contact', (req, res) => {
  const { user_name, avatar_img, telephone_number, contact_name, remarks } = req.body
  db.query(`INSERT INTO win11_contacts (remarks, avatar_img, telephone_number, contact_name, user_name)
    VALUES ('${remarks}', '${avatar_img}', '${telephone_number}', '${contact_name}', '${user_name}')`, [], (result) => {
    res.send({code: 0, message: '添加成功', data: {}});
  })
});

app.get('/contacts', (req, res) => {
  const { user_name } = req.query;
  db.query(`select * from win11_contacts where user_name = '${user_name}'`, [], (result) => {
    if (result.length) {
      res.send({code: 0, message: '获取成功', data: result});
    } else {
      res.send({code: 1, message: '暂无数据', data: []});
    }
  })
});

app.post('/add_callrecord', (req, res) => {
  const { caller, receiver, start_time, duration, connected } = req.body
  db.query(`INSERT INTO call_records (caller, receiver, start_time, duration, connected)
    VALUES ('${caller}', '${receiver}', '${start_time}', '${duration}', '${connected}')`, [], (result) => {
    res.send({code: 0, message: '添加成功', data: {}});
  })
});

app.get('/call_record', (req, res) => {
  const { telephone_number } = req.query
  db.query(`SELECT * FROM call_records WHERE caller = '${telephone_number}'  OR receiver = '${telephone_number}';`, [], (result) => {
    res.send({code: 0, message: '获取成功', data: result});
  })
});

app.get('/store_slider', (req, res) => {
  const { type } = req.query
  db.query(`SELECT * FROM store_slider WHERE type = '${type}'`, [], (result) => {
    res.send({code: 0, message: '获取成功', data: result});
  })
})

app.get('/store_apps', (req, res) => {
  const { type } = req.query;
  if (type === 'home') {
    db.query('SELECT * FROM store_apps', [], (result) => {
      const data = {
        // essential: [],
        // productivity: [],
        // music_streaming: [],
        // creativity: [],
      };
      if (result && result.length) {
        result.forEach(item => {
          if (!data[item.type]) data[item.type] = [];
          if (item.desc && item.type === 'creativity') {
            data[item.type].push(item);
            return;
          }
          if (data[item.type].length < 9) {
            data[item.type].push(item);
          }
        });
        res.send({code: 0, message: '获取成功', data: data});
      } else {
        res.send({code: 1, message: '获取失败', data: {}});
      }
    })
  }
})
app.get('/store_games', (req, res) => {
  const { type } = req.query;
  if (type === 'home') {
    db.query('SELECT * FROM store_games', [], (result) => {
      const data = {
        // new_notavlepc: [],
        // top_grossing_game: [],
      };
      if (result && result.length) {
        result.forEach(item => {
          if (!data[item.type]) data[item.type] = [];
          if (data[item.type].length < 9) {
            data[item.type].push(item);
          }
        });
        res.send({code: 0, message: '获取成功', data: data});
      } else {
        res.send({code: 1, message: '获取失败', data: {}});
      }
    })
  }
})
app.get('/store_movies', (req, res) => {
  const { type } = req.query;
  if (type === 'home') {
    db.query('SELECT * FROM store_movies', [], (result) => {
      const orMap = {
        new_movies: 9,
        action_adventure: 3,
        kids_family: 3,
        drama: 3,
        comedy: 3,
        top_selling: 3,
        top_selling_tv: 3,
      }
      const data = {};
      if (result && result.length) {
        result.forEach(item => {
          if (orMap[item.type]) {
            !data[item.type] ? data[item.type] = [item] : data[item.type].push(item);
            orMap[item.type] = orMap[item.type] - 1;
          }
        });
        res.send({code: 0, message: '获取成功', data: data});
      } else {
        res.send({code: 1, message: '获取失败', data: {}});
      }
    })
  }
})
// 用于视频对话的websocket
const clients = {}
var wss = new WebSocket.Server({ port: 8081 });
wss.on('connection', function connection(ws) {
  clients[ws._protocol] = ws;
  clients[ws._protocol].on('message', function incoming(message) {
    const bufferdata = message.toString('utf-8');
    const { target, data } = JSON.parse(bufferdata);
    // console.log(target, data.type)
    if (clients[target]) {
      clients[target].send(JSON.stringify(data));
    }
  });
});
app.listen(port, () => {
  console.log(`正在监听${port}端口`);
})
