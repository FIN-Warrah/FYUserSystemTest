# FYUserSystemTest
由于需求不是很清楚，所以就自由发挥了 
我稍微在数据库里面加了点东西

permission中： 
加入 
id=2, perm_id=1, name=无, extend空着

role_perm中： 
加入 
id=2, role_id=1, perm_id=1

注册用户的时候，用户的role_id都是1，也就是只能看到自己的数据 
数据库管理员可以看到所有用户和VIP的信息，管理员不能注册，只能直接在数据库里面添加

关于如何使用： 
1、将mysql连接信息修改一下 
2、将server.listen(8080)中的8080改为80 
这样就可以直接在阿里云运行了 如果在外网访问的时候，服务器控制台显示什么权限之类的报错，那就应该是mysql的权限问题，百度解决
内部使用，所以不放出.sql文件