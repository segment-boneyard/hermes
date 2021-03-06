var assert = require('assert');
var filter = require('lodash').filter;
var find = require('lodash').find;
var values = require('lodash').values;

/**
 * Expose `plugin`.
 */

module.exports = exports = plugin;

/**
 * Add users info to the `robot`.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    var users = {};

    /**
     * Get or set a user by `id`, or get all users.
     *
     * @param {String or Object} id (optional)
     * @param {Object} attrs (optional)
     * @return {Mixed}
     */

    robot.user = function(id, attrs){
      if (1 == arguments.length) {
        return 'string' == typeof id
          ? users[id]
          : find(users, id);
      }

      attrs = attrs || {};
      attrs.id = id;
      assert(attrs.name, 'A user must have a name.');
      if (!attrs.nickname) attrs.nickname = attrs.name;
      users[id] = attrs;
      this.emit('user', id, attrs);
      return this;
    };

    /**
     * Get users by `attrs`.
     *
     * @param {Object} attrs (optional)
     * @return {Array}
     */

    robot.users = function(attrs){
      if (0 == arguments.length) return values(users);
      return filter(users, attrs);
    };
  };
}
