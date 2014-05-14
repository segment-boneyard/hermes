
module.exports = function(){
  return function(robot){
    console.log('Template: ' + robot.template());
    throw new Error();
  };
};