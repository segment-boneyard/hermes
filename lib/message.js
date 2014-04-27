
var assert = require('assert');

/**
 * Expose `Message`.
 */

module.exports = Message;

/**
 * Initialize a new `Message` with `settings`.
 *
 * @param {Object} settings
 *   @property {String} room
 *   @property {String} text
 *   @property {String} user
 */

function Message(settings){
  assert(settings.id);
  assert(settings.room);
  assert(settings.text);
  assert(settings.user);
  this.id = settings.id;
  this.room = settings.room;
  this.text = settings.text;
  this.user = settings.user;
}