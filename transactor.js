var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Transactor = function(channels){
  this.channels = channels || [];
  this.transaction_handler = this.defaultEventHandler;
  this.connection_handler = this.defaultEventHandler;
  this.disconnection_handler = this.defaultEventHandler;
};

inherits(Transactor,EventEmitter);
module.exports = Transactor;

// handler interface:  function eventHandler(... socket,cb)
// callback interface: function cb(err,socket)
Transactor.prototype.defaultEventHandler = function(){ 
  arguments[arguments.length - 1](null,arguments[arguments.length - 2]); 
};

Transactor.prototype.initializeServer = function(){
  var trans = this;
  this.io.sockets.on('connection', function(socket){
    trans.addSocket(socket);
  });
};

Transactor.prototype.addSocket = function(socket){
  var trans = this;

  // apply the supplied connection handler to validate the connection
  this.connection_handler(socket,function(err,socket){
    if(err) throw err;
   
    // add the supplied transaction handler to each channel on the socket
    trans.channels.forEach(function(channel){
      socket.on(channel,function(data){
        trans.transaction_handler(channel,data,socket,function(err,event){
          if(err) return socket.emit('error',err,event);
          trans.tellOthers(channel,event,socket);
        });
      });
    });

    // add the supplied disconnection handler
    socket.on('disconnect', function(){
      trans.disconnection_handler(socket,function(err,socket){
        if(err) throw err;
        trans.emit('disconnect',socket);
        trans.tellOthers('disconnect',{},socket);
      });
    });

  });
};

Transactor.prototype.onTransaction = function(transaction_handler){
  this.transaction_handler = transaction_handler;
};

Transactor.prototype.onConnection = function(connection_handler){
  this.connection_handler = connection_handler;
};

Transactor.prototype.onDisconnection = function(disconnection_handler){
  this.disconnection_handler = disconnection_handler;
};

Transactor.prototype.tellMe = function(channel,params,socket){
  socket.emit(channel,params);
};

Transactor.prototype.tellOthers = function(channel,params,socket){
  socket.broadcast.emit(channel,params);
};

Transactor.prototype.tellAll = function(channel,params,socket){
  socket.emit(channel,params);
  socket.broadcast.emit(channel,params);
};


