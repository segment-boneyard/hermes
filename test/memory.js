
var assert = require('assert');
var Emitter = require('events').EventEmitter;
var Hermes = require('..');
var noop = function(){};

var robot;

describe('memory', function(){
  beforeEach(function(){
    robot = new Hermes('Robot');
  });

  describe('#data', function(){
    it('should set and get key and value', function(){
      robot.data('key', 'value');
      assert.equal(robot.data('key'), 'value');
    });

    it('should emit "data"', function(done){
      robot.once('data', function(key, val){
        assert.equal(key, 'key');
        assert.equal(val, 'value');
        done();
      });
      robot.data('key', 'value');
    });

    it('should return this', function(){
      var self = robot.data('key', 'value');
      assert.equal(robot, self);
    });
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

  describe('#user', function(){
    it('should set and get a user by id', function(){
      robot.user('id', { name: 'user' });
      assert.deepEqual(robot.user('id'), { id: 'id', name: 'user', nickname: 'user' });
    });

    it('should emit "user"', function(done){
      robot.once('user', function(id, attrs){
        assert.equal(id, 'id');
        assert.deepEqual(attrs, { id: 'id', name: 'user', nickname: 'user' });
        done();
      });
      robot.user('id', { name: 'user' });
    });

    it('should return this', function(){
      var self = robot.user('id', { name: 'user' });
      assert.equal(robot, self);
    });
  });

  describe('#users', function(){
    it('should get all users', function(){
      robot.user(1, { name: 'one' });
      robot.user(2, { name: 'two' });
      assert.deepEqual(robot.users(), [
        { id: 1, name: 'one', nickname: 'one' },
        { id: 2, name: 'two', nickname: 'two' }
      ]);
    });
  });
});