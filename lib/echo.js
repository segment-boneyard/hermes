
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
    var match = /^(say|emote|reply|error|warn|success|info|topic) (.*)$/;
    robot.on('mention', match, function(res){
      var method = res[1];
      var str = res[2];
      res[method](str);
    });
  };
}