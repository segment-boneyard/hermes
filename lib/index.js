
var assert = require('assert');
var echo = require('./echo');
var format = require('util').format;
var help = require('./help');
var memory = require('./memory');
var noop = function(){};
var type = require('component-type');
var Emitter = require('events').EventEmitter;
var inherit = require('util').inherits;

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
  this.setMaxListeners(Infinity);
  this.on('error', noop);
  this.name(name || 'Hermes');
  this.template('@%s ');
  this.use(memory());
  this.use(help());
  this.use(echo());
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
  this.nickname(nickify(name));
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
  var robot = this;

  on.call(this, event, function(message, ctx){
    if (!has(ctx, context)) return;
    var res = message.match(regex);
    if (!res) return;
    res.message = message;
    res.context = ctx;
    if (ctx.user) res.user = ctx.user;
    if (ctx.room) res.room = ctx.room;
    bind(res, robot);
    fn(res, robot);
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
  return this.on(event, regex, context, function callback(){
    self.off(event, callback);
    fn.apply(this, arguments);
  });
};

/**
 * Convert a `name` into a nickname string.
 *
 * @param {String} name
 * @return {String}
 */

function nickify(name){
  return name.split(' ')[0].toLowerCase();
}

/**
 * Check whether an `object` has all the values of `another` object.
 *
 * @param {Object} object
 * @param {Object} another
 * @return {Boolean}
 */

function has(object, another) {
  for (var key in another) {
    if (another[key] !== object[key]) return false;
  }
  return true;
}

/**
 * Bind a `res` object with all of the speaking methods of a `robot`.
 *
 * @param {Object} res
 * @param {Robot} robot
 */

function bind(res, robot){
  var user = res.user;
  var room = res.room;
  var ctx = res.context;
  res.say = function(message){ robot.say(message, ctx); };
  res.emote = function(message){ robot.emote(message, ctx); };
  res.reply = function(message){ robot.reply(user, message, ctx); };
  res.error = function(message){ robot.error(message, ctx); };
  res.warn = function(message){ robot.warn(message, ctx); };
  res.info = function(message){ robot.info(message, ctx); };
  res.success = function(message){ robot.success(message, ctx); };
  res.topic = function(topic){ robot.topic(room, topic); };
  res.on = function(event, regexp, fn){ robot.on(event, regexp, ctx, fn); };
  res.once = function(event, regexp, fn){ robot.once(event, regexp, ctx, fn); };
}