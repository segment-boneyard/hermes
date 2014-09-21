var assert = require('assert');
var filter = require('lodash').filter;
var find = require('lodash').find;
var values = require('lodash').values;

/**
 * Expose `plugin`.
 */

module.exports = exports = plugin;

/**
 * Add rooms info to the `robot`.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    var rooms = {};

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
  }
}
