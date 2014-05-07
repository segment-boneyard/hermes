
/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * What's my name?
 *
 * @param {Robot} robot
 */

function plugin(){
  return function(robot){
    robot.on('hear', 'its', function(ctx){
      robot.say('Don\'t you mean it\'s?', ctx);

      robot.once('mention', 'yes', ctx, function(){
        robot.emote('thought so!', ctx);
      });

      robot.once('mention', 'no', ctx, function(){
        robot.say('Oops.', ctx);
      });
    });
  };
}