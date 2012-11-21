var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Transactor = function(server,transaction_handler){
  this.transaction_handler = transaction_handler || this.defaultEventHandler;
  if(server) this.setServer(server); 
};

inherits(Transactor,EventEmitter);
module.exports = Transactor;

// handler interface:  function eventHandler(... data,cb)
// callback interface: function cb(err,data)
Transactor.prototype.defaultEventHandler = function(){ 
  arguments[arguments.length - 1](null,arguments[arguments.length - 2]); 
};

Transactor.prototype.setServer = function(server){
  var trans = this;
  this.server = server;
  this.server.on('connection', function(socket){
    trans.addSocket(socket);
  });
};

Transactor.prototype.addSocket = function(channel,socket){
  var trans = this;

    // add the supplied transaction handler to each channel on the socket
    socket.on('data',function(data){
      trans.transaction_handler(channel,data,function(err,data){
        if(err) return socket.emit('error',err,event);
        trans.tellOthers(channel,data,socket);
      });
    });

    // add the supplied disconnection handler
    socket.on('close', function(){
      if(err) throw err;
      trans.emit('close',channel,socket);
    });

};

Transactor.prototype.onTransaction = function(transaction_handler){
  this.transaction_handler = transaction_handler;
};

Transactor.prototype.tellOthers = function(){
  // foooooo
};
