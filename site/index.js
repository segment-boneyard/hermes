
var Hermes = require('hermes');
var Plugin = require('plugin');
var ripple = require('ripple');
var repl = require('repl');
var template = require('./index.html');

/**
 * Hermes.
 */

var hermes = new Hermes()
  .name('Hermes')
  .nickname('hermes')
  .use(repl('#repl'));

/**
 * View.
 */

var View = ripple(template);
var view = new View();
view.appendTo('main');

/**
 * Plugins.
 */

var menu = view.el.querySelector('menu');
var ol = view.el.querySelector('ol');
var plugins = {
  'flip.js': require('flip'),
  'store.js': require('store')
};

for (var file in plugins) {
  var fn = plugins[file];
  var code = fn.toString();
  var plugin = new Plugin({ data: {
    file: file,
    code: code
  }});

  var a = document.createElement('a');
  a.textContent = file;
  a.classList.add('Shell-menu-item');
  menu.appendChild(a);
  plugin.appendTo(ol);

  hermes.use(fn());
}

/**
 * Connect.
 */

hermes.connect();
hermes.say('Hey there, I\'m Hermes!');
hermes.say('Type "@hermes help" to see what I can do.');