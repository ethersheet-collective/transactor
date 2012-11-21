var Transactor = require('transactor');
var EventEmitter = require('events').EventEmitter;
var assert = require('chai').assert;

describe('Transactor', function(){
  var server, server_spy, trans;
    
  beforeEach(function(){
    trans = new Transactor();
  });

  describe('When a transaction occurs on an event', function(){
    var socket, socket_spy;

    beforeEach(function(){
      socket = new EventEmitter();
      trans.addSocket('channel_1',socket);
    });

    it('the transaction handler interface conforms to function(channel,data,cb)', function(done){
      var test_data = {event:'foo',foo:'bar'};
      trans.onTransaction(function(channel,data,cb){
        assert.equal(channel,'channel_1');
        assert.equal(data,test_data);
        assert.isFunction(cb);
        cb(null,data);
        done();
      });
      socket.emit('data',test_data);
    });

    it('emits the event to other listeners on the same channel',function(done){
      done(new Error('write test here'));
    });
    
    it('does not emit the event to listeners on other channels',function(done){
      done(new Error('write test here'));
    });
  });
});
