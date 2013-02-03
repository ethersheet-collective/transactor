var Transactor = require('../transactor');
var EventEmitter = require('events').EventEmitter;
var assert = require('chai').assert;
var sinon = require('sinon');

describe('Transactor', function(){
  var trans, socket;
    
  beforeEach(function(){
    trans = new Transactor();
    socket = new EventEmitter();
    socket.write = function(){};
    trans.addSocket('channel_1',socket);
  });

  describe('When a socket emits an event', function(){
    var test_data = {event:'foo',foo:'bar'};

    it('the transaction handler is invoked with the interface function(channel,data,cb)', function(done){
      trans.onTransaction(function(channel,data,cb){
        assert.equal(channel,'channel_1');
        assert.equal(data,test_data);
        assert.isFunction(cb);
        cb(null,data);
        done();
      });
      socket.emit('data',test_data);
    });

    describe('When the transaction is successful', function(){
      
      beforeEach(function(){
        trans.onTransaction(function(channel,data,cb){
          cb(null,data);
        });
      });

      it('the event is broadcast to all listeners on the same channel',function(done){
        var socket1 = new EventEmitter();
        socket1.write = function(data){
          assert.equal(data,test_data);
          done();
        };
        trans.addSocket('channel_1',socket1);
        socket.emit('data',test_data);
      });

      it('the event is not broadcast to listeners on other channels',function(done){
        var socket1 = new EventEmitter();
        socket1.write = function(data){
          throw new Error('should not be called');
        };
        trans.addSocket('channel_2',socket1);
        socket.emit('data',test_data);
        setTimeout(done,20);
      });

    });
    
    describe('When the transaction has an error', function(){
      var test_error = 'transaction error';

      beforeEach(function(){
        trans.onTransaction(function(channel,data,cb){
          cb(test_error,data);
        });
      });

      it('invokes the error handler on the socket',function(done){
        socket.on('error',function(err,data){
          assert.equal(err,test_error);
          assert.equal(data,test_data);
          done();
        });
        socket.emit('data',test_data);
      });

      it('does not emit the event to other listeners',function(done){
        var socket1 = new EventEmitter();
        trans.addSocket('channel_1',socket1);
        socket1.write = function(){
          throw new Error('should not be called');
        }
        socket.on('error',function(){});
        socket.emit('data',test_data);
        setTimeout(done,20);
      });
    });

    describe('when a socket closes', function(){
      beforeEach(function(){
        trans.onTransaction(function(channel,data,cb){
          cb(null,data);
        });
      });
     
      it('should be removed from the sockets array', function(done){
        var socket1 = new EventEmitter();
        socket1.write = function(data){
          throw new Error('should not be called');
        };
        trans.addSocket('channel_1',socket1);
        socket1.emit('close');
        socket.emit('data', test_data);
        setTimeout(done,20);
      });


      it('should call transactor.onClose() when the socket is closed', function(done){
        trans.onClose = sinon.spy();
        var socket1 = new EventEmitter();
        trans.addSocket('channel_1',socket1);
        socket1.emit('close');
        assert(trans.onClose.calledOnce, 'transactor.onClose() was not called');
        done();
      });
      
      it('should emit an event when onClose is called', function(){
        //TODO: Figure out how and what we are going to emit for this event
      });

    });
  });
});
