var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*用这块代码就无法插入数据，也无法查询
db = mongoose.createConnection('mongodb://localhost/user');
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
	console.log('connection has initalled');
});
*/
//在客户端shell中输入show collections可知创建的集合的名称是users
db = mongoose.connect('mongodb://localhost/user');
var User = new Schema({
	userId:String,
	password:String,
	friendList:[String],
	groupList:[String]
});
//{friendId:String}{groupId:String}
mongoose.model('User', User);
exports.User = mongoose.model('User');

//用这块代码会无法查询，怎么回事？因为复制代码导致写成了exports.User
var Group = new Schema({
	groupId:String,
	memberList:[String],
	administratorList:[String]	//用户名的索引越小权利越大
});
mongoose.model('Group', Group);
exports.Group = mongoose.model('Group');
