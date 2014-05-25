
var ms = require('ms');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Teach Hermes to remind you of important things.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.help('reminder <time> <message>', 'Set a reminder <message> to appear in <time>, for example: \'5m\'.');
    robot.on('mention', /remind(?:er)? (\w+) (.*)/i, function(res){
      var time = res[1];
      var msg = res[2];
      var fn = res.say.bind(res, 'REMINDER: ' + msg);
      res.say('Sure thing, I set a reminder for ' + time + ' from now.');
      setTimeout(fn, ms(time));
    });
  };
}