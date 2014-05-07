
var console = require('./console');
var Emitter = require('events').EventEmitter;
var help = require('./help');
var inherit = require('util').inherits;
var memory = require('./memory');
var mentions = require('./mentions');

/**
 * Expose `Robot`.
 */

module.exports = Robot;

/**
 * Initialize a new `Robot` instance with a `name`.
 *
 * @param {String} name
 */

function Robot(name){
  if (!(this instanceof Robot)) return new Robot(name);
  this.name(name || 'Hermes');
  this.use(mentions());
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
 * Get or set the `name`, and regenerate the message matchers with the new name.
 *
 * @param {String} name
 * @return {Robot}
 */

Robot.prototype.name = function(name){
  if (!arguments.length) return this._name;
  this._name = name;
  var fns = this._fns = this._fns || [];
  var regexps = this._regexps = [];
  for (var i = 0, fn; fn = fns[i]; i++) regexps.push(fn(name));
  return this;
};

/**
 * Register a new regex matcher generator `fn`.
 *
 * @param {Function} fn
 * @return {Robot}
 */

Robot.prototype.match = function(fn){
  var name = this.name();
  var fns = this._fns = this._fns || [];
  var regexps = this._regexps = this._regexps || [];
  fns.push(fn);
  regexps.push(fn(name));
  return this;
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
  var regexps = this._regexps;
  var match;

  regexps.forEach(function(regexp){
    if (match) return;
    var m = message.match(regexp);
    if (m) match = m[1];
  });

  this.emit('hear', message, context);
  if (match) this.emit('mention', match, context);
  return this;
};

/**
 * Wrap `#on` to optionally filter messages by a `regexp` and/or `context`.
 *
 * @param {String} type
 * @param {RegExp or String} regexp (optional)
 * @param {Object} context (optional)
 * @param {Function} fn
 * @return {Robot}
 */

Robot.prototype.on = function(type, regexp, context, fn){
  if ('function' == typeof regexp) return on.call(this, type, regexp);
  if ('function' == typeof context) fn = context, context = {};
  if ('string' == typeof regexp) regexp = new RegExp(regexp);
  context = context || {};

  on.call(this, type, function(message, ctx){
    if (context.user && ctx.user != context.user) return;
    if (context.room && ctx.room != context.room) return;
    var m = message.match(regexp);
    if (!m) return;
    ctx.message = message;
    ctx.matches = m;
    fn(ctx);
  });

  return this;
};

/**
 * Wrap `#once` to optionally filter messages by a `regexp` and/or `context`.
 *
 * @param {String} type
 * @param {RegExp or String} regexp (optional)
 * @param {Object} context (optional)
 * @param {Function} fn
 * @return {Robot}
 */

Robot.prototype.once = function(type, regexp, context, fn){
  if ('function' == typeof regexp) return once.call(this, type, regexp);

  function callback(ctx){
    off.call(this, type, callback);
    fn(ctx);
  }

  this.on(type, regexp, context, callback);
  return this;
};
