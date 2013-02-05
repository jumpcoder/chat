var g_socket;//用来在控制台中观察socket对象

//由app调用，给app创建friendSocket对象
function friendConnect(){
	this.friendSocket = io.connect('http://localhost/friend');	
	var tempApp = this;
	//设置监听函数，监听有关好友的事件
	
	//监听初始化好友事件，触发后载入好友列表
	this.friendSocket.on(this.user.userId + ' load friendList', function(friendList){
		console.log(tempApp.user, friendList);
		tempApp.user.friendList = friendList;
		//friendSocket.emit('success', {'receiverId':userId, 'msgStatus':true});
		//真正载入好友列表
		var friendListArea = tempApp.windows['mainWindow'].contentArea.content.friendListArea;
		friendListArea.changeFriendListArea = changeFriendListArea;
		friendListArea.changeFriendListArea(friendNodeList(tempApp.user.friendList));
	});
	
	//监听查询用户事件，触发后载入查询后的界面
	this.friendSocket.on(this.user.userId + ' query user', function(queryUser){
		console.log(queryUser);
		//载入查询到的用户
		tempApp.changeWindowContentArea('queryFriendWindow', queryUserContent(queryUser));
	});
	
	//询问用户是否添加请求方为好友
	//param data = {receiveUserId,requestUserId}
	this.friendSocket.on(this.user.userId + ' add friend', function(data){
		//对方请求加好友，对方是请求方
		//注意confirmFriendContent中使用了messageWindow所以要提前生成这个窗口
		tempApp.createWindow('messageWindow', 'body', '消息', emptyContent());
		tempApp.changeWindowContentArea('messageWindow', confirmFriendContent('用户' + data.requestUserId + '想加您为好友', data.requestUserId));
	});

	//告知用户请求方的选择
	this.friendSocket.on(this.user.userId + ' confirm friend', function(data){		
		if(data.status == true){
			//接收方同意了请求
			tempApp.createWindow('messageWindow', 'body', '消息', emptyContent());
			tempApp.changeWindowContentArea('messageWindow', confirmContent('用户' + data.receiveUserId + '同意了请求'));
			
		}else if(data.status == false){
			//接收方拒绝了请求
			tempApp.createWindow('messageWindow', 'body', '消息', emptyContent());
			tempApp.changeWindowContentArea('messageWindow', confirmContent('用户' + data.receiveUserId + '没有同意请求'));
		}
	});
	
	//监听更新好友列表事件
	this.friendSocket.on(this.user.userId + ' update friendList', function(friendList){
		console.log(friendList);
		tempApp.user.friendList = friendList;
		var friendListArea = app.windows['mainWindow'].contentArea.content.friendListArea;
		friendListArea.changeFriendListArea(friendNodeList(tempApp.user.friendList));
	});
	
	//监听对方发来的消息并将消息显示在outputArea中
	//data = {sendUserId,receiveUserId,message}
	this.friendSocket.on(this.user.userId + ' chat friend', function(data){
		//把消息分发给对应聊天窗口
		//生成聊天窗口id，并取得这个窗口的outputArea
		if(!tempApp.windows[data.sendUserId + 'ChatFriendWindow']){
			//如果窗口不存在则为发来的消息被动创建聊天窗口
			alert('test1');
			app.createWindow(data.sendUserId + 'ChatFriendWindow', 'body', '和用户' + data.sendUserId + '交谈', chatFriendContent(data.sendUserId));		
		}
		//如果窗口被关闭，而对象存在，则恢复窗口
		if(tempApp.windows[data.sendUserId + 'ChatFriendWindow'].close){
			app.recoverWindow(data.sendUserId + 'ChatFriendWindow', 'body');
		}
		//为窗口添加发给这个窗口的消息
		//首先获得窗口输出区域
		var outputArea = tempApp.windows[data.sendUserId + 'ChatFriendWindow'].contentArea.content.outputArea;
		//把data.sendUserId:data.message添加到ouputArea中
		outputArea.val(outputArea.val() + data.sendUserId + '：' + data.message + '\n');
		
	});
		
	this.friendSocket.on('friend socket error', function(err){
		console.log(err);
	});
}
//对friendList进行数据转换
function friendNodeList(friendList){
	var friendNodeList = [];
	if(friendList.length == 0){
		friendNodeList.push($('<li>' + '无好友' + '</li>'));
	}
	for(var index = 0; index < friendList.length; index++){
		var liNode = $('<li></li>');
		liNode.append($('<div id = "friend' + friendList[index] + '" class = "chatFriendButtonStyle">' + friendList[index] + '</div>').toCreateChatFriendWindowButton(friendList[index]));
		liNode.append($('<div class = "deleteFriendButtonStyle">删除</div>').toDeleteFriendButton(friendList[index]));
		friendNodeList.push(liNode);
		
	}
	return friendNodeList;
}
//将数据转换后的friendNodeList添加到friendListArea中，由friendListArea调用
function changeFriendListArea(friendNodeList){
	//先清空friendListArea
	console.log('i m here');
	this.empty();
	while(friendNodeList.length != 0){
		this.append(friendNodeList.shift());
	}
}

//由app调用，自动触发，初始化好友列表，是否应该改为由登陆按钮触发？
function loadFriendList(){
	console.log('loadFriendList被调用', this);
	if(this.friendSocket){
		var friendSocket = this.friendSocket;
		//客户端主动向服务器的socket的load friendList事件发送自己的userId，请求好友列表
		friendSocket.emit('load friendList', this.user.userId);
	}else{
		console.log('error:还没有建立friendSocket');
	}
}
//对queryUser进行数据转换
/**
 *
 *div#queryUserResult 
 *	span #{user.user_id}
 *	input#add_friends_button(type = 'button', value = '加好友')
 *
 */
function queryUserContent(queryUser){
	var content = [];
	content[0] = $('<div id = "queryUserResult"></div>');
	//检查是否查询到了用户
	if(queryUser == null){
		content[0].append($('<span>' + '没有查询到用户' + '</span>'));		
	}else{
		content[0].append($('<span id = "resultUserId">' + queryUser.userId + '</span>'));
		var addFriendButton = $('<div id = "addFriendButton", class = "buttonStyle">加好友</div>');
		content[0].append(addFriendButton.toAddFriendButton());
		content[0].append($('<br />'));
		content[0].append($('<span id = "addFriendWarning", class = "warningStyle"></span>'))
	}
	return content;
	
}

//requestUserId是发出好友请求的一方，receiveUserId是接收好友请求的一方
$.fn.toAddFriendButton = function(){
	this.click(function(){
		var receiveUserId = $('#resultUserId').text();
		console.log(receiveUserId);
		if(receiveUserId == app.user.userId){
			var addFriendWarning = $('#addFriendWarning');
			addFriendWarning.text('');
			addFriendWarning.text('不能添加自己为好友');
			addFriendWarning.show('slow').hide('slow');
		}else if(match(receiveUserId, app.user.friendList)){
			var addFriendWarning = $('#addFriendWarning');
			addFriendWarning.text('');
			addFriendWarning.text('已添加为好友');
			addFriendWarning.show('slow').hide('slow');
		}else{
			//添加好友逻辑
			var addFriendWarning = $('#addFriendWarning');
			addFriendWarning.text('');
			addFriendWarning.text('请求已发出');
			addFriendWarning.show('slow').hide('slow');
			//发送加好友请求
			app.friendSocket.emit('add friend', {'requestUserId':app.user.userId, 'receiveUserId':receiveUserId});
		}
	});
	return this;
}

//注意content中如果使用app.windows['messageWindow']，那么应确保这个窗口对象在创建content函数执行前被创建
function confirmContent(message){
	var content = [$('<div>' + message + '</div>')];
	content.push($('<div class = "buttonStyle">确定</div>').toCloseButton(app.windows['messageWindow']));
	return content;
}

function confirmFriendContent(message, requestUserId){
	var content = [$('<div>' + message + '</div>')];
	console.log('app',app);
	content.push($('<div id = "acceptButton" class = "buttonStyle">接受</div>').toConfirmFriendButton(requestUserId).toCloseButton(app.windows['messageWindow']));
	content.push($('<div id = "refuseButton" class = "buttonStyle">拒绝</div>').toDenyFriendButton(requestUserId).toCloseButton(app.windows['messageWindow']));
	return content;
}
$.fn.toConfirmFriendButton = function(requestUserId){
	this.click(function(){
		var friendSocket = app.friendSocket;
		//当前用户是接收方，用户接受了对方添加好友的请求
		friendSocket.emit('confirm friend',{'receiveUserId':app.user.userId, 'requestUserId':requestUserId, 'status':true});
	});
	return this;
};
$.fn.toDenyFriendButton = function(requestUserId){
	this.click(function(){
		var friendSocket = app.friendSocket;
		//当前用户是接收方，用户拒绝了对方添加好友的请求
		friendSocket.emit('confirm firend',{'receiveUserId':app.user.userId, 'requestUserId':requestUserId, 'status':false});	
	});
	return this;
};
$.fn.toDeleteFriendButton = function(deleteUserId){
	this.click(function(){
		var friendSocket = app.friendSocket;
		friendSocket.emit('delete friend',{'requestUserId':app.user.userId, 'deleteUserId':deleteUserId});
	});
	return this;
};
$.fn.toCreateChatFriendWindowButton = function(receiveUserId){
	this.click(function(){
		//主动发起会话创建创建聊天窗口
		app.createWindow(receiveUserId + 'ChatFriendWindow', 'body', '和用户' + receiveUserId + '交谈', chatFriendContent(receiveUserId));

	});
	return this;
};

function chatFriendContent(receiveUserId){
	var content = [$('<div id = "chatFriendContent"></div>')];
	//把outputArea和inputArea作为属性添加到content上
	var outputArea = $('<textarea id = "' + receiveUserId + 'FriendMessageOutputArea" class = "outputAreaStyle" readonly = "readonly"></textarea>');
	content.outputArea = outputArea;
	var inputArea = $('<textarea id = "' + receiveUserId + 'FriendMessageInputArea" class = "inputAreaStyle" ></textarea>');
	content.inputArea = inputArea;
	content[0].append(outputArea);
	content[0].append(inputArea);
	content[0].append($('<br />'));
	content[0].append($('<div id = "sendFriendMessageButton" class = "buttonStyle">发送</div>').toSendFriendMessageButton(receiveUserId));
	return content;
}
//data = {sendUserId,receiveUserId,message}
$.fn.toSendFriendMessageButton = function(receiveUserId){
	this.click(function(){
		console.log('testfriend', app.windows[receiveUserId + 'ChatFriendWindow']);
		//首先获得窗口输入区域和输出区域
		var inputArea = app.windows[receiveUserId + 'ChatFriendWindow'].contentArea.content.inputArea;
		var outputArea = app.windows[receiveUserId + 'ChatFriendWindow'].contentArea.content.outputArea;
		var friendSocket = app.friendSocket;
		//取得用户输入的消息
		var message = inputArea.val();
		//将消息发送给服务器
		friendSocket.emit('chat friend', {'sendUserId':app.user.userId, 'receiveUserId':receiveUserId, 'message':message});
		//把sendUserId:message添加到ouputArea中
		outputArea.val(outputArea.val() + app.user.userId + '：' + message + '\n');
		//清空inputArea
		inputArea.val('');
	});
	return this;
};
