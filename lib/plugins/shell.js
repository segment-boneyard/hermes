
var chalk = require('chalk');
var create = require('readline').createInterface;
var format = require('util').format;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * User.
 */

var env = process.env;
var user = env.USER || env.USERNAME || env.LOGNAME;

/**
 * A shell adapter for Hermes.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){

    /**
     * Save the current user.
     */

    robot.user(user, {
      name: user,
      nickname: user.split(' ')[0].toLowerCase()
    });

    /**
     * Padding.
     */

    console.log();

    /**
     * Setup the REPL.
     */

    var repl = create(process.stdin, process.stdout);
    var prompt = repl.prompt.bind(repl);

    repl.setPrompt('> ');

    repl.on('line', function(buffer){
      var string = buffer.toString();
      if ('exit' == string) repl.close();
      prompt();
      robot.hear(string, { user: user });
    });

    repl.on('close', function(){
      console.log();
      process.exit(0);
    });

    /**
     * Prompt.
     */

    prompt();
    robot.on('say', prompt);
    robot.on('emote', prompt);
    robot.on('reply', prompt);
    robot.on('topic', prompt);
    robot.on('error', prompt);
    robot.on('warn', prompt);
    robot.on('success', prompt);
  };
}
