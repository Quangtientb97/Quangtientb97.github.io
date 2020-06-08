var crypto = require('crypto');
var uuid = require('uuid');
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var fs = require("fs");
server.listen(8080);
require('events').EventEmitter.prototype._maxListeners = 100;
var con = mysql.createConnection({
 host: "b034kdbmfuvinopgjuse-mysql.services.clever-cloud.com",
  user: "u20nnlbcqemoj3jy",
  password: "t7zRtkGhq0F1svEcGKlC",
   database: "b034kdbmfuvinopgjuse"
});
var ketqua;




/*password ---------------------------------------------------------*/
var getRandomString =function(length){
	return crypto.randomBytes(Math.ceil(length/2))
	.toString('hex') // convert to hexa
	.slice(0,length); // return required number of char
};

var sha512 = function(password,salt){
	var hash = crypto.createHmac('sha512',salt); 
	hash.update(password);
	var value = hash.digest('hex');
	return{
		salt:salt,
		passwordHash:value
	};
};

function saltHashPassword(userPassword){
	var salt = getRandomString(16);
	var passwordData = sha512(userPassword,salt);
	return passwordData;
};

function checkHashPassword(userPassword,salt){

	var passwordData = sha512(userPassword,salt);
	return passwordData;

};
/*end passwword-----------------------------------------------------------*/

/*bat su kien ket noi server-------------------------------------------------*/
io.sockets.on('connection', function(socket){
	// dang ki tai khoan
	socket.on('client-dang-ki-user', function(data){
		//var ketqua;
		//console.log(data);
		var name     		= data.name;
		var email    		= data.email;
		var password 		= data.password;
		var uid 			= uuid.v4();
		var plaint_password = password;
		var hash_data 		= saltHashPassword(plaint_password);
		var password  		= hash_data.passwordHash.slice(0,16);
		//console.log(password);
		var salt 			= hash_data.salt;
		
	  
		con.query('SELECT * FROM users where email=?',[email], function(err,result, fields){
			con.on('error',function(err){
				console.log('mysql error 78',err);
			});

			if (result && result.length){
				ketqua = false;
				
				console.log("tai khoan da ton tai ");
			}
			else{
				ketqua = true;
				let sql1 = `INSERT INTO users(unique_id, name, email, encrypted_password, salt, create_at) values (  \'${uid}\', \'${name}\', \'${email}\', \'${password}\', \'${salt}\', CURTIME())` ;
				con.query(sql1, function (err) {
						console.log('mysql error 90',err);
						//console.log('khong thanh cong');						
				});
				console.log('thanh cong');
				/*con.query('INSERT INTO `user`(`unique_id`, `name`, `email`, `encrypted_password`, `salt`, `create_at`, `updated_at`) VALUES (?,?,?,?,?,NOW(),NOW())',[uid,name,email,password,salt],function(err,result, fields){
					con.on('error',function(err){
						console.log('mysql error',err);
						console.log('khong thanh cong');						
				});
				console.log('thanh cong');
				//socket.emit('ket-qua-dang-ki',{noidung: ketqua});
				});*/
			}
			socket.emit('ket-qua-dang-ki',{noidung: ketqua});
		});	
	});
	// dang nhap
	socket.on('client-dang-nhap-user', function(data){
		var email    	  = data.email;
		var user_password = data.password;
		
		con.query('SELECT * FROM users where email=?',[email], function(err,result, fields){
			con.on('error',function(err){
				console.log('mysql error 113',err);
			});
			if (result && result.length){
				var salt = result[0].salt;
				var encrypted_password = result[0].encrypted_password;
				socket.id          = result[0].unique_id;
				var hashed_password = checkHashPassword(user_password,salt).passwordHash.slice(0,16);
				if (encrypted_password == hashed_password) {
					ketqua = true;
					console.log('dang nhap thanh cong');
					console.log(result[0].unique_id);
					console.log('socket.id '+socket.id);
				}
				else{
					ketqua = false;
					console.log('dang nhap k thanh cong');
				}
			}
			else{
				ketqua = false;
				console.log('dang nhap k thanh cong');
			}
			socket.emit('ket-qua-dang-nhap',{noidung: ketqua});
		});
	});
	
	// test gui nhan du lieu
	socket.on('receive-motor', function(data){
		console.log(data);
		var rota      = data.rota;
		var mode      = data.mode;
		var device_id = data.device_id;
		var noidung;
		var dulieu = data.rota + ' ' + data.mode ;		
		// gửi sang thiết bị
		//io.to(`${device_id}`).emit('send-motor', dulieu);
		io.sockets.emit('send-motor', dulieu); // gửi cho tất cả client
		console.log(dulieu);
	});
	//update_data device
	socket.on('update_data', function(data){
		console.log(data);
		var chieuquay = data.chieuquay;
		var tocdo     = data.tocdo;
		var device_id = data.device_id;
		con.query(`CREATE TABLE IF NOT EXISTS device${data.device_id}_log (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,ThoiGian DATETIME, chieuquay VARCHAR(255), tocdo INT(10)) ENGINE = InnoDB`, function(err,result, fields){
			con.on('error', function(err){
				console.log('mysql error 142',err);
			});
		});
		con.query('UPDATE devices SET tocdo = ? , chieuquay = ?  WHERE device_id = ?', [ tocdo , chieuquay , device_id ] , function(err,result, fields){
			con.on('error', function(err){
				console.log('mysql error 152',err);
			
		});
			console.log(result);
		});
		
		con.query(`INSERT INTO device${data.device_id}_log ( ThoiGian , chieuquay , tocdo )  VALUES  (CURTIME(), \'${chieuquay}\', \'${tocdo}\')`,function(err,result, fields){
			con.on('error', function(err){
				console.log('mysql error 148',err);
			});
			console.log('log',result);
		});		
	
});


	//tao socket_id
	socket.on('join-room-device', function(data){
		socket.id = data;
		console.log('socket id: ' + socket.id);
	});	




//end io
});