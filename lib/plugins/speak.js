
var async = require('async');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Augment the `robot`s `say` method to accept an array of messages, which are
 * printed at a humanesque rhythm.
 *
 * @param {Robot} robot
 */

function plugin(robot){
  var say = robot.say.bind(robot);

  robot.say = function(messages){
    if ('string' == typeof messages) messages = [messages];
    var i = 0;
    speak();

    function speak(){
      var msg = messages[i];
      if (!msg) return;
      var wait = Math.max(msg.length * 45, 1500);
      say(msg);
      i++;
      setTimeout(speak, wait);
    }
  };
}
