/**
 * Expose `plugin`.
 */

module.exports = exports = plugin;

/**
 * Add basic in-memory storage to the `robot`.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    var data = {};

    /**
     * Get or set a custom data by `key`.
     *
     * @param {String} key
     * @param {Object} value (optional)
     * @return {Mixed}
     */

    robot.data = function(key, value){
      if (1 == arguments.length) return data[key];
      data[key] = value;
      this.emit('data', key, value);
      return this;
    };
  };
}
