var Transactor = require('transactor');
var EventEmitter = require('events').EventEmitter;
var assert = require('chai').assert;

describe('Transactor', function(){
  var server, server_spy, trans;
    
  beforeEach(function(){
    trans = new Transactor(['channel_1']);
  });

  describe('When a transaction occurs on an event', function(){
    var socket, socket_spy;

    beforeEach(function(){
      socket = new EventEmitter();
      trans.addSocket(socket);
    });

    it('the transaction handler interface conforms to function(channel,data,socket,cb)', function(done){
      var test_data = {foo:'bar'};
      trans.onTransaction(function(channel,data,sock,cb){
        assert.equal(channel,'channel_1');
        assert.equal(data,test_data);
        assert.deepEqual(socket,sock);
        assert.isFunction(cb);
        done();
      });
      socket.emit('channel_1',test_data);
    });
  });
});
