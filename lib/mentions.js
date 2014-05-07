
/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add a few common mention types to a `robot`.
 *
 * @param {Robot} robot
 */

function plugin(){
  return function(robot){
    robot
      .match(at)
      .match(colon)
      .match(comma);

    /**
     * Match "@robot message".
     *
     * @param {String} name
     * @return {RegExp}
     */

    function at(name){
      return new RegExp('^@' + name + ' +(.*)$', 'im');
    }

    /**
     * Match "robot: message".
     *
     * @param {String} name
     * @return {RegExp}
     */

     function colon(name){
      return new RegExp('^' + name + ': *(.*)$', 'im');
     }

     /**
      * Match "message, robot".
      *
      * @param {String} name
      * @return {RegExp}
      */

     function comma(name){
      return new RegExp('^(.*), *' + name + '[ .!?]*$', 'im');
     }
  };
}