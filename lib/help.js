
var fmt = require('util').format;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add a `help` method and command for documenting commands.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    var commands = [];

    /**
     * Add a new help entry with `triggers` and a `description`.
     *
     * @param {String or Array} triggers
     * @param {String} description
     * @return {Robot}
     */

    robot.help = function(triggers, description){
      if ('string' == typeof triggers) triggers = [triggers];
      commands.push({ triggers: triggers, description: description });
      return this;
    };

    /**
     * Listen for `help`, with an optional filter.
     *
     * @param {Response} res
     */

    robot.on('mention', /^h+(?:e|a)+l+p+!?\??(?: (.*))?$/i, function(res){
      var cmds = filter(commands, res[1]);
      var msg = cmds.map(format).join('\n\n');
      if (!msg) msg = 'No commands have been registered.';
      res.say(msg);
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
        if (~cmd.description.indexOf(string)) return true;
        for (var i = 0, trigger; trigger = cmd.triggers[i]; i++) {
          if (~trigger.indexOf(string)) return true;
        }
        return false;
      });
    }

    /**
     * Format a command `obj`.
     *
     * @param {Object} obj
     * @return {String}
     */

    function format(obj){
      var mention = robot.mention();
      var desc = obj.description;
      var triggers = obj.triggers.map(function(string){
        return mention + string;
      });

      return fmt('%s\n%s', triggers.join('\n'), desc);
    }
  };
}