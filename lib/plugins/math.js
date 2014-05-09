
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
    robot.on('mention', /^\d.*/, function(match, ctx){
      try {
        var str = match[0];
        var res = new Math(str).calculate();
      } catch (e) {
        return robot.error(e, ctx);
      }

      robot.reply(ctx.user, res, ctx);
    });
  };
}
