const http = require('http')
const url = require('url')
const mysql = require('mysql')
const regExp = {
    usr: /^[a-zA-Z]{1}([a-zA-Z0-9]){5,11}$/,
    pass: /^(\w){6,12}$/
}
// 数据处理函数
let resolve = function (msg, callback, res, code) {
    const errData = JSON.stringify({code: code, msg: msg})
    // 是否为jsonp
    if (!callback) {
        res.write(errData)
    } else {
        res.write(callback + '(' + errData + ')')
    }
    res.end()
}
// 创建数据库
const db = mysql.createPool(
    {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'chat'
    }
)
const httpServer = http.createServer(function (req, res) {
        // request包含着客户端的请求地址
        /*req={
         url:'请求原始地址',
         headers:'http请求头',
         compelete:'是否请求完成'
         }*/
        // console.log(req.headers);
        // 由于url中可能带有参数，所以需要进行处理
        let {pathname, query} = url.parse(req.url, true)
        if (pathname == '/reg') {
            // 是注册的话，就会有用户名和密码这两个参数，再加上jsonp的回调函数
            let {callback, username, password} = query;
            // 进行数据校验：用户名是否符合规范？密码是否符合规范？用户名是否重复？最后把用户名添加到数据库
            if (!regExp.usr.test(username)) {
                // 用户名不符合规范
                resolve('用户名不符合规范', callback, res, 1);
            } else if (!regExp.pass.test(password)) {
                resolve('密码不符合规范', callback, res, 1);
            } else {
                // `'${username}'`的疑问
                db.query(`SELECT * FROM usr_tab WHERE username='${username}'`, (err, data) => {
                    if (err) {
                        resolve('查询数据库错误', callback, res, 1);
                    } else if (data.length > 0) {
                        resolve('用户名已存在', callback, res, 1);
                    } else {
                        db.query(`INSERT INTO usr_tab (username,password,online) VALUES ('${username}','${password}',0)`, err => {
                            if (err) {
                                resolve('添加时数据库错误', callback, res, 1);
                            } else {
                                resolve('注册成功', callback, res, 0);
                            }
                        })
                    }
                })
            }
        } else if (pathname == '/login') {
            let {callback, username, password} = query;
            if (!regExp.usr.test(username)) {
                resolve('用户名不符合规范', callback, res, 1);
            } else if (!regExp.pass.test(password)) {
                resolve('密码不符合规范', callback, res, 1);
            } else {
                db.query(`SELECT ID,password FROM usr_tab WHERE username='${username}'`, (err, data) => {
                        if (err) {
                            resolve('查询数据库错误', callback, res, 1);
                        } else if (data.length == 0) {
                            resolve('用户名不存在', callback, res, 1);
                        } else if (data[0].password != password) {
                            resolve('用户名或密码不正确', callback, res, 1);
                        } else {
                            db.query(`UPDATE usr_tab SET online=1 WHERE ID=${data[0].ID}`, err => {
                                if (err) {
                                    resolve('登录状态修改失败', callback, res, 1);
                                } else {
                                    resolve('登录成功', callback, res, 0);
                                }
                            })
                        }
                    }
                )
            }
        }
        res.writeHead(200,
            {
                'Content-Type': 'text/html;charset=utf-8',
                'sign': 'cdk1234'
            }
        )
    }
)
httpServer.listen(3333)