
var Math = require('mathstring');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Teach Hermes some basic math.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.help('math <string>', 'Return the calculated value of a <string> of math.');
    robot.on('mention', /^math (.*)$/i, function(match, ctx){
      try {
        var str = match[1];
        var res = new Math(str).calculate();
      } catch (e) {
        return robot.error(e, ctx);
      }

      robot.reply(ctx.user, res, ctx);
    });
  };
}
