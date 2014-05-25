
// var codemirror = require('codemirror');
var ripple = require('ripple');
var template = require('./index.html');

/**
 * Expose `Plugin`.
 */

var Plugin = module.exports = ripple(template);

/**
 * On created, setup CodeMirror.
 */

Plugin.on('created', function(plugin){
  // var textarea = plugin.el.querySelector('textarea');
  // var editor = codemirror.fromTextarea(textarea);

  // editor.on('save', function(e){
  //   plugin.code = e.value;
  // });
});

/**
 * Get the plugin's current code.
 *
 * @return {String}
 */

Plugin.prototype.code = function(){
  return '';
};