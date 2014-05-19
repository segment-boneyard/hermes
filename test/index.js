
var assert = require('assert');
var Emitter = require('events').EventEmitter;
var Hermes = require('..');
var noop = function(){};

var robot;

describe('robot', function(){
  beforeEach(function(){
    robot = new Hermes('Robot');
    robot.user('user', { name: 'Name' });
    robot.room('room', { name: 'Name' });
  });

  it('should expose a constructor', function(){
    assert.equal(typeof Hermes, 'function');
  });

  it('should not require the new keyword', function(){
    var robot = Hermes();
    assert(robot instanceof Hermes);
  });

  it('should inherit from emitter', function(){
    assert(robot instanceof Emitter);
  });

  describe('#use', function(){
    it('should use a plugin', function(done){
      robot.use(function(instance){
        assert.equal(robot, instance);
        done();
      });
    });

    it('should return this', function(){
      var self = robot.use(noop);
      assert.equal(robot, self);
    });
  });

  describe('#name', function(){
    it('should get the robot\'s name', function(){
      var name = robot.name();
      assert.equal(name, 'Robot');
    });

    it('should set the robot\'s name', function(){
      robot.name('Hermes');
      assert.equal(robot.name(), 'Hermes');
    });

    it('should emit "name"', function(done){
      robot.once('name', function(){ done(); });
      robot.name('Robot');
    });

    it('should return this', function(){
      var self = robot.name('Robot');
      assert.equal(robot, self);
    });
  });

  describe('#template', function(){
    it('should get the robot\'s mention template', function(){
      var template = robot.template();
      assert.equal(template, '@%s ');
    });

    it('should set the robot\'s mention template', function(){
      robot.template('%s:');
      assert.equal(robot.template(), '%s:');
    });

    it('should emit "template"', function(done){
      robot.once('template', function(){ done(); });
      robot.template('');
    });

    it('should return this', function(){
      var self = robot.template('');
      assert.equal(robot, self);
    });
  });

  describe('#mention', function(){
    it('should format a mention string', function(){
      var mention = robot.mention('name');
      assert.equal(mention, '@name ');
    });

    it('should default to the robot\'s name', function(){
      var mention = robot.mention();
      assert.equal(mention, '@robot ');
    });
  });

  describe('#hear', function(){
    it('should emit "hear"', function(done){
      robot.once('hear', function(res){
        assert.equal(res[0], 'message');
        assert.equal(res.message, 'message');
        done();
      });
      robot.hear('message');
    });

    it('should not emit "mention" when not mentioned', function(){
      robot.once('mention', function(res){
        assert(false, 'Expected not to emit mention.');
      });
      robot.hear('message');
    });

    it('should emit "mention" when mentioned', function(done){
      robot.once('mention', function(res){
        assert.equal(res[0], 'message');
        assert.equal(res.message, 'message');
        done();
      });
      robot.hear('@robot message');
    });

    it('should return this', function(){
      var self = robot.hear('');
      assert.equal(robot, self);
    });
  });

  describe('#on', function(){
    it('should pass through to the regular emitter', function(done){
      robot.on('event', done);
      robot.emit('event');
    });

    it('should return a response object for messages', function(done){
      robot.on('hear', /(.).*/, function(res){
        assert.equal(res[0], 'string');
        assert.equal(res[1], 's');
        assert.equal(res.message, 'string');
        assert.deepEqual(res.user, { id: 'user', name: 'Name', nickname: 'Name' });
        assert.deepEqual(res.room, { id: 'room', name: 'Name' });
        assert.deepEqual(res.context, { user: 'user', room: 'room' });
        done();
      });
      robot.hear('string', { user: 'user', room: 'room' });
    });

    it('should filter by a regex', function(done){
      robot.on('hear', /yes/, function(res){
        assert.equal(res[0], 'yes');
        done();
      });
      robot.hear('no', {});
      robot.hear('yes', {});
    });

    it('should filter by a string', function(done){
      robot.on('hear', 'yes', function(res){
        assert.equal(res[0], 'yes');
        done();
      });
      robot.hear('no', {});
      robot.hear('yes', {});
    });

    it('should filter by a context', function(done){
      robot.on('hear', { user: 'user' }, function(res){
        assert.deepEqual(res.user, { id: 'user', name: 'Name', nickname: 'Name' });
        done();
      });
      robot.hear('message', { user: 'none' });
      robot.hear('message', { user: 'user' });
    });

    it('should filter by a regex and context', function(done){
      robot.on('hear', /yes/, { user: 'user' }, function(res){
        assert.equal(res[0], 'yes');
        assert.deepEqual(res.user, { id: 'user', name: 'Name', nickname: 'Name' });
        done();
      });
      robot.hear('no', { user: 'none' });
      robot.hear('no', { user: 'user' });
      robot.hear('yes', { user: 'none' });
      robot.hear('yes', { user: 'user' });
    });
  });

  describe('#once', function(){
    it('should pass through to the regular emitter', function(done){
      robot.once('event', done);
      robot.emit('event');
    });

    it('should filter by a regex', function(done){
      robot.once('hear', /yes/, function(res){
        assert.equal(res[0], 'yes');
        done();
      });
      robot.emit('hear', 'no', {});
      robot.emit('hear', 'yes', {});
    });

    it('should filter by a string', function(done){
      robot.once('hear', 'yes', function(res){
        assert.equal(res[0], 'yes');
        done();
      });
      robot.emit('hear', 'no', {});
      robot.emit('hear', 'yes', {});
    });

    it('should filter by a context', function(done){
      robot.once('hear', { user: 'user' }, function(res){
        assert.deepEqual(res.user, { id: 'user', name: 'Name', nickname: 'Name' });
        done();
      });
      robot.emit('hear', 'message', { user: 'none' });
      robot.emit('hear', 'message', { user: 'user' });
    });

    it('should filter by a regex and context', function(done){
      robot.once('hear', /yes/, { user: 'user' }, function(res){
        assert.equal(res[0], 'yes');
        assert.deepEqual(res.user, { id: 'user', name: 'Name', nickname: 'Name' });
        done();
      });
      robot.emit('hear', 'no', { user: 'none' });
      robot.emit('hear', 'no', { user: 'user' });
      robot.emit('hear', 'yes', { user: 'none' });
      robot.emit('hear', 'yes', { user: 'user' });
    });
  });

  describe('#off', function(){
    it('should be aliased to #removeListener for convenience', function(){
      assert.equal(robot.off, robot.removeListener);
    });
  });
});