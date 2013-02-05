
/**
 * Module dependencies.
 */
//初始化数据库连接应该在导入routes之前，想想为什么
var express = require('express')
  , db = require('./db')  
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , sio = require('socket.io');
  
var app = express();

//这里的app.use中的cookieParser()和session使每个请求都有cookie和session属性
app.configure(function(){
  app.set('port', process.env.PORT || 80);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret:'keyboard cat'}));	
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * 将请求和index.js中定义的处理函数做映射
 *
 */

//映射主页请求
app.get('/', routes.getIndex);
//app.get('/users', user.list);

//映射登录页面请求	
app.get('/login', routes.getLogin);


function authorizationUser(req, res, next){
	//console.log(req.body.user.id);
	//console.log(req.body.user.password);	
	//这里把数据传入数据库中验证用户数据
	next();
}
//处理发送来的用户信息
app.post('/login', authorizationUser, routes.postLogin);

//映射退出请求
app.get('/logout',routes.getLogout);

//映射注册用户页面请求
app.get('/register/user', routes.getRegisterUser);


function registerUser(req, res, next){
	//console.log(req.body.user);
	//console.log(req.body.user.password);
	//这里把数据传入数据库中
	next();
}

//处理发送来的注册用户信息
app.post('/register/user', registerUser, routes.postRegisterUser);

//映射创建群页面请求
app.get('/create/group', routes.getCreateGroup);

//处理发送来的创建群信息
app.post('/create/group', routes.postCreateGroup);
/*
//app.get('/user/:userID')的预处理函数
app.param('userID', function(req, res, next, id){
	//用id查找到用户，并把用户存入req.user中
	next();
});
*/

//获得查询页面
//app.get('/query', routes.getQuery);

//处理送来的查询信息请求
app.post('/query/friends', routes.postQueryFriends);

//返回上个页面请求
app.get('/back', routes.getBack);

app.get('/chat', routes.getChat);
/*
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
*/


var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/**
 * 配置soket.io
 × 并导入socket.js文件中的监听函数
 *
 */

exports.io = sio.listen(server);
require('./routes/socket');
  
 

/*
 app.connect = function (path, callback){
	var namespace = io.of(path).on('connection', callback);
 }
 app.connect('/friend', routes.connectFriend);

 var chat = io.of('/load/friends').on('connection', function(socket){
	socket.on('loadFriends', function(userID){
		//从数据库查询userID
		//返回用户好友列表
		socket.emit(userID, {});
	});
});

 io.sockets.on('connection', function(socket){
	socket.on('private_message', function(data){
		data.senderID
		data.msg
		data.receiverID
		socket.emit(receiverID, {'senderID':data.senderID, 'msg':data.msg});
	});

	socket.on('success', function(data){
		console.log(data);
	});

 });
*/

