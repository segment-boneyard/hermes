
/**
 * Expose `speak`.
 */

module.exports = speak;

/**
 * Make the `robot` say an array of messages at a humanesque rhythm.
 *
 * @param {Robot} robot
 * @param {Array} messages
 * @param {Object} context
 */

function speak(robot, messages, context){
  if ('string' == typeof messages) messages = [messages];
  var i = 0;
  speak();

  function speak(){
    var msg = messages[i];
    if (!msg) return;
    var wait = Math.max(msg.length * 45, 1500);
    robot.say(msg, context);
    i++;
    setTimeout(speak, wait);
  }
}
