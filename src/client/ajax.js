$(function () {
    function myAjax(url, params, cb) {
        var base = 'http://localhost:3333'
        $.ajax({
            url: base + url,
            dataType: 'jsonp',
            params: {
                username: params.username,
                password: params.password
            },
            success: function (data) {
                cb(data)
            },
            error: function (XMLHTTPRequest, textStatus, errorThrown) {
                /*console.log(XMLHTTPRequest.readyState, XMLHTTPRequest.status);
                 console.log(textStatus);
                 console.log(errorThrown);*/
                alert('网络繁忙，稍后再试！')
            }
        })
    }

    $('#submit').on('click', function () {
        var username = $('#username').val().trim()
        var password = $('#password').val().trim()
        if (!username) {
            alert('请输入用户名')
        } else if (!password) {
            alert('请输入密码')
        } else {
            myAjax(
                '/reg', {username: username, password: password},
                function (res, status, head) {
                    if (res.code) {
                        alert('注册失败')
                    } else {
                        alert('注册成功')
                    }
                }
            )
        }

    });
})