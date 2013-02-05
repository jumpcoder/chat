/*
 * GET home page.
 */
 //首先要取回在初始化数据库连接时定义的名叫User的model
var mongoose = require('mongoose');
var db = require('../db');
var User = db.User;
var Group = db.Group;


//返回主页
exports.getIndex = function(req, res){
	res.render('index', { title: 'Chat' });
};
/*
//验证登录
exports.getLogin = function(req, res){
	//如果session中仍然保持着用户，那么就直接返回登录后的页面
	if(req.session.userId){
		//res.send('已登录');
		//在数据库中查找userId键的值为req.session.userId的文档
		User.findOne({userId:req.session.userId}, function(err, user){
			if(!err){
				if(user){
					res.render('tabs');
					//res.send({'friends':user.friends, 'groups':user.groups});
				}else{
					res.send('未知用户保持的session！');
				}
			}
		});
	}
	//如果session中没有保持着这个用户那么就返回登录界面
	else{
		res.render('login');
	}
};*/
exports.getLogin = function(req, res){
	//如果session中仍然保持着用户，那么返回true和userId，否则返回false
	if(req.session.userId){
		res.send({'result':true, 'user':{'userId':req.session.userId}});
	}else{
		res.send({'result':false});
	}
}

//对用户登录数据进行数据库认证
exports.postLogin = function(req, res){
	console.log(req.body.userId, req.body.password);
	//检验返回数据的存在性
	if(!req.body.userId && !req.body.password){
		console.log('客户端未返回用户登录信息');
	}
	//在数据库中查找userId键的值为req.body.userId的文档
	User.findOne({userId:req.body.userId}, function(err, user){
		if(!err){
			console.log(user);
			if(user){
				//检验用户的密码
				if(user.password == req.body.password){
					//返回用户状态
					//res.send('认证成功');
					//为用户保持session状态
					req.session.userId = req.body.userId;
					//返回好友列表和群列表
					//console.log({'friends':user.friends, 'groups':user.groups});
					
					//res.render('tabs');
					res.send({'result':true});
				}else{
					res.send({'result':false});
				}
			}else{
				res.send({'result':'未定义用户'});
			}
		}
	});
	//res.redirect('back');
};

exports.getLogout = function(req, res){
	if(req.session.userId){
		delete req.session.userId
	}
	//res.redirect('/login');
	res.send({'result':true});
}

//返回注册界面
exports.getRegisterUser = function(req, res){
	res.render('registerUser');
};

exports.postRegisterUser = function(req, res){
	console.log('recieve:',req.body.user);
	//console.log('recieve:',req.body.user.password);
	//
	if(!req.body.user.userId || !req.body.user.password){
		console.log('客户端用户注册数据不完整');
	}else{
		user = new User();
		user.userId = req.body.user.userId;
		user.password = req.body.user.password;
		user.save(function(err){
			if(!err){
				console.log('register user success!');
				//res.render('success', {'info':'register user'});
			}else{
				console.log(err);
			}
		});
	}
};

exports.getCreateGroup = function(req, res){
	res.render('createGroup');
};

exports.postCreateGroup = function(req, res){
	console.log('recieve:', req.body.group);
	//
	if(!req.body.group.groupId){
		console.log('客户端组数据不完整');
	}else{
		group = new Group();
		group.groupId = req.body.group.groupId;
		//把申请创建群的用户添加到群中并设为管理者
		group.memberList.push(req.session.userId);
		group.administratorList.push(req.session.userId);
		group.save(function(err){
			if(!err){
				console.log('create group success!');
				//res.render('success', {'info':'create group'});
			}else{
				console.log(err);
			}
		});
		//之后再在用户的群列表中添加这个群
		User.findOne({'userId':req.session.userId}, function(err, user){
			if(!err){
				user.groupList.push(group.groupId);
				user.save(function(err){
					if(!err){
						console.log('join group success');
					}else{
						console.log(err);
					}
				});
			}else{
				console.log('join group err');
			}
		});
	}
};
/*
//返回查询用户界面
exports.getQuery = function(req, res){
	res.render('query');
}

//查询用户
exports.postQueryFriends = function(req, res){
	User.findOne({userId:req.body.queryUserId}, function(err, user){
		if(!err){
			res.render('query_friends_result',{'user':user});
		}else{
			res.send(err);
		}
	});
}
//返回上一个页面
exports.getBack = function(req, res){
	res.redirect('back');
}

exports.getChat = function(req, res){
	res.render('chat');
}
*/
//==================配置socket.io===================================
/**
 * 配置socket.io
 *
 */
 /*
var app = require('../app');
console.log('i m here',app);
var io = app.io;
var friendSocket = io.of('/friend').on('connection', connectFriend);


var connectFriend = function(friendSocket){
	//监听载入好友列表事件
	friendSocket.on('load friend list', function(userId){
		//从数据库查询userId
		console.log('user is:',userId);
		User.findOne({'userId':userId}, function(err, user){
			if(!err){
				friendSocket.emit(userId + ' load friend list', user.friendList);
			}else{
				friendSocket.emit('friend socket error', err);
			}
		});
		//返回用户好友列表
		
	});
	
	//监听查询用户事件
	friendSocket.on('query user', function(data){
		console.log('queryUserId',data.queryUserId);
		User.findOne({'userId':data.queryUserId}, function(err, queryUser){
			console.log('queryUser', queryUser);
			if(!err){
				friendSocket.emit(data.userId + ' query user', queryUser);
				//friendSocket.emit('123 add friend', 'test');
			}else{
				friendSocket.emit('friend socket error', err);
			}
			
		});
	});
	//监听请求加好友事件
	friendSocket.on('add friend', function(data){
		console.log('add friend',data.receiveUserId,data.requestUserId);
		//向接收方询问是否接受好友请求
		console.log(data.receiveUserId + ' add friend');
		friendSocket.emit('123 add friend', 'test');
		//friendSocket.emit(data.receiveUserId + ' add friend', data);

	});
	friendSocket.on('confirm friend', function(data){
		console.log('confirm friend',data);
		//向请求方传递接收方的选择
		friendSocket.emit(data.requestUserId + ' confirm friend', data.status);
		//如果为true则相互添加好友，否则不管
		if(data.status){
		
		}else{
			
		}
	});

}*/