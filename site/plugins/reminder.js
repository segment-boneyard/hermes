
module.exports = function(robot){
  robot.help('reminder <n> <message>', 'Set a reminder <message> to appear in <n> minutes.');
  robot.on('mention', /remind(?:er)? (\d+) (.*)/i, function(res){
    var minutes = res[1];
    var msg = res[2];
    var ms = parseInt(minutes, 10) * 1000;
    var fn = res.say.bind(res, 'REMINDER: ' + msg);
    res.say('Sure thing, I set a reminder for ' + minutes + ' minutes from now.');
    setTimeout(fn, ms);
  });
};
