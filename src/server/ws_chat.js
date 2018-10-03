const http = require('http');
const mysql = require('mysql');
const io = require('socket.io');
const regExp = {
    // 6-12位的用户名
    usr: /^[a-zA-Z]{1}([a-zA-Z0-9]){5,11}$/,
    // 6-12位密码
    pass: /^(\w){6,12}$/
};

// 创建数据库
const db = mysql.createPool({host: 'localhost', user: 'root', password: 'root', database: 'chat'});
const httpServer = http.createServer(function (req, res) {
    fs.readFile(`www${req.url}`, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.write('not Found');
            } else {
                res.write(data);
            }
        }
    )
});
httpServer.listen(3333);
const wsServer = io.listen(httpServer);
let aSock = [];
wsServer.on('connection', sock => {
    let cur_username = '';
    let cur_userID = 0;
    aSock.push(sock);
    sock.on('reg', (user, pass) => {
        if (!regExp.usr.test(user)) {
            sock.emit('reg_ret', 1, '用户名不符合规范');
        } else if (!regExp.pass.test(pass)) {
            sock.emit('reg_ret', 1, '密码不符合规范');
        } else {
            db.query(`SELECT ID FROM usr_tab WHERE username='${user}'`, (err, data) => {
                if (err) {
                    sock.emit('reg_ret', 1, '查询数据出错');
                } else if (data.length > 0) {
                    sock.emit('reg_ret', 1, '用户名已存在');
                } else {
                    db.query(`INSERT INTO usr_tab (username,password,online) VALUES ('${user}','${pass}',0)`, err => {
                        if (err) {
                            sock.emit('reg_ret', 1, '插入数据出错');
                        } else {
                            sock.emit('reg_ret', 0, '注册成功')
                        }
                    })
                }
            })
        }
    });
    sock.on('loggin', (user, pass) => {
        if (!regExp.usr.test(user)) {
            sock.emit('loggin_ret', 1, '用户名不符合规范');
        } else if (!regExp.pass.test(pass)) {
            sock.emit('loggin_ret', 1, '密码不符合规范');
        } else {
            db.query(`SELECT ID,password FROM usr_tab WHERE username='${user}'`, (err, data) => {
                if (err) {
                    sock.emit('loggin_ret', 1, '查询数据出错');
                } else if (data.length == 0) {
                    sock.emit('loggin_ret', 1, '此用户不存在');
                } else if (data[0].password != pass) {
                    sock.emit('loggin_ret', '用户名或者密码错误');
                } else {
                    db.query(`UPDATE usr_tab SET online=1 WHERE username='${user}'`, err => {
                        if (err) {
                            sock.emit('loggin_ret', 1, '修改登录状态错误');
                        } else {
                            sock.emit('loggin_ret', 0, '登录成功');
                            cur_username = user;
                            cur_userID = data[0].ID;
                        }
                    })
                }
            })
        }
    });
    sock.on('msg', txt => {
        if (!txt) {
            sock.emit('msg_ret', 1, '文本消息不能为空');
        } else {
            // 广播给所有人
            aSock.forEach(item => {
                // 把自己跳过去
                if (item == sock) return;
                // 把消息发送给所有人
                item.emit('msg', cur_username, txt);
            });

            sock.emit('msg_ret', 0, '发送成功');
        }
    });
    sock.on('disconnect', function () {
        db.query(`UPDATE usr_tab SET online=0 WHERE ID='${cur_userID}'`, err => {
            if (err) {
                console.log('数据库有错', err);
            }
            cur_username = '';
            cur_userID = 0;

            // 把离线的人去除掉
            aSock = aSock.filter(item => item != sock);
        })
    })
});