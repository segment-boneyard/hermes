
var assert = require('assert');
var filter = require('lodash').filter;
var find = require('lodash').find;
var values = require('lodash').values;

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
    var rooms = {};
    var users = {};

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

    /**
     * Get or set a room by `id`, or get all rooms.
     *
     * @param {String or Object} id (optional)
     * @param {Object} attrs (optional)
     * @return {Mixed}
     */

    robot.room = function(id, attrs){
      if (1 == arguments.length) {
        return 'string' == typeof id
          ? rooms[id]
          : find(rooms, id);
      }

      attrs = attrs || {};
      attrs.id = id;
      rooms[id] = attrs
      this.emit('room', id, attrs);
      return this;
    };

    /**
     * Get rooms by `attrs`.
     *
     * @param {Object} attrs (optional)
     * @return {Array}
     */

    robot.rooms = function(attrs){
      if (0 == arguments.length) return values(rooms);
      return filter(rooms, attrs);
    };

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
