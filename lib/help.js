
/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add a `help` method for documenting commands.
 *
 * @param {Object} options (optional)
 *   @property {String} preamble
 */

function plugin(options){
  options = options || {};

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
     * @param {String} message
     * @param {Object} context
     */

    robot.on('mention', /help!?\??(?: (.*))?/i, function(message, context){
      var intro = options.preamble || 'Here\'s everything I know...';
      var extra = context.matches[1];
      var cmds = !extra ? commands : commands.filter(function(cmd){
        return !! (~cmd.command.indexOf(extra) || ~cmd.description.indexOf(extra));
      });

      var list = cmds.map(command).join('\n\n');
      var msg = format('%s\n\n%s', intro, cmds);
      robot.say(msg, context);
    });

    /**
     * Format a command `obj`.
     *
     * @param {Object} obj
     * @return {String}
     */

    function command(obj){
      var name = robot.name();
      return format('@%s %s\n%s', name, obj.command, obj.description);
    }
  };
}