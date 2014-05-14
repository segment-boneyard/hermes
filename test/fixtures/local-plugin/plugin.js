
module.exports = function(){
  return function(robot){
    console.log('Local plugin applied!');
    throw new Error();
  };
};