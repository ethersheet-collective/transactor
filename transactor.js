var uuid = require('node-uuid');

var Transactor = module.exports = function(o){
  o = o || {};
  if(typeof o.transaction_handler === 'function'){
    this.onTransaction(o.transaction_handler);
  }
  this.sockets = {};
};

Transactor.prototype.onTransaction = function(transaction_handler){
  this.transaction_handler = transaction_handler;
};

Transactor.prototype.addSocket = function(channel,socket){
  var trans = this;
  var socket_id = socket.id || uuid.v4();

  // add socket to socket pool
  if(!this.sockets[channel]) this.sockets[channel] = {};
  this.sockets[channel][socket_id] = socket;

  // add the supplied transaction handler to each channel on the socket
  socket.on('data',function(data){
    console.log('received',channel,data);
    trans.transaction_handler(channel,data,function(err,data){
      if(err) return socket.emit('error',err,data);
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
  console.log('broadcast',channel,data);
  for( var socket_id in this.sockets[channel] ){
    this.sockets[channel][socket_id].write(data);
  }
};
