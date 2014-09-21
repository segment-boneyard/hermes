var assert = require('assert');
var Emitter = require('events').EventEmitter;
var Hermes = require('..');
var noop = function(){};

var robot;

describe('users', function(){
  beforeEach(function(){
    robot = new Hermes('Robot');
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
