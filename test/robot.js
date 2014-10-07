var assert = require('assert');
var Emitter = require('events').EventEmitter;
var Hermes = require('..');
var noop = function(){};

var robot;
var response;

describe('robot', function(){
  beforeEach(function(){
    robot = new Hermes('Robot');
  });

  describe('#command', function(){
    it('should create a command', function(done){
      robot
        .command()
        .mention('deploy <service> [version]')
        .summary('Deploy a service to production.')
        .do(function(chat, service, version){
          assert(chat);
          assert.equal(service, 'coco');
          assert.equal(version, '1.0');
          done();
        });
      robot.hear('@robot deploy coco 1.0');
    });
  });
});
