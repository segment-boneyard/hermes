
var math = require('mathjs');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Teach Hermes math.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.help('math <string>', 'Evaluate a <string> of math.');
    robot.on('mention', /math (.*)/i, function(res){
      var str = res[1];
      res.reply(math.eval(str));
    });
  };
}