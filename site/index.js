
var Hermes = require('hermes');
var ripple = require('ripple');
var repl = require('repl');
var template = require('./index.html');

/**
 * View.
 */

var View = ripple(template);
var view = new View();
view.appendTo('main');

/**
 * Hermes.
 */

var hermes = new Hermes()
  .name('Hermes')
  .nickname('hermes')
  .use(repl('#repl'));

/**
 * Plugins.
 */

hermes
  // .use(require('color')())
  // .use(require('css')())
  .use(require('flip')())
  // .use(require('math')())
  // .use(require('reminder')())
  .use(require('store')());

/**
 * Connect.
 */

hermes.connect();
