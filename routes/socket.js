 //首先要取回在初始化数据库连接时定义的名叫User的model
var mongoose = require('mongoose');
var db = require('../db');
var User = db.User;
var Group = db.Group;

////如果字符串在数组中则返回true否则返回false
function match(matchString, matchArray){
	for(var index = 0; index < matchArray.length; index++){
		if(matchArray[index] == matchString){
			return true;
		}
	}
	return false;
}
//删除数组中第一个匹配给定的字符串的元素
function deleteMatchElement(matchString, matchArray){
	var length = matchArray.length;
	for(var index = 0; index < length; index++){
		if(matchArray[index] == matchString){
			matchArray.splice(index, 1);
			break;
		}
	}
}

//==================配置socket.io===================================
/**
 * 配置socket.io
 *
 */
var io = require('../app').io;
var globalFriendSocket = io.of('/friend').on('connection', friendConnect);
var globalGroupSocket = io.of('/group').on('connection', groupConnect);

//var friendConnect = function(friendSocket){
function friendConnect(friendSocket){
	//监听载入好友列表事件
	friendSocket.on('load friendList', function(userId){
		//从数据库查询userId
		console.log('user is:',userId);
		User.findOne({'userId':userId}, function(err, user){
			if(!err){
				//返回用户好友列表
				console.log('#############',user.friendList);
				friendSocket.emit(userId + ' load friendList', user.friendList);
			}else{
				friendSocket.emit('friend socket error', err);
			}
		});
	});
	
	//监听查询用户事件
	//data = {userId, queryUserId}
	friendSocket.on('query user', function(data){
		User.findOne({'userId':data.queryUserId}, function(err, queryUser){
			console.log('queryUser', queryUser);
			if(!err){
				friendSocket.emit(data.userId + ' query user', queryUser);
			}else{
				friendSocket.emit('friend socket error', err);
			}	
		});
	});
	
	//监听请求加好友事件
	//data = {receiveUserId,requestUserId}
	friendSocket.on('add friend', function(data){
		console.log('add friend',data.receiveUserId,data.requestUserId);
		//向接收方询问是否接受好友请求
		console.log(data.receiveUserId + ' add friend');
		//这里需要给另一个客户端发送信息所以需要用globalFriendSocket触发客户端
		globalFriendSocket.emit(data.receiveUserId + ' add friend', data);
	});
	
	//监听客户端确认好友关系事件
	//data = {'receiveUserId', 'requestUserId', 'status'}
	friendSocket.on('confirm friend', function(data){
		console.log('######confirm friend',data);
		//告诉请求方接收方的选择
		globalFriendSocket.emit(data.requestUserId + ' confirm friend', data);
		//如果status为true则相互添加好友，否则什么也不做
		if(data.status){
			//在数据库中相互添加好友关系,并更新双方好友列表
			User.findOne({'userId':data.requestUserId}, function(err, requestUser){
				if(!err){
					//如何添加到friendList中？friendList是一个mogoose数组对象
					if(!(match(data.receiveUserId, requestUser.friendList))){
						requestUser.friendList.push(data.receiveUserId);
					}
					//console.log('########requestUser',!(match(data.receiveUserId, requestUser.friendList)));
					requestUser.save(function(err){
						if(!err){
							console.log('add success');
							//更新请求方好友列表
							globalFriendSocket.emit(data.requestUserId + ' update friendList', requestUser.friendList);
						}else{
							console.log(err);
						}
					});
				}else{
					friendSocket.emit('friend socket error', err); 
				}
			});
			User.findOne({'userId':data.receiveUserId}, function(err, receiveUser){
				if(!err){
					if(!(match(data.requestUserId, receiveUser.friendList))){
						receiveUser.friendList.push(data.requestUserId);
					}
					//console.log('######receiveUser',!(match(data.requestUserId, receiveUser.friendList)));
					receiveUser.save(function(err){
						if(!err){
							console.log('add success');
							//更新接收方好友列表
							//glabalFriendSocket.emit(data.receiveUserId + ' update friendList', receiveUser.friendList);
							friendSocket.emit(data.receiveUserId + ' update friendList', receiveUser.friendList);
						}else{
							console.log(err);
						}
					});
				}else{
					friendSocket.emit('friend socket error', err);
				}
			});
		}else{
			//如果接收方不同意就什么也不做
		}
		
	});
	//data = {'requestUserId', 'deleteUserId'}
	friendSocket.on('delete friend', function(data){
			//在数据库中相互删除好友关系,并更新双方好友列表
			User.findOne({'userId':data.requestUserId}, function(err, requestUser){
				if(!err){
					if(match(data.deleteUserId, requestUser.friendList)){
						deleteMatchElement(data.deleteUserId, requestUser.friendList);
						//console.log('######deleteUserId', data.deleteUserId, requestUser.friendList );
					}
					requestUser.save(function(err){
						if(!err){
							console.log('delete success');
							//更新请求方好友列表
							friendSocket.emit(data.requestUserId + ' update friendList', requestUser.friendList);
						}else{
							console.log(err);
						}
					});
				}else{
					friendSocket.emit('friend socket error', err); 
				}
			});
			User.findOne({'userId':data.deleteUserId}, function(err, deleteUser){
				if(!err){
					if(match(data.requestUserId, deleteUser.friendList)){
						deleteMatchElement(data.requestUserId, deleteUser.friendList);
					}
					deleteUser.save(function(err){
						if(!err){
							console.log('delete success');
							globalFriendSocket.emit(data.deleteUserId + ' update friendList', deleteUser.friendList);
						}else{
							console.log(err);
						}
					});
				}else{
					friendSocket.emit('friend socket error', err);
				}
			});
	});
	//data = {sendUserId,receiveUserId,message}
	friendSocket.on('chat friend', function(data){
		console.log('####test###',data);
		globalFriendSocket.emit(data.receiveUserId + ' chat friend', data);
	});
	/*监听客户端关闭连接事件，但是关不了
	socket.on('force disconnect', function(data){
		console.log(data);
		socket.disconnect();
	});
	*/
}

function groupConnect(groupSocket){
	//监听载入群列表事件
	groupSocket.on('load groupList', function(userId){
		//从数据库查询userId
		console.log('user is:',userId);
		User.findOne({'userId':userId}, function(err, user){
			if(!err){
				//返回用户组列表
				console.log('#############',user.groupList);
				groupSocket.emit(userId + ' load groupList', user.groupList);
			}else{
				groupSocket.emit('group socket error', err);
			}
		});
	});
	
	//监听查询组事件
	//data = {userId, queryGroupId}
	groupSocket.on('query group', function(data){
		Group.findOne({'groupId':data.queryGroupId}, function(err, queryGroup){
			console.log('queryGroup', queryGroup);
			if(!err){
				groupSocket.emit(data.userId + ' query group', queryGroup);
			}else{
				groupSocket.emit('group socket error', err);
			}	
		});
	});

	//监听请求加入群事件
	//data = {requestUserId, groupId}
	groupSocket.on('join group', function(data){
		console.log('join group',data.groupId,data.requestUserId);
		console.log(data.groupId + ' join group');
		Group.findOne({'groupId':data.groupId}, function(err, group){
			//如果群没有管理员则直接加入请求方
			
			//如果群有管理员则向每个管理员询问是否接受入群请求
			for(var index = 0, length = group.administratorList.length; index < length; index++){
				//这里需要给另一个客户端发送信息所以需要用globalGroupSocket触发客户端
				globalGroupSocket.emit(group.administratorList[index] + ' join group', data);
			}
		});	
	});
	
	//监听客户端确认加入群事件
	//data = {'requestUserId', 'administratorUserId', 'groupId', 'status'}
	groupSocket.on('confirm join', function(data){
		console.log('######confirm join',data);
		//告诉请求方接收方的选择
		globalGroupSocket.emit(data.requestUserId + ' confirm join', data);
		//如果status为true则加入群，否则什么也不做
		if(data.status){
			//在数据库中把群号加入请求方群列表，把请求方Id加入群的用户列表，并更新群列表
			Group.findOne({'groupId':data.groupId}, function(err, group){
				if(!err){
					//如果请求方的id还没有在群的成员列表中则加入
					if(!(match(data.requestUserId, group.memberList))){
						group.memberList.push(data.requestUserId);
					}
					//console.log('########requestUser',!(match(data.receiveUserId, requestUser.groupList)));
					group.save(function(err){
						if(!err){
							console.log('join success');
							//更新群中所有成员的的群成员列表
							//globalGroupSocket.emit(data.requestUserId + ' update group userList', requestUser.groupList);
						}else{
							console.log(err);
						}
					});
				}else{
					groupSocket.emit('group socket error', err); 
				}
			});
			User.findOne({'userId':data.requestUserId}, function(err, requestUser){
				if(!err){
					//如果请求方请求的群id还没有在请求方的群列表中则加入
					if(!(match(data.groupId, requestUser.groupList))){
						requestUser.groupList.push(data.groupId);
					}
					//console.log('########requestUser',!(match(data.receiveUserId, requestUser.groupList)));
					requestUser.save(function(err){
						if(!err){
							console.log('join success');
							//更新请求方群列表
							globalGroupSocket.emit(data.requestUserId + ' update groupList', requestUser.groupList);
						}else{
							console.log(err);
						}
					});
				}else{
					groupSocket.emit('group socket error', err); 
				}
			});
			//如果接收方不同意就什么也不做
		}
	});
	
	//退出群
	//data = {'requestUserId', 'groupId'}
	groupSocket.on('quit group', function(data){
		//在数据库中删除群的成员列表中的请求方id，删除请求方群列表中的群id，并更新群列表
		User.findOne({'userId':data.requestUserId}, function(err, requestUser){
			if(!err){
				if(match(data.groupId, requestUser.groupList)){
					deleteMatchElement(data.groupId, requestUser.groupList);
					//console.log('######deleteUserId', data.deleteUserId, requestUser.groupList );
				}
				requestUser.save(function(err){
					if(!err){
						console.log('quit success');
						//更新请求方群列表
						groupSocket.emit(data.requestUserId + ' update groupList', requestUser.groupList);
					}else{
						console.log(err);
					}
				});
			}else{
				groupSocket.emit('group socket error', err); 
			}
		});
		Group.findOne({'groupId':data.groupId}, function(err, group){
			if(!err){
				if(match(data.requestUserId, group.memberList)){
					deleteMatchElement(data.requestUserId, group.memberList);
				}
				//别忘了还要在管理员列表中删除该用户
				if(match(data.requestUserId, group.administratorList)){
					deleteMatchElement(data.requestUserId, group.administratorList);
				}
				group.save(function(err){
					if(!err){
						console.log('quit success');
						//更新群中所有成员的的群成员列表
						//globalGroupSocket.emit(data.deleteUserId + ' update group memberList', group.memberList);
					}else{
						console.log(err);
					}
				});
			}else{
				groupSocket.emit('group socket error', err);
			}
		});
	});
	
	//data = {sendUserId,groupId,message}
	groupSocket.on('chat group', function(data){
		console.log('####test###',data);
		Group.findOne({'groupId':data.groupId}, function(err, group){
			if(!err){
				for(var index = 0, length = group.memberList.length; index < length; index++){
					if(group.memberList[index] != data.sendUserId){
						globalGroupSocket.emit(group.memberList[index] + ' chat group', data);
					}
				}
			}else{
				groupSocket.emit('group socket error', err);
			}
		});
	});
}
