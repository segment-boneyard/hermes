
var assert = require('assert');
var Emitter = require('events').EventEmitter;
var Hermes = require('..');
var noop = function(){};

var robot;

describe('console', function(){
  beforeEach(function(){
    robot = new Hermes('Robot');
  });
});