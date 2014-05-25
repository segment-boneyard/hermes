
var codemirror = require('codemirror');
var javascript = require('codemirror-mode-javascript')(codemirror);
var ripple = require('ripple');
var template = require('./index.html');

/**
 * Expose `Plugin`.
 */

var Plugin = module.exports = ripple(template);

/**
 * When mounted setup CodeMirror.
 */

Plugin.on('mounted', function(plugin){
  var textarea = plugin.el.querySelector('textarea');
  plugin.editor = codemirror.fromTextArea(textarea, {
    theme: 'custom',
    lineNumbers: true
  });
});

/**
 * Get the plugin's code.
 *
 * @return {String}
 */

Plugin.prototype.code = function(){
  var str = this.editor.getValue().trim();
  var regex = /^module\.exports += +function *\(robot\) *{([\s\S]*)};?$/m;
  var parsed = regex.exec(str)[1];
  return parsed.trim();
};