
/**
 * Expose `plugin`.
 */

module.exports = exports = plugin;

/**
 * Add basic console logging to the `robot`.
 *
 * @param {Robot} robot
 */

function plugin(){
  return function(robot){

    /**
     * Say a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     */

    robot.say = function(message, context){
      var name = this.name();
      var msg = format('%s · %s', name, message);
      console.log(msg);
    };

    /**
     * Emote a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     */

    robot.emote = function(message, context){
      var name = this.name();
      var msg = format('%s %s', name, message);
      console.log(chalk.gray(msg));
    };

    /**
     * Reply to a `user` with a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     */

    robot.reply = function(message, context){
      if (!context) return;
      var name = this.name();
      var msg = format('%s · %s: %s', name, context.user, message);
      console.log(msg);
    };

    /**
     * Set the robot's `status`.
     *
     * @param {String} status
     */

    robot.status = function(status){
      var name = this.name();
      var msg = format('%s is now %s.', name, status);
      var col = color(status);
      console.log(chalk[col](msg));
    };

    /**
     * Set a `room`'s topic `message`.
     *
     * @param {String} room
     * @param {String} message
     */

    robot.topic = function(room, topic){
      var msg = format('New topic for %s: %s', room, topic);
      console.log(chalk.gray(msg));
    };
  }

  /**
   * Get the color for a given `status`.
   *
   * @param {String} status
   * @return {String}
   */

  function color(status){
    switch (status) {
      case 'offline': return 'red';
      case 'away': return 'yellow';
      case 'online': return 'green';
      default: return 'gray';
    }
  };
}
