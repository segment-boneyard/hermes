
var tabify = require('tabify');
var Hermes = require('hermes');
var Plugin = require('plugin');
var ripple = require('ripple');
var repl = require('repl');
var template = require('./index.html');

/**
 * View.
 */

var View = ripple(template);
var view = new View();

view.appendTo('main');

var menu = view.el.querySelector('menu');
var ol = view.el.querySelector('ol');

/**
 * Plugins.
 */

var plugins = ['flip', 'hint', 'reminder', 'store'].reverse().map(function(name){
  var file = name + '.js';
  var a = document.createElement('a');
  a.textContent = file;
  a.classList.add('Shell-menu-item');
  menu.appendChild(a);

  var fn = require('./plugins/' + name);
  var view = new Plugin({ data: {
    file: file,
    code: 'module.exports = ' + fn.toString()
  }});

  view.appendTo(ol);
  return view;
});

/**
 * Hookup tabs.
 */

var items = menu.querySelectorAll('a');
var panes = ol.querySelectorAll('li');
var tabs = tabify(items, panes);
tabs.show(0);
tabs.on('show', load);

/**
 * Kickoff first time.
 */

load();

/**
 * Load a Hermes instance, copying the current code strings from each of the
 * plugin views, so that user changes are reflected.
 */

function load(){
  var hermes = new Hermes()
    .name('Hermes')
    .nickname('hermes')
    .use(repl('.Repl'));

  plugins.forEach(function(view){
    var code = view.code();
    var fn = new Function('robot', code);
    hermes.use(fn);
  });

  hermes.connect();
  hermes.say('Hey there, I\'m Hermes!');
  hermes.say('Type "@hermes help" to see what I can do.');
}
