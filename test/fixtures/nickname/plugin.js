
module.exports = function(){
  return function(robot){
    console.log('Name: ' + robot.name());
    console.log('Nickname: ' + robot.nickname());
    throw new Error();
  };
};