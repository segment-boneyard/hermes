var assert = require('assert');
var Emitter = require('events').EventEmitter;
var Hermes = require('..');
var noop = function(){};

var robot;

describe('rooms', function(){
  beforeEach(function(){
    robot = new Hermes('Robot');
  });

  describe('#room', function(){
    it('should set and get a room by id', function(){
      robot.room('id', { name: 'room' });
      assert.deepEqual(robot.room('id'), { id: 'id', name: 'room' });
    });

    it('should emit "room"', function(done){
      robot.once('room', function(id, attrs){
        assert.equal(id, 'id');
        assert.deepEqual(attrs, { id: 'id', name: 'room' });
        done();
      });
      robot.room('id', { name: 'room' });
    });

    it('should return this', function(){
      var self = robot.room('id', { name: 'room' });
      assert.equal(robot, self);
    });
  });

  describe('#rooms', function(){
    it('should get all rooms', function(){
      robot.room(1, { name: 'one' });
      robot.room(2, { name: 'two' });
      assert.deepEqual(robot.rooms(), [
        { id: 1, name: 'one' },
        { id: 2, name: 'two' }
      ]);
    });
  });
});
