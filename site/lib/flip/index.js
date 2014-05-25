
var flip = require('to-flip-case');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add a text flipping command to Hermes.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.help('flip <text>', 'Flip some text upside down!');
    robot.on('mention', /flip (.*)/i, function(res){
      var str = res[1];
      res.say('(\u256f\u00b0\u25a1\u00b0\uff09\u256f ' + flip(str));
    });
  };
}