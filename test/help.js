
var assert = require('assert');
var Emitter = require('events').EventEmitter;
var Hermes = require('..');
var noop = function(){};

var robot;
var response;

describe('help', function(){
  beforeEach(function(){
    robot = new Hermes('Robot');
    robot.say = function(message){
      response = message;
    };
  });

  it('should listen on "help"', function(){
    var mention = robot.mention();
    robot.hear(mention + 'help');
    assert.equal(response, 'No commands have been registered.');
  });

  describe('#help', function(){
    it('should define a command with description', function(){
      var mention = robot.mention();
      robot.help('command', 'description');
      robot.hear(mention + 'help');
      assert.equal(response, mention + 'command\ndescription');
    });

    it('should return this', function(){
      var self = robot.help('command', 'description');
      assert.equal(self, robot);
    });
  });
});