
/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Teach Hermes to store key + values.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.help([
      'set <key> <value>',
      'get <key>',
      'delete <key>'
    ], 'Set, get or delete a <key> with <value>.');

    robot.on('mention', /get (\w+)/i, function(res){
      var key = res[1];
      res.reply(robot.data(key));
    });

    robot.on('mention', /set (\w+) (.*)/i, function(res){
      var key = res[1];
      var value = res[2];
      robot.data(key, value);
      res.say('Set "' + key + '" to "' + value + '".');
    });

    robot.on('mention', /delete (\w+)/i, function(res){
      var key = res[1];
      robot.data(key, null);
      res.say('Deleted "' + key + '".');
    });
  };
}