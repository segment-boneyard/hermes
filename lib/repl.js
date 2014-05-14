
var assert = require('assert');
var chalk = require('chalk');
var create = require('readline').createInterface;
var format = require('util').format;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Cache.
 */

var repl;

/**
 * A REPL adapter for Hermes.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    var sep = ' · ';
    var user = process.env.USER || process.env.USERNAME || process.env.LOGNAME;

    /**
     * Connect to the REPL.
     */

    robot.connect = function(){
      var self = this;
      repl = create(process.stdin, process.stdout);
      repl.setPrompt('> ');

      repl.on('line', function(buffer){
        var string = buffer.toString();
        if ('exit' == string) return self.disconnect();
        robot.hear(string, { user: user });
        repl.prompt();
      });

      repl.on('close', function(){
        console.log();
        process.exit(0);
      });

      /**
       * Save the current user.
       */

      this.user(user, {
        name: user,
        nickname: user.split(' ')[0].toLowerCase()
      });

      /**
       * Prompt after talking.
       */

      this.on('say', repl.prompt.bind(repl));
      this.on('emote', repl.prompt.bind(repl));
      this.on('reply', repl.prompt.bind(repl));
      this.on('topic', repl.prompt.bind(repl));
      this.on('error', repl.prompt.bind(repl));
      this.on('warn', repl.prompt.bind(repl));
      this.on('success', repl.prompt.bind(repl));
      this.on('info', repl.prompt.bind(repl));

      /**
       * Start.
       */

      console.log();
      repl.prompt();
      this.emit('connect');
    };

    /**
     * Disconnect from the REPL.
     */

    robot.disconnect = function(){
      repl.close();
      this.emit('disconnect');
    };

    /**
     * Say a `message`.
     *
     * @param {String} message
     * @param {Object} context
     */

    robot.say = function(message, context){
      var name = chalk.white(this.name());
      var msg = format('%s%s%s', name, sep, message);
      console.log(msg);
      this.emit('say', message, context);
      return this;
    };

    /**
     * Emote a `message`.
     *
     * @param {String} message
     * @param {Object} context
     */

    robot.emote = function(message, context){
      var name = chalk.gray(this.name());
      var msg = format('%s %s', name, message);
      console.log(msg);
      this.emit('emote', message, context);
      return this;
    };

    /**
     * Reply to a user by `id` with a `message`.
     *
     * @param {String} id
     * @param {String} message
     * @param {Object} context
     */

    robot.reply = function(id, message, context){
      var user = this.user(id);
      assert(user, 'Couldn\'t find a user by id "' + id + '"');
      var name = chalk.white(this.name());
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
     */

    robot.topic = function(id, topic){
      var room = this.room(id);
      assert(room, 'Couldn\'t find a room by id "' + id + '"');
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
     * @param {Object} context
     */

    robot.error = function(message, context){
      if (message instanceof Error) message = message.stack;
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
     * @param {Object} context
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
     * @param {Object} context
     */

    robot.success = function(message, context){
      var pre = chalk.green('Success');
      var msg = format('%s%s%s', pre, sep, message);
      console.log(msg);
      this.emit('success', message, context);
      return this;
    };

    /**
     * Send an info `message`.
     *
     * @param {String} message
     * @param {Object} context
     */

    robot.info = function(message, context){
      var pre = chalk.green('Info');
      var msg = format('%s%s%s', pre, sep, message);
      console.log(msg);
      this.emit('info', message, context);
      return this;
    };
  };
}
