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
        .command('deploy')
        .summary('Deploy a service to production.')
        .usage('deploy <service> [version]')
        .mention()
        .do(function(chat, service, version){
        });
    });
  });
});
