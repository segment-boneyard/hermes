
var console = require('./console');
var memory = require('./memory');
var help = require('./help');
var Emitter = require('events').EventEmitter;
var inherit = require('util').inherits;

/**
 * Expose `Robot`.
 */

module.exports = Robot;

/**
 * Initialize a new `Robot` instance with a `name`.
 *
 * @param {String} name (default: "Hermes")
 */

function Robot(name){
  if (!(this instanceof Robot)) return new Robot(name);
  Emitter.call(this);
  this.events = new Emitter();
  this.name(name || 'Hermes');
  // TODO: broken, assumes a constant name
  this.mentions(new RegExp('^@?' + name + '\b', 'i'));
  this.mentions(new RegExp('^' + name + ':', 'i'));
  this.mentions(new RegExp(', ' + name + '$', 'i'));
  this.use(memory);
  this.use(console);
  this.use(help);
}

/**
 * Inherit from `Emitter`.
 */

inherit(Robot, Emitter);

/**
 * Use a `plugin` function.
 *
 * @param {Function} plugin
 * @return {Robot}
 */

Robot.prototype.use = function(plugin){
  plugin(this);
  return this;
};

/**
 * Get or set the `name`.
 *
 * @param {String} name
 * @return {Robot}
 */

Robot.prototype.name = function(name){
  if (!arguments.length) return this._name;
  this._name = name;
  this.emit('name', name);
  return this;
};

/**
 * Add a new `regexp` for testing whether the robot is mentioned in a string, or
 * return a list of all the testers.
 *
 * @param {RegExp} regexp
 * @return {Array}
 */

Robot.prototype.mentions = function(regexp){
  if (!arguments.length) return this._mentions;
  this._mentions = this._mentions || [];
  this._mentions.push(regexp);
  return this;
};

/**
 * Listen for an event of `type` with a `matcher`.
 *
 * @param {String} type
 * @param {RegExp or String} matcher (optional)
 * @param {Function} fn
 */

Robot.prototype.on = function(type, matcher, fn){
  if ('function' == typeof matcher) fn = matcher, matcher = /.*/;
  if ('string' == typeof matcher) matcher = new RegExp(matcher);
  this.events.on(type, function(message, context){
    var m = message.match(matcher);
    if (!m) return;
    context.message = message;
    context.matches = m;
    fn(context);
  });
};

/**
 * Listen once for an event of `type` with a `matcher`.
 *
 * @param {String} type
 * @param {RegExp or String} matcher (optional)
 * @param {Function} fn
 */

Robot.prototype.once = function(type, matcher, fn){
  if ('function' == typeof matcher) fn = matcher, matcher = /.*/;
  if ('string' == typeof matcher) matcher = new RegExp(matcher);
  this.events.once(type, function(message, context){
    var m = message.match(matcher);
    if (!m) return;
    context.message = message;
    context.matches = m;
    fn(context);
  });
};

/**
 * Hear a `string` and process it.
 *
 * @param {Object} message
 * @param {Object} context (optional)
 *   @property {String} user
 *   @property {String} room
 * @return {Robot}
 */

Robot.prototype.hear = function(message, context){
  var testers = this.mentions();
  var mentioned = false;

  for (var i = 0, tester; tester = testers[i]; i++) {
    if (tester.test(message.text)) mentioned = true;
  }

  this.events.emit('hear', message, context);
  if (mentioned) this.events.emit('mention', message, context);
  return this;
};
