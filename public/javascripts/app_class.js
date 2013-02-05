/**
 *浏览器javascript的另一个特点就是面向按钮的
 *为html元素添加按钮时，应该把添加函数直接依附在html元素上，这样方便定位元素！
 *注意jQuery对象调用了其方法后返回的仍然是原来的jQuery对象
 *
 /////////////////////新想法！！////////////////////
 *title.addclosebutton()接口的灵活性最好，但是不实用，为了增加灵活性可以给函数多增加几个参数
 *比如element.toclosebutton('parent')可以在其父节点上增加按钮还可以把各种按钮集合成toButton方法
 *比如element.toButton('close','mainWindow')，总之，给函数多添加几个参数可以增加灵活性
 *
 *设计的类应该是面向按钮和区域的，用户可以为一个窗口创建一个区域并给这个区域添加各种对象
 *
 */
/**
 *app类
 *var app = Application();
 *app.user.userId
 *app.user.friendList
 *app.user.groupList
 *app.group = [];
 *app.Windows = [];
 *app.connect()
 *app.loadFriend()
 *app.createWindowArea('body')
 *app.createWindow('mainWindow')
 *app.changeWindowContentArea()

 *window、title、content对象其实都是jquery对象
 *window类
 *window.titleArea
 *window.contentArea
 *window.addButton()
 *window.createTitleArea()
 *window.createContentArea(createTab())
 *Title类
 *备选方案0title.buttons = []
 *备选方案1title.img.toButton()
 *备选方案2:
 *title.createButton()
 *title.addButtonTo(buttonPosition)
 *Content类
 *content.buttons = []
 *content.createButton();
 */

var display;
//如果字符串在数组中则返回true否则返回false
function match(matchString, matchArray){
	for(var index = 0; index < matchArray.length; index++){
		if(matchArray[index] == matchString){
			return true;
		}
	}
	return false;
}
//创建窗口，由app对象调用
//windowPosition必须是文档元素名，且唯一
function createWindow(windowId, windowPosition, title, content){
	//为app创建一个名为windowId的window对象
	this.windows[windowId] = $('<div id=' + windowId + '></div>').addClass('windowStyle');
	//把window对象添加到positon节点内
	this.windows[windowId].appendTo($(windowPosition));
	//为window对象创建titleArea对象
	this.windows[windowId].createWindowTitleArea(title);
	//为window对象创建contentArea对象
	this.windows[windowId].createWindowContentArea(content);
	//返回app
	return this;
};
//恢复关闭的窗口，由app对象调用
function recoverWindow(windowId, windowPosition){
	if(this.windows[windowId]){
		this.windows[windowId].appendTo($(windowPosition));
	}else{
		console.log('不存在这个窗口对象，无法恢复');
	}
}

//修改contentArea的内容,由window对象调用，现在是由app对象调用，以后再改
function changeWindowContentArea(windowId, content){
	this.windows[windowId].contentArea.empty();
	if(content){
		//现在contentArea中保存新的content
		this.windows[windowId].contentArea.content = content;
		//传过来的content是一个数组
		/*
		while(content.length != 0){
			//将窗口内容依次插入content对象中
			this.windows[windowId].contentArea.append(content.shift());			
		}*/
		for(var index = 0; index < content.length; index++){
			this.windows[windowId].contentArea.append(content[index]);
		}
	}else{
		//此时的content是undefined
		this.windows[windowId].contentArea.append('未定义content');
	}
	return this;
}

//创建标题,由window对象调用，window对象是一个jQuery对象
$.fn.createWindowTitleArea = function(title){
		//为window对象创建title对象
		this.titleArea = $('<div></div>').addClass('titleAreaStyle');
		//将titleArea对象添加至window对象中
		this.append(this.titleArea);
		//创建img对象，将img对象添加到title对象中
		var imgNode = $('<img src = "http://localhost/images/close.gif"/>').addClass('closeButtonStyle');
		//将img对象转换成关闭按钮
		imgNode.toCloseButton(this);
		this.titleArea.append(imgNode);
	if(title){
		//先在titleArea中保存title
		this.titleArea.title = title;
		//创建标题的内容，并添加至title对象中
		$('<div>' + title + '</div>').appendTo(this.titleArea);	
	}else{
		//先在titleArea中保存默认title内容
		this.titleArea.title = 'welcome to Chat';
		$('<div>' + 'welcome to Chat' + '</div>').appendTo(this.titleArea);	
	}
	return this;
};

//将调用对象转换成关闭按钮，会关闭传过来的对象
$.fn.toCloseButton = function(window){
		this.click(function(){
			//清空closeButton所属的title对象的window对象，parent()返回自己的父元素
			//window.empty();
			//从DOM中删除window，但window对象仍然存在且可以通过app.windows[]访问并再次添加进DOM中
			window.detach();
			//将窗口的close设为true，表示这个窗口对象仍然存在，可以通过recoverWindow恢复
			window.close = true;
		});
		return this;
};

//创建窗口内容，由window对象调用
$.fn.createWindowContentArea = function(content){
	this.close = false;
	this.contentArea = $('<div></div>').addClass('contentAreaStyle');
	this.append(this.contentArea);
	if(content){
		//传过来的content是一个数组
		//[] == []返回false
		//[] != []返回true
		//先在contentArea中保存content
		this.contentArea.content = content;
		//将窗口内容依次插入contentArea对象中
		/*while(content.length != 0){			
			this.contentArea.append(content.shift());
		}*/
		for(var index = 0; index < content.length; index++){
			this.contentArea.append(content[index]);
		}
	}else{
		//此时的content是undefined
		this.contentArea.append('未定义content');
	}
	return this;
};

var app;


$(document).ready(function(){
	app = Object();
	app.user = Object();
	app.windows = [];
	app.createWindow = createWindow;
	app.changeWindowContentArea = changeWindowContentArea;
	app.recoverWindow = recoverWindow;
	
	app.createWindow('mainWindow', 'body', '主窗口', indexContent());

	//是在这里调用app.connect()把创建连接的时间提前，还是等用户登录以后是否更好?
	app.friendConnect = friendConnect;
	app.groupConnect = groupConnect;
	
	app.loadFriendList = loadFriendList;
	app.loadGroupList = loadGroupList;
});
//定义空content，返回一个只包含一个div元素的数组
function emptyContent(){
	var content = [$('<div></div>')];
	return content;
}
//定义主页content，这是一个函数，返回数组
function indexContent(){
	var content = [$('<div></div>')];
	content[0].append($('<h1>Chat</h1>'));
	var loginNode = $('<div id = "loginButton", class = "buttonStyle">登录</div>');
	loginNode.toLoginButton();
	content[0].append(loginNode);
	content[0].append($('<a id = "registerUserButton", href = "/register/user", target="registerUserPage">注册</a>'));
	return content;	
}

//定义用户登录按钮，用于载入登录界面或用户标签界面
$.fn.toLoginButton = function(){
	//为createIndexContent添加登录按钮，点击后发送GET /login请求，单击登录按钮后会得到用户登录页面，或用户标签页面
	this.click(function(){
		//载入loginForm或者tabs
		//发送请求给服务器，让服务器检查是否还保持着session
		$.get('/login', function(data){
			if(data.result == true){
				//用户刷新页面后页面中的对象会被清空，所以需要给重新生成的app.user添加userId
				app.user.userId = data.user.userId;

				//如果session仍然保持着用户Id那么就载入用户标签页面
				app.changeWindowContentArea('mainWindow', tabsContent());

				//载入好友列表
				//connectFriend(app.user.userId, undefined, 'loadFriend');
			}else if(data.result == false){
				//如果session没有保持，此时载入用户登录界面
				app.changeWindowContentArea('mainWindow', loginContent());
			}
		});
	});
	return this;
};

//定义用户登录界面的Content
function loginContent(){
	var content = [$('<form method = "post"></form>')];
	content[0].append($('<span>用户名：</span>'))
	.append($('<br />'))
	.append($('<input type = "text", id = "userId", name = "userId"/>'))
	.append($('<br />'))
	.append($('<span>密码：</span>'))
	.append($('<br />'))
	.append($('<input type = "text", id = "password", name = "password"/>'))
	.append($('<br />'));
	//注意这里如果是submit按钮的话一定会发送一个post请求，所以这里的type属性应该是button
	inputNode = $('<input type = "button", id = "authenticate" value = "submit" />');
	inputNode.toAuthenticateButton();
	content[0].append(inputNode);
	return content;
}

//认证按钮
$.fn.toAuthenticateButton = function(){
	this.click(function(){
		var userId = $('#userId').val();
		var password = $('#password').val();
		//发送用户数据
		$.post('/login', {'userId':userId, 'password':password}, function(data){
			console.log(data.result);
			if(data.result == true){
				//在认证用户后保存用户Id
				app.user.userId = userId;
				//在认证用户后首先载入用户标签页面
				app.changeWindowContentArea('mainWindow', tabsContent());
				//addButtonForTabs;
				//然后在用户标签页面中载入好友列表和群列表
				//loadFriend(userId);
				//connectFriend(app.user.userId, undefined, 'loadFriend');	
			}else if(data.result == false){
				//返回false
				//如果返回false，此时载入用户登录界面
				app.changeWindowContentArea('mainWindow', loginContent());		
			}else{
				console.log(data.result);
			}
		}, 'json');
	});
	return this;
};

/*
div
	ul#tabs
		li.selectedTabs 好友
		li 群
	div#tabsContent
		div.selectedTabsContentStyle
			ul#friendList.userListStyle 好友列表
				li 通过socket.io通信获得好友Id
			div#queryFriend 查找好友
			div#logout 退出
		div
			div#createGroup 创建群
			ul#groupList.userListStyle 群列表	
				li
			div#queryGroup 查找群
			div#logout 退出
*/
//创建用户标签页
function tabsContent(){
	//一开始就先建立连接
	app.friendConnect();
	app.groupConnect();
	
	var content = [$('<div></div>')];
	var tabs = $('<ul id = "tabs"></ul>');
	var tabsContent = $('<div id = "tabsContent"></div>');
	//给content[0]添加tabs和tabsContent
	content[0].append(tabs);
	content[0].append(tabsContent);

	//给tabs添加内容
	tabs.append($('<li class = "selectedTabsStyle">好友</li>'))
	.append($('<li>群</li>'));

	var divSelectedNode = $('<div class = "selectedTabsContentStyle"></div>');
	var divNode = $('<div></div>')
	//给tabsContent添加内容
	tabsContent.append(divSelectedNode);
	tabsContent.append(divNode);
	//创建好友列表
	if(!app.user.friendList){
		console.log(app.user.friendList);
		app.loadFriendList();
		//friendList并不会马上有值，马上调用console.log(app.user.friendList)会输出undefined
	}
	var friendListArea = $('<ul id = "friendListArea" class = "listAreaStyle">好友列表</div>');
	//在content中保存friendListArea
	content.friendListArea = friendListArea;
	friendListArea.append($('<li>正在载入好友列表</li>'));
	
	//创建群列表
	if(!app.user.groupList){
		console.log(app.user.groupList);
		app.loadGroupList();
	}
	var groupListArea = $('<ul id = "groupListArea" class = "listAreaStyle">群列表</div>');
	//在content中保存groupListArea
	content.groupListArea = groupListArea;
	groupListArea.append($('<li>正在载入群列表</li>'));
	
	//给divSelectedNode添加内容
	divSelectedNode.append(friendListArea);
	var queryFriendButton = $('<div id = "queryFriendButton", class = "buttonStyle">查找好友</div>');
	divSelectedNode.append(queryFriendButton.toCreateQueryFriendWindowButton());
	var logoutButton = $('<div id = "logoutButton", class = "buttonStyle">退出</div>');
	divSelectedNode.append(logoutButton.toLogoutButton());
	
	//给divNode添加内容
	divNode.append($('<a id = "createGroupButton", href = "/create/group", target="createGroupPage">创建群</a>'));
	divNode.append(groupListArea);
	var queryGroupButton = $('<div id = "queryGroupButton", class = "buttonStyle">查找群</div>');
	divNode.append(queryGroupButton.toCreateQueryGroupWindowButton());
	var logoutButton = $('<div id = "logoutButton", class = "buttonStyle">退出</div>');
	divNode.append(logoutButton.toLogoutButton());
	
	//添加标签页切换效果
	tabs.children().each(function(index){
		$(this).toSelectTab(index);
	});
	return content;
}

$.fn.toSelectTab = function(index){
	this.click(function(){
		$('#tabsContent>div.selectedTabsContentStyle').removeClass('selectedTabsContentStyle');
		$('#tabs>li.selectedTabsStyle').removeClass('selectedTabsStyle');
		$(this).addClass('selectedTabsStyle');
		$('#tabsContent>div').eq(index).addClass('selectedTabsContentStyle');
	});
}

//点击后弹出好友查询框
$.fn.toCreateQueryFriendWindowButton = function(){
	this.click(function(){
		//弹出的查找好友窗口内容
		function queryFriendContent(){
			var content = [];
			var formNode = $('<form method = "post"></form>');
			var spanNode = $('<span>用户名：</span>');
			formNode.append(spanNode);
			var inputNode = $('<input type = "text", id = "queryUserId", name = "queryUserId" />');
			formNode.append(inputNode);
			formNode.append($('<br />'));
			var queryButton = $('<input type = "button", id = "queryUserButton", value = "查找用户" />');
			formNode.append(queryButton.toQueryUserButton());
			content.push(formNode);
			return content;
		}
		//生成查找窗口
		app.createWindow('queryFriendWindow', 'body', '查找好友', queryFriendContent());
	});	
	return this;
};

//点击后查找用户
$.fn.toQueryUserButton = function(){
	this.click(function(){
		var queryUserId = $('#queryUserId').val();
		if(queryUserId.length == 0){
			alert('查询名不能为空');
		}else{			
			if(app.friendSocket){
				console.log(app.friendSocket);
				var friendSocket = app.friendSocket;
				//客户端主动向服务器的socket的query friend事件发送queryUserId，请求查询好友
				friendSocket.emit('query user', {'userId':app.user.userId, 'queryUserId':queryUserId});
			}else{
				console.log('error:还没有建立friendSocket');
			}
		}
	});
	return this;
}

//点击后弹出组查询框
$.fn.toCreateQueryGroupWindowButton = function(){
	this.click(function(){
		//生成查找组窗口的内容
		function queryGroupContent(){
			var content = [];
			var formNode = $('<form method = "post"></form>');
			var spanNode = $('<span>组名：</span>');
			formNode.append(spanNode);
			var inputNode = $('<input type = "text", id = "queryGroupId", name = "queryGroupId" />');
			formNode.append(inputNode);
			formNode.append($('<br />'));
			var queryButton = $('<input type = "button", id = "queryGroupButton", value = "查找组" />');
			formNode.append(queryButton.toQueryGroupButton());
			content.push(formNode);
			return content;
		}
		//生成查找组窗口
		app.createWindow('queryGroupWindow', 'body', '查找群', queryGroupContent());
	});	

	return this;
};

//点击后查找组
$.fn.toQueryGroupButton = function(){
	this.click(function(){
		var queryGroupId = $('#queryGroupId').val();
		if(queryGroupId.length == 0){
			alert('查询组名不能为空');
		}else{			
			if(app.groupSocket){
				console.log(app.groupSocket);
				var groupSocket = app.groupSocket;
				//客户端主动向服务器的socket的query group事件发送queryGroupId，请求查询组
				groupSocket.emit('query group', {'userId':app.user.userId, 'queryGroupId':queryGroupId});
			}else{
				console.log('error:还没有建立groupSocket');
			}
		}
	});
	return this;
}

//退出按钮
$.fn.toLogoutButton = function(){
	this.click(function(){
		//先清空user的数据
		delete app.user.userId;
		delete app.user.friendList;
		delete app.user.groupList;
		//然后在服务器端的session中删除用户
		$.get('/logout', function(data){
			if(data.result == true){
				//回到用户登录界面
				app.changeWindowContentArea('mainWindow', loginContent());	
			}else{
				console.log('Logout err');
			}
		});
	});
	return this;
};
