//由app调用，给app创建groupSocket对象
function groupConnect(){
	this.groupSocket = io.connect('http://localhost/group');	
	var tempApp = this;
	//设置监听函数

	//监听初始化组事件，触发后载入组列表
	this.groupSocket.on(this.user.userId + ' load groupList', function(groupList){
		console.log(tempApp.user, groupList);
		tempApp.user.groupList = groupList;
		//在页面中载入组列表
		var groupListArea = tempApp.windows['mainWindow'].contentArea.content.groupListArea;
		groupListArea.changeGroupListArea = changeGroupListArea;
		groupListArea.changeGroupListArea(groupNodeList(tempApp.user.groupList));
	});	
	
	//监听查询用户事件，触发后载入查询后的界面
	this.groupSocket.on(this.user.userId + ' query group', function(queryGroup){
		console.log(queryGroup);
		//生成新的组查询内容
		function queryGroupContent(queryGroup){
			var content = [];
			content[0] = $('<div id = "queryGroupResult"></div>');
			//检查是否查询到了用户
			if(queryGroup == null){
				content[0].append($('<span>' + '没有查询到组' + '</span>'));		
			}else{
				content[0].append($('<span id = "resultGroupId">' + queryGroup.groupId + '</span>'));
				var joinGroupButton = $('<div id = "joinGroupButton", class = "buttonStyle">加入群</div>');
				content[0].append(joinGroupButton.toJoinGroupButton());
				content[0].append($('<br />'));
				content[0].append($('<span id = "joinGroupWarning", class = "warningStyle"></span>'))
			}
			return content;
		}
		//载入新生成的内容
		tempApp.changeWindowContentArea('queryGroupWindow', queryGroupContent(queryGroup));
	});

	//询问管理员是否添加请求方为好友
	//param data = {requestUserId, groupId}
	this.groupSocket.on(this.user.userId + ' join group', function(data){
		//对方请求加好友，对方是请求方
		//注意confirmGroupContent中使用了messageWindow所以要提前生成这个窗口
		tempApp.createWindow('messageWindow', 'body', '消息', emptyContent());
		tempApp.changeWindowContentArea('messageWindow', confirmGroupContent('用户' + data.requestUserId + '想加入群' + data.groupId, data.requestUserId, data.groupId));
	});

	//告知请求方管理员的选择
	//data = {'requestUserId', 'administratorUserId', 'groupId', 'status'}
	this.groupSocket.on(this.user.userId + ' confirm join', function(data){		
		if(data.status == true){
			//管理员同意了请求
			tempApp.createWindow('messageWindow', 'body', '消息', emptyContent());
			tempApp.changeWindowContentArea('messageWindow', confirmContent('管理员' + data.administratorUserId + '同意了加入群' + data.groupId + '的请求'));
			
		}else if(data.status == false){
			//管理员拒绝了请求
			tempApp.createWindow('messageWindow', 'body', '消息', emptyContent());
			tempApp.changeWindowContentArea('messageWindow', confirmContent('管理员' + data.administratorUserId + '没有同意加入群' + data.groupId + '的请求'));
		}
	});
	
	//监听更新群列表事件
	this.groupSocket.on(this.user.userId + ' update groupList', function(groupList){
		console.log(groupList);
		tempApp.user.groupList = groupList;
		var groupListArea = app.windows['mainWindow'].contentArea.content.groupListArea;
		groupListArea.changeGroupListArea(groupNodeList(tempApp.user.groupList));
	});
	
	//监听对方发来的消息并将消息显示在outputArea中
	//data = {sendUserId,groupId,message}
	this.groupSocket.on(this.user.userId + ' chat group', function(data){
		//把消息分发给对应聊天窗口
		//生成聊天窗口id，并取得这个窗口的outputArea
		if(!tempApp.windows[data.groupId + 'ChatGroupWindow']){
			//如果窗口不存在则为发来的消息被动创建聊天窗口
			alert('testgroup');
			app.createWindow(data.groupId + 'ChatGroupWindow', 'body', '在组' + groupId + '中交谈', chatGroupContent(groupId));
		}
		//如果窗口被关闭，而对象存在，则恢复窗口
		if(tempApp.windows[data.groupId + 'ChatGroupWindow'].close){
			app.recoverWindow(data.groupId + 'ChatGroupWindow', 'body');
		}
		//为窗口添加发给这个窗口的消息
		//首先获得窗口输出区域
		var outputArea = tempApp.windows[data.groupId + 'ChatGroupWindow'].contentArea.content.outputArea;
		//把消息以”data.sendUserId:data.message“的形式添加到ouputArea中
		outputArea.val(outputArea.val() + data.sendUserId + '：' + data.message + '\n');
		
	});	
	
	this.groupSocket.on('group socket error', function(err){
		console.log(err);
	});
}

//对groupList进行数据转换
function groupNodeList(groupList){
	var groupNodeList = [];
	//如果用户的groupList长度为0
	if(groupList.length == 0){
		groupNodeList.push($('<li>' + '没有加入组' + '</li>'));
	}
	//如果用户的groupList的长度大于0
	for(var index = 0; index < groupList.length; index++){
		var liNode = $('<li></li>');
		liNode.append($('<div id = "group' + groupList[index] + '" class = "chatGroupButtonStyle">' + groupList[index] + '</div>').toCreateChatGroupWindowButton(groupList[index]));
		liNode.append($('<div class = "quitGroupButtonStyle">退出</div>').toQuitGroupButton(groupList[index]));
		groupNodeList.push(liNode);	
	}
	return groupNodeList;
}

//将数据转换后的groupNodeList添加到groupListArea中，由groupListArea调用
function changeGroupListArea(groupNodeList){
	//先清空groupListArea
	console.log('i m here');
	this.empty();
	while(groupNodeList.length != 0){
		this.append(groupNodeList.shift());
	}
}

//由app调用，自动触发，初始化群列表，是否应该改为由登陆按钮触发？
function loadGroupList(){
	console.log('loadGroupList被调用', this);
	if(this.groupSocket){
		var groupSocket = this.groupSocket;
		//客户端主动向服务器的socket的load groupList事件发送自己的userId，请求群列表
		groupSocket.emit('load groupList', this.user.userId);
	}else{
		console.log('error:还没有建立groupSocket');
	}
}

//requestUserId是发出入群请求的一方，groupId是想要加入的群
$.fn.toJoinGroupButton = function(){
	this.click(function(){
		var groupId = $('#resultGroupId').text();
		console.log(groupId);
		if(match(groupId, app.user.groupList)){
			var joinGroupWarning = $('#joinGroupWarning');
			joinGroupWarning.text('');
			joinGroupWarning.text('已加入该群');
			joinGroupWarning.show('slow').hide('slow');
		}else{
			//添加好友逻辑
			var joinGroupWarning = $('#joinGroupWarning');
			joinGroupWarning.text('');
			joinGroupWarning.text('请求已发出');
			joinGroupWarning.show('slow').hide('slow');
			//发送加好友请求
			app.groupSocket.emit('join group', {'requestUserId':app.user.userId, 'groupId':groupId});
		}
	});
	return this;
}



function confirmGroupContent(message, requestUserId, groupId){
	var content = [$('<div>' + message + '</div>')];
	console.log('app',app);
	content.push($('<div id = "acceptButton" class = "buttonStyle">接受</div>').toConfirmGroupButton(requestUserId, groupId).toCloseButton(app.windows['messageWindow']));
	content.push($('<div id = "refuseButton" class = "buttonStyle">拒绝</div>').toDenyGroupButton(requestUserId, groupId).toCloseButton(app.windows['messageWindow']));
	return content;
}
$.fn.toConfirmGroupButton = function(requestUserId, groupId){
	this.click(function(){
		var groupSocket = app.groupSocket;
		//当前用户是管理员，用户接受了请求方加入群的请求
		groupSocket.emit('confirm join',{'requestUserId':requestUserId, 'administratorUserId':app.user.userId, 'groupId':groupId, 'status':true});
	});
	return this;
};
$.fn.toDenyGroupButton = function(requestUserId, groupId){
	this.click(function(){
		var groupSocket = app.groupSocket;
		//当前用户是管理员，用户拒绝了对方添加好友的请求
		groupSocket.emit('confirm join',{'requestUserId':requestUserId, 'administratorUserId':app.user.userId, 'groupId':groupId, 'status':false});	
	});
	return this;
};
$.fn.toQuitGroupButton = function(groupId){
	this.click(function(){
		var groupSocket = app.groupSocket;
		groupSocket.emit('quit group',{'requestUserId':app.user.userId, 'groupId':groupId});
	});
	return this;
};
$.fn.toCreateChatGroupWindowButton = function(groupId){
	this.click(function(){
		//主动发起会话创建创建聊天窗口
		app.createWindow(groupId + 'ChatGroupWindow', 'body', '在组' + groupId + '中交谈', chatGroupContent(groupId));

	});
	return this;
};
function chatGroupContent(groupId){
	var content = [$('<div id = "chatGroupContent"></div>')];
	//把outputArea和inputArea作为属性添加到content上
	var outputArea = $('<textarea id = "' + groupId + 'groupMessageOutputArea" class = "outputAreaStyle" readonly = "readonly"></textarea>');
	content.outputArea = outputArea;
	var inputArea = $('<textarea id = "' + groupId + 'groupMessageInputArea" class = "inputAreaStyle"></textarea>');
	content.inputArea = inputArea;
	content[0].append(outputArea);
	content[0].append(inputArea);
	content[0].append($('<br />'));
	content[0].append($('<div id = "sendGroupMessageButton" class = "buttonStyle">发送</div>').toSendGroupMessageButton(groupId));
	return content;
}
//data = {sendUserId,groupId,message}
$.fn.toSendGroupMessageButton = function(groupId){
	this.click(function(){
		console.log('testgroup', app.windows[groupId + 'ChatGroupWindow']);
		//首先获得窗口输入区域和输出区域
		var inputArea = app.windows[groupId + 'ChatGroupWindow'].contentArea.content.inputArea;
		var outputArea = app.windows[groupId + 'ChatGroupWindow'].contentArea.content.outputArea;
		var groupSocket = app.groupSocket;
		//取得用户输入的消息
		var message = inputArea.val();
		//将消息发送给服务器
		groupSocket.emit('chat group', {'sendUserId':app.user.userId, 'groupId':groupId, 'message':message});
		//把用户刚刚发送的消息以“发送者:消息内容”形式添加到ouputArea中
		outputArea.val(outputArea.val() + app.user.userId + '：' + message + '\n');
		//清空inputArea
		inputArea.val('');
	});
	return this;
};
