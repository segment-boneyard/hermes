
var format = require('util').format;
var Google = require('google-url');
var google = new Google();
var github = require('gi');
var parse = require('url').parse;

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
      shorten(url, function(err, res){
        if (err) return robot.error(err, ctx);
        var msg = format('%s ---> %s', res, url);
        robot.reply(ctx.user, msg, ctx);
      });
    });
  };
}

/**
 * Shorten a `url`.
 *
 * @param {String} url
 * @param {Function} callback
 */

function shorten(url, callback){
  var parsed = parse(url);
  var fn = ~parsed.hostname.indexOf('github.')
    ? github
    : google.shorten.bind(google);
  fn(url, callback);
}