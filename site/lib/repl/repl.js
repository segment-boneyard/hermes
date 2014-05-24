
var bind = require('bind-methods');
var each = require('each');
var Emitter = require('emitter');
var events = require('events');
var ripple = require('ripple');
var template = require('./repl.html');

/**
 * Expose `Repl`.
 */

var Repl = module.exports = ripple(template)
  .use(bind)
  .use(each)
  .use(events);

/**
 * Mixin `Emitter`.
 */

Emitter(Repl);

/**
 * When created, add defaults and bind all.
 */

Repl.on('created', function(repl){
  repl.data.messages = [];
});

/**
 * Add a message with `data` to the log.
 *
 * @param {Object} data
 *   @property {String} name
 *   @property {String} text
 */

Repl.prototype.add = function(data){
  this.data.messages.push(data);
};

/**
 * Submit handler.
 *
 * @param {Event} e
 */

Repl.prototype.submit = function(e){
  e.preventDefault();
  var input = this.el.querySelector('.Repl-input');
  this.emit('submit', input.value);
  input.value = '';
};