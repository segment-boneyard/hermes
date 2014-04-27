
/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * What's my name?
 *
 * @param {Robot} robot
 */

function plugin(robot){
  robot.on('overhear', 'its', function(){
    robot.say('Don\'t you mean it\'s?');

    robot.once('mention', 'yes', function(){
      robot.emote('thought so!');
    });

    robot.once('mention', 'no', function(){
      robot.say('Oops.');
    });
  });
}