var express = require('express');
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

var server = require("http").Server(app);
var io = require('socket.io')(server);
server.listen(8080);

io.on('connection', function (socket) { //Bắt sự kiện một client kết nối đến server
  console.log(socket.id + " connected");
  socket.join("control");
  socket.on('mode', function(data){
  	console.log("nhan mode");
  	io.sockets.in('control').emit('control_mode', data);
  });
});

app.get("/", function(req, res){
	res.render("trangchu");
})