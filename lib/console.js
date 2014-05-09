
var assert = require('assert');
var chalk = require('chalk');
var format = require('util').format;
var indent = require('indent');

/**
 * Expose `plugin`.
 */

module.exports = exports = plugin;

/**
 * Separator.
 */

var sep = ' · ';

/**
 * Add basic console logging to the `robot` for all of its chat actions.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){

    /**
     * Say a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     * @return {Robot}
     */

    robot.say = function(message, context){
      var name = this.name();
      var msg = format('%s%s%s', name, sep, message);
      console.log(msg);
      this.emit('say', message, context);
      return this;
    };

    /**
     * Emote a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     * @return {Robot}
     */

    robot.emote = function(message, context){
      var name = this.name();
      var msg = format('%s %s', name, message);
      console.log(chalk.gray(msg));
      this.emit('emote', message, context);
      return this;
    };

    /**
     * Reply to a user by `id` with a `message`.
     *
     * @param {String} id
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     * @return {Robot}
     */

    robot.reply = function(id, message, context){
      var name = this.name();
      var user = this.user(id);
      assert(user, 'Could not find a user by id "' + id + '".');
      var mention = this.mention(user.nickname);
      var msg = format('%s%s%s%s', name, sep, mention, message);
      console.log(msg);
      this.emit('reply', id, message, context);
      return this;
    };

    /**
     * Set the `topic` of a room by `id`.
     *
     * @param {String} id
     * @param {String} topic
     * @return {Robot}
     */

    robot.topic = function(id, topic){
      var room = this.room(id);
      assert(room, 'Could not find a room by id "' + id + '".');
      var name = room.name || id;
      var msg = format('The new topic for %s is "%s"', name, topic);
      console.log(chalk.gray(msg));
      this.emit('topic', id, topic);
      return this;
    };

    /**
     * Send an error `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     * @return {Robot}
     */

    robot.error = function(message, context){
      if (message instanceof Error) message = stringify(message);
      var pre = chalk.red('Error');
      var msg = format('%s%s%s', pre, sep, message);
      console.error(msg);
      this.emit('error', message, context);
      return this;
    };

    /**
     * Send a warning `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     * @return {Robot}
     */

    robot.warn = function(message, context){
      var pre = chalk.yellow('Warning');
      var msg = format('%s%s%s', pre, sep, message);
      console.warn(msg);
      this.emit('warn', message, context);
      return this;
    };

    /**
     * Send a success `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     * @return {Robot}
     */

    robot.success = function(message, context){
      var pre = chalk.green('Success');
      var msg = format('%s%s%s', pre, sep, message);
      console.log(msg);
      this.emit('success', message, context);
      return this;
    };
  };
}

/**
 * Stringify an `error`.
 *
 * @param {Error} error
 * @return {String}
 */

function stringify(error){
  return format('%s\n\n%s\n', error.message, indent(error.stack, 2));
}