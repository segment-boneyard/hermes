
var chalk = require('chalk');
var create = require('readline').createInterface;
var format = require('util').format;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * A shell adapter for Hermes.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    var repl = create(process.stdin, process.stdout);
    repl.setPrompt('> ');

    console.log();
    prompt();

    repl.on('line', function(buffer){
      var string = buffer.toString();
      if ('exit' == string) repl.close();
      repl.prompt();
      robot.hear(string);
    });

    repl.on('close', function(){
      console.log();
      process.exit(0);
    });

    robot.on('say', prompt);
    robot.on('emote', prompt);
    robot.on('reply', prompt);
    robot.on('topic', prompt);
    robot.on('error', prompt);
    robot.on('warn', prompt);
    robot.on('success', prompt);

    /**
     * Prompt the user.
     */

    function prompt(){
      repl.prompt();
    }
  };
}
