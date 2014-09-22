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
});
