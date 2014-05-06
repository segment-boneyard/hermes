
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
  robot.on('overhear', 'its', function(ctx){
    robot.say('Don\'t you mean it\'s?', ctx);

    robot.once('mention', 'yes', ctx, function(){
      debugger;
      robot.emote('thought so!', ctx);
    });

    robot.once('mention', 'no', ctx, function(){
      debugger;
      robot.say('Oops.', ctx);
    });
  });
}