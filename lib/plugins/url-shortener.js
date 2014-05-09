
var format = require('util').format;
var Google = require('google-url');
var google = new Google();

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Teach Hermes to shorten URLs with the Google API.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.on('mention', /shorten (\S+)/i, function(match, ctx){
      var url = match[1];
      google.shorten(url, function(err, res){
        if (err) return robot.error(err, ctx);
        var msg = format('%s ---> %s', res, url);
        robot.reply(ctx.user, msg, ctx);
      });
    });
  };
}