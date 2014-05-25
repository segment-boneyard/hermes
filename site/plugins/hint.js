
module.exports = function(robot){
  robot.help('hint', 'Give you a little hint.');
  robot.on('mention', 'hint', function(res){
    res.say('Hit a tab in the top-right, and change the code I\'m running ;)');
  });
};