const express = require('express');
const static = require('express-static');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const consolidate = require('consolidate');
const expressRoute = require('express-route');
const bodyParser = require('body-parser');
const multer = require('multer');

var server = express();
server.listen(8080);

var db = mysql.createPool({host: 'localhost', user: 'root', 
    password: 'Ace000111', database: 'fy_user'});

//1. 获取请求数据
//get自带
const multerObj = multer({dest: './static/upload'});
server.use(multerObj.any());
server.use(bodyParser.urlencoded());

//2. cookie、session
server.use(cookieParser());
//为了防止污染全局变量，使用独立的命名空间
(function(){
    var keys = [];
    for(var i=0;i<100000;i++){
        keys[i] = 'a_'+Math.random();
    }
    server.use(cookieSession({
        name: 'sess_id',
        keys: keys,
        maxAge: 20*60*1000
    }));
})();

//3. 模板
server.engine('html', consolidate.ejs);
server.set('views', 'template');
server.set('view engine', 'html');

//显示信息
server.get('/', (req, res, next)=>{
    if(!req.session['user_id']&&req.url!='/admin/login'){
        res.redirect('/login');
    }else{
        //res.send('OK');
        db.query(`SELECT * FROM user_role WHERE user_id='${req.session['user_id']}'`, (err, data)=>{
            if(err){
                res.status(500).send('database error').end();
            }else{
                if(data.length==0){
                    res.status(400).send('can not get the role');
                }else{
                    var thisRole = data[0].role_id;
                    console.log(thisRole);
                    db.query(`SELECT * FROM role_perm WHERE role_id=${thisRole}`, (err, data)=>{
                        if(err){
                            res.status(500).send('database error').end();
                        }else{
                            if(data.length==0){
                                res.status(400).send('can not get the perm');
                            }else{
                                var thisPerm = data[0].perm_id;
                                console.log(thisPerm);
                                db.query(`SELECT * FROM permission WHERE perm_id=${thisPerm}`, (err, data)=>{
                                    if(err){
                                        closed
                                    }else{
                                        if(data.length==0){
                                            res.status(400).send('can not get the permission name');
                                        }else{
                                            var thisPermissionName = data[0].name;
                                            console.log(thisPermissionName);
                                            if(thisPermissionName=='登录报修后台'){
                                                //管理后台
                                                var inf = [];
                                                db.query(`SELECT * FROM localauth`, (err, data)=>{
                                                    if(err){
                                                        res.status(500).send('database error').end();
                                                    }else{
                                                        if(data.length==0){
                                                            res.status(400).send('no user found').end();
                                                        }else{
                                                            var inf = data;
                                                            res.render('admin.ejs', {inf});
                                                        }
                                                    }
                                                })
                                            }else{
                                                //用户界面
                                                db.query(`SELECT * FROM localauth WHERE user_id='${req.session['user_id']}'`, (err, data)=>{
                                                    if(err){
                                                        res.status(500).send('database error').end();
                                                    }else{
                                                        if(data.length==0){
                                                            res.status(400).send('can not get the information');
                                                        }else{
                                                            var information = data[0];
                                                            db.query(`SELECT * FROM userinfo WHERE user_id='${req.session['user_id']}'`, (err, data)=>{
                                                                if(err){
                                                                    res.status(500).send('database error').end();
                                                                }else{
                                                                    if(data.length==0){
                                                                        res.status(400).send('can not get the further information');
                                                                    }else{
                                                                        var further_information = data[0];
                                                                        res.render('user.ejs', {information, further_information});
                                                                    }
                                                                }
                                                            })
                                                            
                                                        }
                                                    }
                                                })
                                                
                                            }
                                        }
                                    }
                                })
                            }
                        }
                    });
                }
            }
        });
    }
});

//修改提交之后
server.post('/', (req, res)=>{
    console.log('USER_ID:--------------', req.body.user_id);
    console.log('USERNAME: ', req.body.username);
    if(req.body.password1){
    db.query(`UPDATE localauth SET username='${req.body.username}', password='${req.body.password1}' WHERE user_id='${req.body.user_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error1').send();
        }else{
            db.query(`UPDATE userinfo SET name='${req.body.name}',\
                cell='${req.body.cell}',\
                email='${req.body.email}',\
                qq='${req.body.qq}' WHERE user_id='${req.body.user_id}'`, (err, data)=>{
                    if(err){
                        res.status(500),send('database error2').end();
                    }else{
                        res.redirect('/');
                    }
                });
        }
    });
    }else{
        db.query(`UPDATE localauth SET username='${req.body.username}' WHERE user_id='${req.body.user_id}'`, (err, data)=>{
            if(err){
                res.status(500).send('database error1').send();
            }else{
                db.query(`UPDATE userinfo SET name='${req.body.name}',\
                    cell='${req.body.cell}',\
                    email='${req.body.email}',\
                    qq='${req.body.qq}' WHERE user_id='${req.body.user_id}'`, (err, data)=>{
                        if(err){
                            res.status(500),send('database error2').end();
                        }else{
                            res.redirect('/');
                        }
                    });
            }
        });
    }
});

//修改
server.get('/mod', (req, res)=>{
    if(req.session['user_id']==req.query.user_id){
        db.query(`SELECT * FROM localauth WHERE user_id='${req.query.user_id}'`, (err, data)=>{
            if(err){
                res.status(500).send('databaser error').end();
            }else{
                if(data.length==0){
                    res.status(400).send('can not get the information');
                }else{
                    var information = data[0];
                    console.log(information.user_id,'----------------------');
                    db.query(`SELECT * FROM userinfo WHERE user_id='${req.query.user_id}'` ,(err, data)=>{
                        if(err){
                            res.status(500).send('database error').end();
                        }else{
                            if(data.length==0){
                                res.status(400).send('can not find further informaiton').end();
                            }else{
                                var further_information = data[0];
                                res.render('mod.ejs', {information, further_information});
                            }
                        }
                    });
                }
            }
        });
    }else{
        res.send('您不能修改其他用户的信息-_-|');
    }
    
    
});

//显示登录界面
server.get('/login', (req, res)=>{
    res.render('login.ejs');
});

//输入登陆信息
server.post('/login', (req, res)=>{
    var username = req.body.username;
    var password = req.body.password;
    db.query(`SELECT * FROM localauth WHERE user_id='${username}' OR username='${username}'`,(err, data)=>{
        if(err){
            console.error(err);
            res.status(500).send('database error').end();
        }else{
            if(data.length==0){
                res.status(400).send('no this user').end();
            }else{
                if(data[0].password==password){
                    //成功登录  创建session
                    req.session['user_id']=data[0].user_id;
                    var thisUserID = data[0].user_id;
                    //获取这个用户的权限
                    
                    console.log(req.session['user_id']);
                    res.redirect('/');  //重定向
                }else{
                    res.status(400).send('password error').end();
                }
            }
        }
    });
});

//退出登录
server.get('/logout', (req, res)=>{
    console.log('退出登录');
    //删除cookie-session
    delete req.session;
    res.clearCookie('sess_id');

    res.redirect('/');
});

server.get('/admin/viewmore', (req, res)=>{
    var sess_id = req.session['user_id'];
    var user_id = req.query.user_id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').end();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role');
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').end();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm');
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not get the permission');
                                    }else{
                                        var permisson = data[0].name;
                                        if(permisson=='登录报修后台'){
                                            db.query(`SELECT * FROM userinfo WHERE user_id='${user_id}'`, (err, data)=>{
                                                if(err){
                                                    res.status(500).send('database error').end();
                                                }else{
                                                    if(data.length==0){
                                                        res.status(400).send('can not get the permission');
                                                    }else{
                                                        var info = data[0];
                                                        res.render('admin_viewmore.ejs', {info});
                                                    }
                                                }
                                            });
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    });
});

server.get('/admin/mod', (req, res)=>{
    var sess_id = req.session['user_id'];
    var user_id = req.query.user_id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').send();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role').end();
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').send();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm').end();
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not find permission');
                                    }else{
                                        var permission = data[0].name;
                                        if(permission=='登录报修后台'){
                                            db.query(`SELECT * FROM localauth WHERE user_id='${user_id}'`, (err, data)=>{
                                                if(err){
                                                    res.status(500).send('database error').end();
                                                }else{
                                                    if(data.length==0){
                                                        res.status(400).send('can not find the information');
                                                    }else{
                                                        var information = data[0];
                                                        db.query(`SELECT * FROM userinfo WHERE user_id='${user_id}'`, (err, data)=>{
                                                            if(err){
                                                                res.status(500).send('database error').end();
                                                            }else{
                                                                if(data.length==0){
                                                                    res.status(400).send('can not find further information').end();
                                                                }else{
                                                                    var further_information = data[0];
                                                                    res.render('admin_mod.ejs', {information, further_information, sess_id});
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    })
})

//注册界面
server.get('/register', (req, res)=>{
    res.render('register.ejs', {});
});

//获取注册信息
server.post('/register', (req, res)=>{
    if(!req.body.user_id || !req.body.username || req.body.password1[0]==''){
        res.redirect('/register_error');
        console.log('reg err1');
    }else{
        if(req.body.password1!=req.body.password2){
            res.redirect('/register_error');
            console.log('reg err2');
            console.log(req.body.password1);
            console.log(req.body.password2);
        }else{
            var reg_time = Date.parse(new Date())/1000;
            var user_id = req.body.user_id;
            var username = req.body.username;
            var password = req.body.password1;
            var name = req.body.name;
            var cell = req.body.cell;
            var email = req.body.email;
            var qq = req.body.qq;
            db.query(`INSERT INTO localauth (user_id, username, password, locked) VALUE ('${user_id}', '${username}', '${password}', 'N')`, (err, data)=>{
                if(err){
                    console.error(err);
                    res.status(500).send('database error');
                }else{
                    db.query(`SELECT id FROM localauth WHERE user_id='${user_id}'`, (err, data)=>{
                        if(err){
                            res.status(500).send('database error').end();
                        }else{
                            if(data.length==0){
                                res.status(400).send('can not find id');
                            }else{
                                var id = data[0].id;
                                db.query(`INSERT INTO userinfo (id, user_id, name, cell, email, qq, reg_time) VALUE ('${id}', '${user_id}', '${name}', '${cell}', '${email}', '${qq}', '${reg_time}')`, (err, data)=>{
                                    if(err){
                                        res.status(500).send('database error').end();
                                    }else{
                                        db.query(`INSERT INTO user_role (id, user_id, role_id, status) VALUE ('${id}', '${user_id}', 1, 1)`, (err, data)=>{
                                            if(err){
                                                res.status(500).send('database error user_role').end();
                                            }else{
                                                res.render('register_succeed.ejs', {});
                                            }
                                        });
                                        
                                    }
                                });
                            }
                        }
                    })
                }
            });
        }
    }
});

server.get('/register_error', (req, res)=>{
    res.render('register_error.ejs', {});
});

server.get('/admin/viewvip', (req, res)=>{
    var sess_id = req.session['user_id'];
    var user_id = req.query.user_id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').send();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role').end();
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').send();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm').end();
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not find permission');
                                    }else{
                                        var permission = data[0].name;
                                        if(permission=='登录报修后台'){
                                            //显示VIP列表
                                            db.query(`SELECT * FROM vip`, (err ,data)=>{
                                                if(err){
                                                    res.status(500).send('database error');
                                                }else{
                                                    if(data.length==0){
                                                        res.send('can not get vip information');
                                                    }else{
                                                        var vipinf = data;
                                                        res.render('admin_viewvip.ejs', {vipinf});
                                                    }
                                                }
                                            });
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    });
    
    
});

server.get('/admin/addvip', (req, res)=>{
    var sess_id = req.session['user_id'];
    var user_id = req.query.user_id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').send();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role').end();
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').send();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm').end();
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not find permission');
                                    }else{
                                        var permission = data[0].name;
                                        if(permission=='登录报修后台'){
                                            res.render('admin_addvip.ejs', {});
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    });
});

server.post('/admin/addvip', (req, res)=>{
    db.query(`INSERT INTO vip (card_id, name, gender, cell, qq, department, grade) VALUE 
    ('${req.body.card_id}', '${req.body.name}', '${req.body.gender}', '${req.body.cell}', '${req.body.qq}', '${req.body.department}', '${req.body.grade}')`, (err, data)=>{
        if(err){
            res.status('database error').end();
        }else{
            res.redirect('/admin/viewvip');
        }
    });
});

server.get('/admin/modvip', (req, res)=>{
    var sess_id = req.session['user_id'];
    var id = req.query.id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').send();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role').end();
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').send();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm').end();
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not find permission');
                                    }else{
                                        var permission = data[0].name;
                                        if(permission=='登录报修后台'){
                                            db.query(`SELECT * FROM vip WHERE id='${id}'`, (err, data)=>{
                                                if(err){
                                                    res.status(500).send('database error').end();
                                                }else{
                                                    if(data.length==0){
                                                        res.status(400).send('can not find the information');
                                                    }else{
                                                        var information = data[0];
                                                        res.render('admin_modvip.ejs', {information});
                                                    }
                                                }
                                            });
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    })
});

server.post('/admin/modvip', (req, res)=>{
    var sess_id = req.session['user_id'];
    var id = req.body.id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').send();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role').end();
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').send();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm').end();
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not find permission');
                                    }else{
                                        var permission = data[0].name;
                                        if(permission=='登录报修后台'){
                                            db.query(`UPDATE vip SET card_id='${req.body.card_id}', name='${req.body.name}', gender='${req.body.gender}', cell='${req.body.cell}', qq='${req.body.qq}', department='${req.body.department}', grade='${req.body.grade}' WHERE id='${id}'`, (err, data)=>{
                                                if(err){
                                                    res.status(500).send('database error').send();
                                                }else{
                                                    res.redirect('/admin/viewvip');
                                                }
                                            });
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    })
});

server.get('/admin/deletevip', (req, res)=>{
    var sess_id = req.session['user_id'];
    var id = req.query.id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').send();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role').end();
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').send();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm').end();
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not find permission');
                                    }else{
                                        var permission = data[0].name;
                                        if(permission=='登录报修后台'){
                                            res.render('admin_confirmdelete.ejs', {id});
                                            
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    })
});

server.get('/admin/confirmdelete', (req, res)=>{
    var sess_id = req.session['user_id'];
    var id = req.query.id;
    db.query(`SELECT * FROM user_role WHERE user_id='${sess_id}'`, (err, data)=>{
        if(err){
            res.status(500).send('database error').send();
        }else{
            if(data.length==0){
                res.status(400).send('can not get the role').end();
            }else{
                var role = data[0].role_id;
                db.query(`SELECT * FROM role_perm WHERE role_id='${role}'`, (err, data)=>{
                    if(err){
                        res.status(500).send('database error').send();
                    }else{
                        if(data.length==0){
                            res.status(400).send('can not get the perm').end();
                        }else{
                            var perm = data[0].perm_id;
                            db.query(`SELECT * FROM permission WHERE perm_id='${perm}'`, (err, data)=>{
                                if(err){
                                    res.status(500).send('database error').end();
                                }else{
                                    if(data.length==0){
                                        res.status(400).send('can not find permission');
                                    }else{
                                        var permission = data[0].name;
                                        if(permission=='登录报修后台'){
                                            console.log('ID:', id);
                                             db.query(`DELETE FROM vip WHERE id='${id}'`, (err, data)=>{
                                                 if(err){
                                                     res.status(500).send('database error').end();
                                                 }else{
                                                     res.redirect('/admin/viewvip');
                                                 }
                                             });
                                        }else{
                                            res.send('您不是管理员');
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    })
})

server.use(static('./static/'));