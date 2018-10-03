$(function () {
    let sock = io.connect('ws://localhost:3333/');
    let txtBox = $('#txt1');
    let cur_username = '';
//        定义绑定事件函数
    function bindSock(id) {
        $('#' + id).click(function () {
            let user = $('#usr').val();
            let pass = $('#pass').val();
            sock.emit(id, user, pass);
        });
    }

//        把接收放到外面，以免重复绑定事件
//        注册
    sock.on('reg_ret', (code, msg) => {
        if (code) {
            alert('注册失败' + msg);
        } else {
            alert('注册成功');
        }
    });
//        登录
    sock.on('loggin_ret', (code, msg) => {
        if (code) {
            alert('登录失败' + msg);
        } else {
            alert('登录成功');
            cur_username = $('#usr').val();
        }
    });
//        消息
//        把当前用户的消息发给服务器
    $('#loggin').click(function () {
        sock.on('msg_ret', (code, msg) => {
            if (code) {
                alert('消息发送失败' + msg);
            } else {
                $('#txt_box').append(`<li><h4>${cur_username}</h4><p>${txtBox.val()}</p></li>`);
                txtBox.val('');
            }
        });
//        后台给其他人发消息
        sock.on('msg', (name, txt) => {
            $('#txt_box').append(`<li><h4>${name}</h4><p>${txt}</p></li>`);
        });
        $('#send').click(function () {
            sock.emit('msg', txtBox.val());
        });
    });

    bindSock('reg');
    bindSock('loggin');
})