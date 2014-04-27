
var chalk = require('chalk');
var create = require('readline').createInterface;
var format = require('util').format;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * A shell plugin for Hermes.
 *
 * @param {Robot} robot
 */

function plugin(robot){
  var repl = create(process.stdin, process.stdout);
  var name = robot.name();
  var prompt = format('%s> ', name);

  console.log();
  repl.setPrompt(prompt);
  repl.prompt();

  repl.on('line', function(buffer){
    var string = buffer.toString();
    if ('exit' == string) repl.close();
    repl.prompt();
    robot.receive(string);
  });

  repl.on('close', function(){
    console.log();
    process.exit(0);
  });

  /**
   * Send a `message`.
   *
   * @param {String} message
   */

  robot.say = function(message){
    console.log(message);
    repl.prompt();
  };

  /**
   * Emote a `message`.
   *
   * @param {String} message
   */

  robot.emote = function(message){
    robot.say(chalk.gray(message));
  };

  /**
   * Reply to a `user` with a `message`.
   *
   * @param {User} user
   * @param {String} message
   */

  robot.reply = function(user, message){
    var msg = format('%s: %s', user.name, message);
    robot.say(msg);
  };

}
