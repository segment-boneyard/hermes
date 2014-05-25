
var color = require('color');
var domify = require('domify');
var Picker = require('colorpicker');
var template = require('./index.html');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Add a helpful color picker to Hermes.
 *
 * @return {Function}
 */

function plugin(){
  return function(robot){
    robot.help('color', 'Open a color picker to pick a color.');
    robot.on('mention', 'color', function(res){
      var el = domify(template);
      var shell = document.querySelector('.Shell');
      shell.appendChild(el);
      el.offsetWidth;

      var picker = new Picker(el);
      picker.on('pick', function(){
        var str = el.style.backgroundColor;
        var hex = color(str).hexString();
        res.say('Your color is: ' + hex);
        picker.unbind();
        shell.removeChild(el);
      });
    });
  };
}
