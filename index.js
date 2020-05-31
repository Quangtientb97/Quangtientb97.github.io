var express = require('express');
var app = express();
var mysql = require('mysql');
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

io.on('connection', function (socket) { //Bắt sự kiện một client kết nối đến server
  console.log(socket.id + " connected");
  socket.join("control");
  conn.connect(function (err){
    if (err) throw err.stack;
    console.log("ket noi thanh cong");
    let sql0 = `CREATE TABLE IF NOT EXISTS device_log (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,ThoiGian DATETIME DEFAULT CURTIME(), chieuquay VARCHAR(255), tocdo INT(10)) ENGINE = InnoDB` ;
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
});

app.get("/", function(req, res){
	res.render("trangchu");
})