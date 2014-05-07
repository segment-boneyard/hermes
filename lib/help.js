
var format = require('util').format;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add a `help` method for documenting commands.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    var commands = [];

    /**
     * Add a new help `command` with a `description`.
     *
     * @param {String} command
     * @param {String} description
     * @return {Robot}
     */

    robot.help = function(command, description){
      commands.push({ command: command, description: description });
      return this;
    };

    /**
     * Listen for `help`, with an optional filter.
     *
     * @param {Object} ctx
     */

    robot.on('mention', /help!?\??(?: (.*))?/i, function(ctx){
      var cmds = filter(commands, ctx.matches[1]);
      var msg = cmds.map(command).join('\n\n');
      if (!msg) msg = 'No commands have been registered.';
      robot.say(msg);
    });

    /**
     * Filter a set of `commands` by a `string`.
     *
     * @param {Array} commands
     * @param {String} string
     */

    function filter(commands, string){
      if (!string) return commands;
      return commands.filter(function(cmd){
        return !! (~cmd.command.indexOf(extra) || ~cmd.description.indexOf(extra));
      });
    }

    /**
     * Format a command `obj`.
     *
     * @param {Object} obj
     * @return {String}
     */

    function command(obj){
      var mention = robot.mention();
      return format('%s%s\n%s', mention, obj.command, obj.description);
    }
  };
}