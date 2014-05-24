
var Repl = require('./repl');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add a browser shell to Hermes with an `el`.
 *
 * @param {Element} el
 * @return {Function}
 */

function plugin(el){
  return function(robot){
    var repl = new Repl();
    var id = 'user';

    robot.user(id, { name: 'You' });

    robot.connect = function(){
      repl.replace(el);
      repl.on('submit', function(text){
        var user = robot.user(id);
        repl.add({ text: text, name: user.name });
        robot.hear(text, { user: id });
      });
    };

    robot.say = function(msg, ctx){
      repl.add({ text: msg, name: robot.name() });
    };

    robot.reply = function(id, msg, ctx){
      var user = robot.user(id);
      var mention = robot.mention(user.nickname);
      msg = mention + msg;
      repl.add({ text: msg, name: robot.name() });
    };
  };
}
