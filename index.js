var crypto = require('crypto');
var uuid = require('uuid');
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

var server = require("http").Server(app);
var io = require('socket.io')(server);
server.listen(8080);

var conn = mysql.createConnection({
      host    : 'bsywt8xxwecvkrkhr23n-mysql.services.clever-cloud.com',
      user    : 'usu17j382kwvccl2',
      password: 'cujVo7AgzcaJf671v3bc',
      database: 'bsywt8xxwecvkrkhr23n',
});

/*---------------------------------------------------------------------------*/
//Giang
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

app.use(bodyParser.json()); //accept json params
app.use(bodyParser.urlencoded({extended: true})); // accept url encoded param

// register
app.post('/register/',(req,res,next)=>{

  var post_data = req.body;
  var uid = uuid.v4();
  var plaint_password = post_data.password;
  var hash_data = saltHashPassword(plaint_password);
  var password  = hash_data.passwordHash;
  var salt = hash_data.salt;
  var name = post_data.name;
  var email = post_data.email;

  con.query('SELECT * FROM user where email=?',[email], function(err,result, fields){
    con.on('error',function(err){
      console.log('mysql error',err);
    });

    if (result && result.length)
    res.json('Tài khoản đã tồn tại');
  else{
    con.query('INSERT INTO `user`(`unique_id`, `name`, `email`, `encrypted_password`, `salt`, `create_at`, `updated_at`) VALUES (?,?,?,?,?,NOW(),NOW())',[uid,name,email,password,salt],function(err,result, fields){
    con.on('error',function(err){
      console.log('mysql error',err);
      res.json('không thành công',err);
      
    });
    res.json('thành công');
  });
  }
  }); 
});


//login
app.post('/login/',(req,res,next)=>{
  var post_data = req.body;
  var user_password = post_data.password;
  var email = post_data.email;

  con.query('SELECT * FROM user where email=?',[email], function(err,result, fields){
    con.on('error',function(err){
      console.log('mysql error',err);
    });
    if (result && result.length){
      var salt = result[0].salt;
      var encrypted_password = result[0].encrypted_password;
      var hashed_password = checkHashPassword(user_password,salt).passwordHash.slice(0,16);
      if (encrypted_password == hashed_password) 
        res.end(JSON.stringify(result[0]));
      else
        res.end(JSON.stringify('Sai mật khẩu'));   
    }   
    else{
      res.json('Tài khoản chưa tồn tại');
    }
  });
});
//end Giang
/*-------------------------------------------------------------------------------*/
io.on('connection', function (socket) { //Bắt sự kiện một client kết nối đến server
  console.log(socket.id + " connected");


  //device
  socket.join("control");
  conn.connect(function (err){
    //if (err) throw err.stack;
    console.log("ket noi thanh cong");
    let sql0 = `CREATE TABLE IF NOT EXISTS device1_log (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, chieuquay VARCHAR(255), tocdo INT(10)) ENGINE = InnoDB` ;
      //console.log(sql0);
    conn.query(sql0, function (err) {
        //if (err) throw err;
        console.log('Tao bang thanh cong');
    });
  });
  socket.on('mode', function(data){
  	console.log("nhan mode");
  	io.sockets.in('control').emit('control_mode', data);
  });
  socket.on('client-gui-user', function(data){
  	console.log("nhan client-gui-user");
  });  
  socket.on('update_data', function (data) { //thông số động cơ
    //socket.broadcast.emit('news', data); 
    console.log("nhan update");
    var data_json = JSON.stringify(data)
    console.log(".");
    console.log(data);
    console.log("devide id: " + data.device_id);
    console.log("tocdo: " + data.tocdo);
    console.log("chieuquay: " + data.chieuquay);
    conn.connect(function (err){
    //if (err) throw err.stack;
      //nếu thành công
      let sql0 = `CREATE TABLE IF NOT EXISTS device${data.device_id}_log (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,ThoiGian DATETIME DEFAULT CURTIME(), chieuquay VARCHAR(255), tocdo INT(10)) ENGINE = InnoDB` ;
      //console.log(sql0);
      conn.query(sql0, function (err) {
          //if (err) throw err;
          //console.log('Tao bang thanh cong');
      });
      let sql1 = `INSERT INTO device${data.device_id}_log(chieuquay, tocdo) values (  \'${data.chieuquay}\', \'${data.tocdo}\')` ;
      //console.log(sql1);
      conn.query(sql1, function (err) {
          //if (err) throw err;
          //console.log('Thay doi thanh cong');
      });
    });
  });

  //app

});

app.get("/admin", function(req, res){
	res.render("trangchu");
})