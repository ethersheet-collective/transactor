var uuid = require('node-uuid');

var Transactor = module.exports = function(o){
  o = o || {};
  this.sockets = {};
  this.onTransaction(o.transaction_handler || function(){});
  this.onClose(o.close_handler || function(){});
};

Transactor.prototype.onTransaction = function(transaction_handler){
  this.transaction_handler = transaction_handler;
};

Transactor.prototype.onClose = function(close_handler){
  this.close_handler = close_handler;
};

Transactor.prototype.addSocket = function(channel,socket){
  var trans = this;
  var socket_id = socket.id || uuid.v4();
  if(!socket.id) { socket.id = socket_id; }

  // add socket to socket pool
  if(!this.sockets[channel]) this.sockets[channel] = {};
  this.sockets[channel][socket_id] = socket;

  // add the supplied transaction handler to each channel on the socket
  socket.on('data',function(data){
    console.log('received',channel,data);
    trans.transaction_handler(channel,socket,data,function(err,data){
      if(err) return socket.emit('error',err,data);
      trans.broadcast(socket,channel,data);
    });
  });

  // add the supplied disconnection handler
  socket.on('close', function(){
    trans.close_handler(channel,socket);
    delete trans.sockets[channel][socket_id];
  });

};

Transactor.prototype.broadcast = function(socket,channel,data){
  if(!this.sockets[channel]) return;
  console.log('broadcast',channel,data, socket.id);
  for( var socket_id in this.sockets[channel] ){
    if(socket_id == socket.id) { continue; } // do not send back to the originating socket
    this.sockets[channel][socket_id].write(data);
  }
};
