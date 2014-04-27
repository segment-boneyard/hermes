
var chalk = require('chalk');
var Emitter = require('events').EventEmitter;
var format = require('util').format;
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
  name = name || 'Hermes';
  this.events = new Emitter();
  this.name(name);
  this.mentions(new RegExp('^@?' + name, 'i'));
  this.mentions(new RegExp(', ' + name + '$', 'i'));
}

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
  this.events.on(type, function(string){
    var m = string.match(matcher);
    if (m) fn(m);
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
  this.events.once(type, function(string){
    var m = string.match(matcher);
    if (m) fn(m);
  });
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
 * Receive a `string` and process it.
 *
 * @param {String} string
 * @return {Robot}
 */

Robot.prototype.receive = function(string){
  var testers = this.mentions();
  var mentioned = false;

  for (var i = 0, tester; tester = testers[i]; i++) {
    if (tester.test(string)) mentioned = true;
  }

  this.events.emit('overhear', string);
  if (mentioned) this.events.emit('mention', string);
  return this;
};

/**
 * Say a `message`.
 *
 * OVERRIDE: By default this just logs to the console. Override this method with
 * your own implementation to talk to HipChat or Campfire or whatever.
 *
 * @param {String} message
 */

Robot.prototype.say = function(message){
  var name = this.name();
  var msg = format('%s · %s', name, message);
  console.log(msg);
};

/**
 * Emote a `message`.
 *
 * OVERRIDE: By default this just logs to the console. Override this method with
 * your own implementation to talk to HipChat or Campfire or whatever.
 *
 * @param {String} message
 */

Robot.prototype.emote = function(message){
  var name = this.name();
  var msg = format('%s %s', name, message);
  console.log(chalk.gray(msg));
};

/**
 * Reply to a `user` with a `message`.
 *
 * OVERRIDE: By default this just logs to the console. Override this method with
 * your own implementation to talk to HipChat or Campfire or whatever.
 *
 * @param {User} user
 * @param {String} message
 */

Robot.prototype.reply = function(user, message){
  var name = this.name();
  var msg = format('%s · %s: %s', name, user.name, message);
  console.log(msg);
};
