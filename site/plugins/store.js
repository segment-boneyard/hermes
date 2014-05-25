
module.exports = function(robot){
  robot.help([
    'get <key>',
    'set <key> <value>'
  ], 'Get or set a <key> with <value>.');

  robot.on('mention', /get (\w+)/i, function(res){
    var key = res[1];
    res.say(robot.data(key));
  });

  robot.on('mention', /set (\w+) (.*)/i, function(res){
    var key = res[1];
    var value = res[2];
    robot.data(key, value);
    res.say('Just set "' + key + '" to "' + value + '".');
  });
};
