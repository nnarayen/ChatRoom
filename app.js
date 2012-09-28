// Require dependencies
var app = require('http').createServer(handler)
, fs = require('fs')
, io = require('socket.io').listen(app);
 
// creating the server ( localhost:8080 )
app.listen(8080);
 
// on server started we can load our client.html page
function handler(req, res) {
  fs.readFile(__dirname + '/index.html', function(err, data) {
    if(err) {
      console.log(err);
      res.writeHead(500);
      return res.end('Error loading client.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}
 
// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
 
  socket.on('set nickname', function(nickname) {
    // Save a variable 'nickname'
    socket.set('nickname', nickname, function() {
      console.log('Connect', nickname);
      var connected_msg = '<b>' + nickname + ' is now connected!</b>';
 
      io.sockets.volatile.emit('broadcast_msg', connected_msg);
    });
  });
 
  socket.on('emit_msg', function (msg) {
    // Get the variable 'nickname'
    socket.get('nickname', function (err, nickname) {
      console.log('Chat message by', nickname);
      var currentTime = new Date();
      var minutes = currentTime.getMinutes();
      var str_minutes = minutes < 10 ? '0' + minutes : '' + minutes
      var hours = currentTime.getHours();
      var extra = hours > 12 ? 'PM' : 'AM';
      hours %= 12;
      var string = '(' + hours + ':' + str_minutes + ' ' + extra + ')';
      io.sockets.volatile.emit('broadcast_msg' , '<strong>' + nickname + '</strong>: ' + msg + ' ' + string);
    });
  });
 
  // Handle disconnection of clients
  socket.on('disconnect', function () {
    socket.get('nickname', function (err, nickname) {
      console.log('Disconnect', nickname);
      var disconnected_msg = '<b>' + nickname + ' has disconnected.</b>'
 
      // Broadcast to all users the disconnection message
      io.sockets.volatile.emit('broadcast_msg' , disconnected_msg);
    });
  });
});