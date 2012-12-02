// Require dependencies
var app = require('http').createServer(handler)
, fs = require('fs')
, io = require('socket.io').listen(app);
 
// creating the server ( localhost:8080 )
app.listen(8080);
//app.listen(8080, "testapps.jit.su");

var user_arr = []
var server_arr = []
 
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
  	socket.set('room_name', 'General', function() {});
    // Save a variable 'nickname'
    socket.set('nickname', nickname, function() {
      
      console.log('Connect', nickname);
      var connected_msg = '<b>' + nickname + ' is now connected!</b>';
      var new_user_msg = '' + nickname;
      user_json = {'name': nickname, 'curr_room': 'General'};
      user_arr.push(user_json);
      
      io.sockets.volatile.emit('broadcast_msg', connected_msg, 'everybody_receives');
      io.sockets.volatile.emit('update_users', user_arr, 'General', user_arr);
      io.sockets.volatile.emit('update_rooms', server_arr);
      io.sockets.volatile.emit('welcome', nickname);
    });
  });
  
  socket.on('add_room', function(room_name) {
  	  var new_room_message = '' + room_name;
  	  var json = {'room_name': room_name, 'users': []};
  	  server_arr.push(json);
  	  io.sockets.volatile.emit('adding_room', new_room_message);
  });
  
  socket.on('joining_room', function(chat_room_name) {
  	socket.get('nickname', function (err, nickname) {
  		socket.set('room_name', chat_room_name, function() {
  			for (var i=0; i<user_arr.length; i++) {
  				if (user_arr[i]['name'] == nickname) {
  					user_arr[i]['curr_room'] = chat_room_name;
  				}
  			}
  			
  			if (chat_room_name == 'General') {
  				var all_rooms = getJoinedRooms(nickname);
  				for (var i=0; i<all_rooms.length; i++) {
  					io.sockets.volatile.emit('update_users', all_rooms[i]['users'], all_rooms[i]['room_name'], user_arr);
  				}
  				io.sockets.volatile.emit('update_users', user_arr, 'General', user_arr);
  				return;
  			}
  			for (var i=0; i<server_arr.length; i++) {
  				if (server_arr[i]['room_name'] == chat_room_name) {
  					if (!alreadyInRoom(server_arr[i]['users'], nickname)) {
  						server_arr[i]['users'].push(nickname);
  						io.sockets.volatile.emit('broadcast_msg', '<strong>' + nickname + '</strong> has joined ' + chat_room_name + '!', chat_room_name);
  					}
  					var all_rooms = getJoinedRooms(nickname);
  					for (var i=0; i<all_rooms.length; i++) {
  						io.sockets.volatile.emit('update_users', all_rooms[i]['users'], all_rooms[i]['room_name'], user_arr);
  					}
  					io.sockets.volatile.emit('update_users', user_arr, 'General', user_arr);
  					break;
  				}
  			}
  		});
  	});
  });
  
  function alreadyInRoom(array, name) {
  	for (var i=0; i<array.length; i++) {
  		if (array[i] == name) {
  			return true;
  		}
  	}
  	return false;
  }
  
  function getJoinedRooms(name) {
  	var result_arr = []
  	for (var i=0; i<server_arr.length; i++) {
  		var users = server_arr[i]['users'];
  		for (var j=0; j<users.length; j++) {
  			if (users[j] == name) {
  				result_arr.push(server_arr[i]);
  			}
  		}
  	}
  	return result_arr;
  }
  	
 
  socket.on('emit_msg', function (msg) {
  	
    // Get the variable 'nickname'
    socket.get('nickname', function (err, nickname) {
    	//Get variable room_name
        socket.get('room_name', function(err2, room_name) {
    	  console.log('Chat message by', nickname);
     	  var currentTime = new Date();
     	  var minutes = currentTime.getMinutes();
     	  var str_minutes = minutes < 10 ? '0' + minutes : '' + minutes
     	  var hours = currentTime.getHours();
     	  var extra = hours > 12 ? 'PM' : 'AM';
     	  hours%=12;
     	  var time_string = '(' + hours + ':' + str_minutes + ' ' + extra + ')';
      	  io.sockets.volatile.emit('broadcast_msg' , '<strong>' + nickname + '</strong>: ' + msg + ' ' + time_string, room_name);
      	});
    });
  });
 
  // Handle disconnection of clients
  socket.on('disconnect', function () {
    socket.get('nickname', function (err, nickname) {
      console.log('Disconnect', nickname);
      var disconnected_msg = '<b>' + nickname + ' has disconnected.</b>'
 
      // Broadcast to all users the disconnection message
      	for (var i=0; i<server_arr.length; i++) {
      		var server_info_users = server_arr[i]['users'];
      		for (var j=0; j<server_info_users.length; j++) {
      			if (server_info_users[j] == nickname) {
      				server_info_users.splice(j, 1);
      				if (server_info_users.length == 0) {
      					server_arr.splice(i, 1);
      					io.sockets.volatile.emit('update_rooms', server_arr);
      				}
      				else { 
      					io.sockets.volatile.emit('update_users', server_info_users, server_arr[i]['room_name'], user_arr);
      				}
      			}
      		}
      	}
      
        for (var i=0; i<user_arr.length; i++) {
        	if (user_arr[i]['name'] == nickname) {
        		user_arr.splice(i, 1);
      	  	    break;
      	    }
        }
  		io.sockets.volatile.emit('update_users', user_arr, 'General', user_arr);
        io.sockets.volatile.emit('broadcast_msg', disconnected_msg, 'everybody_receives');
    });
  });
});