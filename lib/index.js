
var assert = require('assert');
var console = require('./console');
var help = require('./help');
var memory = require('./memory');
var format = require('util').format;

try {
  var type = require('component-type');
  var Emitter = require('events').EventEmitter;
  var inherit = require('util').inherits;
} catch (e) {
  var type = require('type');
  var inherit = require('inherit');
  var Emitter = require('emitter');
}

/**
 * Expose `Robot`.
 */

module.exports = Robot;

/**
 * Initialize a new `Robot` instance with a `name`.
 *
 * @param {Object} name
 */

function Robot(name){
  if (!(this instanceof Robot)) return new Robot(name);
  name = name || 'Hermes';
  this.name(name);
  this.nickname(name.split(' ')[0].toLowerCase());
  this.template('@%s ');
  this.use(memory());
  this.use(console());
  this.use(help());
}

/**
 * Inherit from `Emitter`.
 */

inherit(Robot, Emitter);

var on = Robot.prototype.on;
var once = Robot.prototype.once;
var off = Robot.prototype.off = Robot.prototype.removeListener;

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
 * Get or set the robot's `name`.
 *
 * @param {Object} name
 * @return {Robot}
 */

Robot.prototype.name = function(name){
  if (!arguments.length) return this._name;
  assert('string' == type(name), 'The robot\'s name must be a string.');
  this._name = name;
  this.nickname(name);
  this.emit('name', name);
  return this;
};

/**
 * Get or set the robot's `nickname`.
 *
 * @param {Object} nickname
 * @return {Robot}
 */

Robot.prototype.nickname = function(nickname){
  if (!arguments.length) return this._nickname;
  assert('string' == type(nickname), 'The robot\'s nickname must be a string.');
  this._nickname = nickname;
  this.emit('nickname', nickname);
  return this;
};

/**
 * Get or set the way the robot is mentioned with a substitution `template`.
 *
 * @param {String} template
 * @return {Robot}
 */

Robot.prototype.template = function(template){
  if (!arguments.length) return this._template;
  assert('string' == type(template), 'The mention template must be a string.');
  this._template = template;
  this.emit('template', template);
  return this;
};

/**
 * Format a `nickname` into a mention.
 *
 * @param {String} nickname
 * @return {String}
 */

Robot.prototype.mention = function(nickname){
  if (!nickname) nickname = this.nickname();
  var template = this.template();
  return format(template, nickname);
};

/**
 * Hear a `string` with optional `context` and process it.
 *
 * @param {String} message
 * @param {Object} context (optional)
 *   @property {String} user
 *   @property {String} room
 * @return {Robot}
 */

Robot.prototype.hear = function(message, context){
  context = context || {};
  assert('string' == type(message), 'You must pass a message string.');
  assert('object' == type(context), 'The message\'s context must be an object.');

  var mention = this.mention();
  var regex = new RegExp('^' + mention + '(.*)', 'i');
  var match = message.match(regex);

  this.emit('hear', message, context);
  if (match) this.emit('mention', match[1], context);
  return this;
};

/**
 * Wrap `#on` to optionally filter messages by a `regex` and/or `context`.
 *
 * @param {String} event
 * @param {RegExp or String} regex (optional)
 * @param {Object} context (optional)
 *   @property {String} user
 *   @property {String} room
 * @param {Function} fn
 * @return {Robot}
 */

Robot.prototype.on = function(event, regex, context, fn){
  if ('function' == type(regex)) return on.call(this, event, regex);
  if ('function' == type(context)) fn = context, context = null;
  if ('object' == type(regex)) context = regex, regex = null;
  if ('string' == type(regex)) regex = new RegExp(regex);

  regex = regex || /.*/;
  context = context || {};

  on.call(this, event, function(message, ctx){
    if (!has(ctx, context)) return;
    var match = message.match(regex);
    if (match) fn(match, ctx);
  });

  return this;
};

/**
 * Wrap `#once` to optionally filter messages by a `regex` and/or `context`.
 *
 * @param {String} event
 * @param {RegExp or String} regex (optional)
 * @param {Object} context (optional)
 *   @property {String} user
 *   @property {String} room
 * @param {Function} fn
 * @return {Robot}
 */

Robot.prototype.once = function(event, regex, context, fn){
  if ('function' == type(regex)) return once.call(this, event, regex);

  var self = this;
  return this.on(event, regex, context, function callback(match, ctx){
    self.off(event, callback);
    fn(match, ctx);
  });
};

/**
 * Check whether an `object` has all the values of `another` object.
 *
 * @param {Object} object
 * @param {Object} another
 * @return {Boolean}
 */

function has(object, another){
  for (var key in another) {
    if (another[key] !== object[key]) return false;
  }
  return true;
}