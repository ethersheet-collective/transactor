var uuid = require('node-uuid');

var Transactor = function(o){
  o = o || {};
  if(typeof o.transaction_handler === 'function'){
    this.onTransaction(o.transaction_handler);
  }
  this.sockets = {};
};

module.exports = Transactor;

Transactor.prototype.onTransaction = function(transaction_handler){
  this.transaction_handler = transaction_handler;
};

Transactor.prototype.addSocket = function(channel,socket){
  var trans = this;
  var socket_id = uuid.v4(); 
  // add socket to socket pool
  if(!this.sockets[channel]) this.sockets[channel] = {};
  this.sockets[channel][socket_id] = socket;

  // add the supplied transaction handler to each channel on the socket
  socket.on('data',function(data){
    trans.transaction_handler(channel,data,function(err,data){
      if(err) return socket.error(err,data);
      trans.broadcast(channel,data);
    });
  });

  // add the supplied disconnection handler
  socket.on('close', function(){
    delete trans.sockets[channel][socket_id];
  });

};

Transactor.prototype.broadcast = function(channel,data){
  if(!this.sockets[channel]) return;
  for( var socket_id in this.sockets[channel] ){
    this.sockets[channel][socket_id].write(data);
  }
};
