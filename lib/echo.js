
/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add echoing commands to the robot.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.on('mention', /^(say|emote|error|warn|success) (.*)$/, function(match, ctx){
      var method = match[1];
      var msg = match[2];
      robot[method](msg, ctx);
    });

    robot.on('mention', /^reply (.*)$/, function(match, ctx){
      var msg = match[1];
      robot.reply(ctx.user, msg, ctx);
    });

    robot.on('mention', /^topic (.*)$/, function(match, ctx){
      if (!ctx.room) return;
      var topic = match[1];
      robot.topic(ctx.room, topic);
    });
  };
}