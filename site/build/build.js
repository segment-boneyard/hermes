
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"\n\
var indexOf = [].indexOf;\n\
\n\
module.exports = function(arr, obj){\n\
  if (indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  if (!el) throw new Error('A DOM element reference is required');\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`, can force state via `force`.\n\
 *\n\
 * For browsers that support classList, but do not support `force` yet,\n\
 * the mistake will be detected and corrected.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} force\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name, force){\n\
  // classList\n\
  if (this.list) {\n\
    if (\"undefined\" !== typeof force) {\n\
      if (force !== this.list.toggle(name, force)) {\n\
        this.list.toggle(name); // toggle again to correct\n\
      }\n\
    } else {\n\
      this.list.toggle(name);\n\
    }\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (\"undefined\" !== typeof force) {\n\
    if (!force) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  } else {\n\
    if (this.has(name)) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("fredsterss-tabify/lib/index.js", Function("exports, require, module",
"var classes = require('classes')\n\
  , Emitter = require('emitter')\n\
  , events  = require('event');\n\
\n\
/**\n\
 * Expose Tabify\n\
 */\n\
module.exports = Tabify;\n\
\n\
/**\n\
 * Turn a linksEl and targetsEl\n\
 * @param {el} parent el of links you want to be tabs\n\
 * @param {el} parent el of targets for the tabs\n\
 */\n\
function Tabify (links, targets, options) {\n\
  if (!(this instanceof Tabify)) return new Tabify(links, targets, options);\n\
  options = options || {};\n\
  this.hiddenClass = options.hiddenClass || \"hidden\";\n\
  this.activeClass = options.activeClass || \"active\";\n\
  this.links = links;\n\
  this.targets = targets;\n\
  this.current = 0;\n\
  this.bind();\n\
  this.show(0);\n\
};\n\
\n\
/**\n\
 * Mixin emitter\n\
 */\n\
Emitter(Tabify.prototype);\n\
\n\
/**\n\
 * Show target and activate link\n\
 * @param  {Number} the tab order\n\
 * @return {Tabify}\n\
 */\n\
Tabify.prototype.show = function (i) {\n\
  this.current = i;\n\
  this.hide();\n\
  classes(this.links[i]).add(this.activeClass);\n\
  classes(this.targets[i]).remove(this.hiddenClass);\n\
  this.emit('show');\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Hide tab. If no id is passed, hide all.\n\
 * @param  {Number} tab id (order in array)\n\
 * @return {Tabify} \n\
 */\n\
Tabify.prototype.hide = function (id) {\n\
  for (i = 0; i < this.links.length; i++) {\n\
    if (id != null && id != i) { continue; }\n\
    classes(this.links[i]).remove(this.activeClass);\n\
    classes(this.targets[i]).add(this.hiddenClass);\n\
  }\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Show the next tab\n\
 * @return {Tabify}\n\
 */\n\
Tabify.prototype.next = function () {\n\
  if (this.current + 1 == this.links.length) {\n\
    this.emit('finished');\n\
    this.show(0);\n\
  } else {\n\
    this.show(this.current + 1);\n\
  }\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Show the previous tab\n\
 * @return {Tabify}\n\
 */\n\
Tabify.prototype.prev = function () {\n\
  if (this.current - 1 < 0) {\n\
    this.show(this.links.length - 1);\n\
  } else {\n\
    this.show(this.current - 1);\n\
  }\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Bind click events\n\
 * @return {Tabify}\n\
 */\n\
Tabify.prototype.bind = function () {\n\
  var self = this;\n\
  bindListener = function (i) {\n\
    events.bind(self.links[i], 'click', function () {\n\
      self.show(i);\n\
    });    \n\
  };\n\
  for (i = 0; i < this.links.length; i++) {\n\
    bindListener(i);\n\
  }\n\
  return this;\n\
}//@ sourceURL=fredsterss-tabify/lib/index.js"
));

require.register("anthonyshort-attributes/index.js", Function("exports, require, module",
"module.exports = function(el) {\r\n\
  var attrs = el.attributes,\r\n\
      ret = {},\r\n\
      attr,\r\n\
      i;\r\n\
\r\n\
  for (i = attrs.length - 1; i >= 0; i--) {\r\n\
    attr = attrs.item(i);\r\n\
    ret[attr.nodeName] = attr.nodeValue;\r\n\
  }\r\n\
\r\n\
  return ret;\r\n\
};//@ sourceURL=anthonyshort-attributes/index.js"
));
require.register("timoxley-to-array/index.js", Function("exports, require, module",
"/**\n\
 * Convert an array-like object into an `Array`.\n\
 * If `collection` is already an `Array`, then will return a clone of `collection`.\n\
 *\n\
 * @param {Array | Mixed} collection An `Array` or array-like object to convert e.g. `arguments` or `NodeList`\n\
 * @return {Array} Naive conversion of `collection` to a new `Array`.\n\
 * @api public\n\
 */\n\
\n\
module.exports = function toArray(collection) {\n\
  if (typeof collection === 'undefined') return []\n\
  if (collection === null) return [null]\n\
  if (collection === window) return [window]\n\
  if (typeof collection === 'string') return [collection]\n\
  if (isArray(collection)) return collection\n\
  if (typeof collection.length != 'number') return [collection]\n\
  if (typeof collection === 'function' && collection instanceof Function) return [collection]\n\
\n\
  var arr = []\n\
  for (var i = 0; i < collection.length; i++) {\n\
    if (Object.prototype.hasOwnProperty.call(collection, i) || i in collection) {\n\
      arr.push(collection[i])\n\
    }\n\
  }\n\
  if (!arr.length) return []\n\
  return arr\n\
}\n\
\n\
function isArray(arr) {\n\
  return Object.prototype.toString.call(arr) === \"[object Array]\";\n\
}\n\
//@ sourceURL=timoxley-to-array/index.js"
));
require.register("jaycetde-dom-contains/index.js", Function("exports, require, module",
"'use strict';\n\
\n\
var containsFn\n\
\t, node = window.Node\n\
;\n\
\n\
if (node && node.prototype) {\n\
\tif (node.prototype.contains) {\n\
\t\tcontainsFn = node.prototype.contains;\n\
\t} else if (node.prototype.compareDocumentPosition) {\n\
\t\tcontainsFn = function (arg) {\n\
\t\t\treturn !!(node.prototype.compareDocumentPosition.call(this, arg) & 16);\n\
\t\t};\n\
\t}\n\
}\n\
\n\
if (!containsFn) {\n\
\tcontainsFn = function (arg) {\n\
\t\tif (arg) {\n\
\t\t\twhile ((arg = arg.parentNode)) {\n\
\t\t\t\tif (arg === this) {\n\
\t\t\t\t\treturn true;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t\treturn false;\n\
\t};\n\
}\n\
\n\
module.exports = function (a, b) {\n\
\tvar adown = a.nodeType === 9 ? a.documentElement : a\n\
\t\t, bup = b && b.parentNode\n\
\t;\n\
\n\
\treturn a === bup || !!(bup && bup.nodeType === 1 && containsFn.call(adown, bup));\n\
};\n\
//@ sourceURL=jaycetde-dom-contains/index.js"
));
require.register("anthonyshort-dom-walk/index.js", Function("exports, require, module",
"var array = require('to-array');\n\
var contains = require('dom-contains');\n\
\n\
function walk(el, process, done, root) {\n\
  root = root || el;\n\
  var end = done || function(){};\n\
  var nodes = array(el.childNodes);\n\
\n\
  function next(){\n\
    if(nodes.length === 0) return end();\n\
    var nextNode = nodes.shift();\n\
    if(!contains(root, nextNode)) return next();\n\
    walk(nextNode, process, next, root);\n\
  }\n\
\n\
  process(el, next);\n\
}\n\
\n\
module.exports = walk;//@ sourceURL=anthonyshort-dom-walk/index.js"
));
require.register("anthonyshort-is-boolean-attribute/index.js", Function("exports, require, module",
"\n\
/**\n\
 * https://github.com/kangax/html-minifier/issues/63#issuecomment-18634279\n\
 */\n\
\n\
var attrs = [\n\
  \"allowfullscreen\",\n\
  \"async\",\n\
  \"autofocus\",\n\
  \"checked\",\n\
  \"compact\",\n\
  \"declare\",\n\
  \"default\",\n\
  \"defer\",\n\
  \"disabled\",\n\
  \"formnovalidate\",\n\
  \"hidden\",\n\
  \"inert\",\n\
  \"ismap\",\n\
  \"itemscope\",\n\
  \"multiple\",\n\
  \"multiple\",\n\
  \"muted\",\n\
  \"nohref\",\n\
  \"noresize\",\n\
  \"noshade\",\n\
  \"novalidate\",\n\
  \"nowrap\",\n\
  \"open\",\n\
  \"readonly\",\n\
  \"required\",\n\
  \"reversed\",\n\
  \"seamless\",\n\
  \"selected\",\n\
  \"sortable\",\n\
  \"truespeed\",\n\
  \"typemustmatch\",\n\
  \"contenteditable\",\n\
  \"spellcheck\"\n\
];\n\
\n\
module.exports = function(attr){\n\
  return attrs.indexOf(attr) > -1;\n\
};//@ sourceURL=anthonyshort-is-boolean-attribute/index.js"
));
require.register("component-raf/index.js", Function("exports, require, module",
"/**\n\
 * Expose `requestAnimationFrame()`.\n\
 */\n\
\n\
exports = module.exports = window.requestAnimationFrame\n\
  || window.webkitRequestAnimationFrame\n\
  || window.mozRequestAnimationFrame\n\
  || window.oRequestAnimationFrame\n\
  || window.msRequestAnimationFrame\n\
  || fallback;\n\
\n\
/**\n\
 * Fallback implementation.\n\
 */\n\
\n\
var prev = new Date().getTime();\n\
function fallback(fn) {\n\
  var curr = new Date().getTime();\n\
  var ms = Math.max(0, 16 - (curr - prev));\n\
  var req = setTimeout(fn, ms);\n\
  prev = curr;\n\
  return req;\n\
}\n\
\n\
/**\n\
 * Cancel.\n\
 */\n\
\n\
var cancel = window.cancelAnimationFrame\n\
  || window.webkitCancelAnimationFrame\n\
  || window.mozCancelAnimationFrame\n\
  || window.oCancelAnimationFrame\n\
  || window.msCancelAnimationFrame\n\
  || window.clearTimeout;\n\
\n\
exports.cancel = function(id){\n\
  cancel.call(window, id);\n\
};\n\
//@ sourceURL=component-raf/index.js"
));
require.register("anthonyshort-raf-queue/index.js", Function("exports, require, module",
"var raf = require('raf');\n\
var queue = [];\n\
var requestId;\n\
var id = 0;\n\
\n\
/**\n\
 * Add a job to the queue passing in\n\
 * an optional context to call the function in\n\
 *\n\
 * @param {Function} fn\n\
 * @param {Object} cxt\n\
 */\n\
\n\
function frame (fn, cxt) {\n\
  var frameId = id++;\n\
  var length = queue.push({\n\
    id: frameId,\n\
    fn: fn,\n\
    cxt: cxt\n\
  });\n\
  if(!requestId) requestId = raf(flush);\n\
  return frameId;\n\
};\n\
\n\
/**\n\
 * Remove a job from the queue using the\n\
 * frameId returned when it was added\n\
 *\n\
 * @param {Number} id\n\
 */\n\
\n\
frame.cancel = function (id) {\n\
  for (var i = queue.length - 1; i >= 0; i--) {\n\
    if(queue[i].id === id) {\n\
      queue.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Add a function to the queue, but only once\n\
 *\n\
 * @param {Function} fn\n\
 * @param {Object} cxt\n\
 */\n\
\n\
frame.once = function (fn, cxt) {\n\
  for (var i = queue.length - 1; i >= 0; i--) {\n\
    if(queue[i].fn === fn) return;\n\
  }\n\
  frame(fn, cxt);\n\
};\n\
\n\
/**\n\
 * Get the current queue length\n\
 */\n\
\n\
frame.queued = function () {\n\
  return queue.length;\n\
};\n\
\n\
/**\n\
 * Clear the queue and remove all pending jobs\n\
 */\n\
\n\
frame.clear = function () {\n\
  queue = [];\n\
  if(requestId) raf.cancel(requestId);\n\
  requestId = null;\n\
};\n\
\n\
/**\n\
 * Fire a function after all of the jobs in the\n\
 * current queue have fired. This is usually used\n\
 * in testing.\n\
 */\n\
\n\
frame.defer = function (fn) {\n\
  raf(raf.bind(null, fn));\n\
};\n\
\n\
/**\n\
 * Flushes the queue and runs each job\n\
 */\n\
\n\
function flush () {\n\
  while(queue.length) {\n\
    var job = queue.shift();\n\
    job.fn.call(job.cxt);\n\
  }\n\
  requestId = null;\n\
}\n\
\n\
module.exports = frame;//@ sourceURL=anthonyshort-raf-queue/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
map.td =\n\
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];\n\
\n\
map.option =\n\
map.optgroup = [1, '<select multiple=\"multiple\">', '</select>'];\n\
\n\
map.thead =\n\
map.tbody =\n\
map.colgroup =\n\
map.caption =\n\
map.tfoot = [1, '<table>', '</table>'];\n\
\n\
map.text =\n\
map.circle =\n\
map.ellipse =\n\
map.line =\n\
map.path =\n\
map.polygon =\n\
map.polyline =\n\
map.rect = [1, '<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">','</svg>'];\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
  \n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // one element\n\
  if (el.firstChild == el.lastChild) {\n\
    return el.removeChild(el.firstChild);\n\
  }\n\
\n\
  // several elements\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.firstChild) {\n\
    fragment.appendChild(el.removeChild(el.firstChild));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-props/index.js", Function("exports, require, module",
"/**\n\
 * Global Names\n\
 */\n\
\n\
var globals = /\\b(this|Array|Date|Object|Math|JSON)\\b/g;\n\
\n\
/**\n\
 * Return immediate identifiers parsed from `str`.\n\
 *\n\
 * @param {String} str\n\
 * @param {String|Function} map function or prefix\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str, fn){\n\
  var p = unique(props(str));\n\
  if (fn && 'string' == typeof fn) fn = prefixed(fn);\n\
  if (fn) return map(str, p, fn);\n\
  return p;\n\
};\n\
\n\
/**\n\
 * Return immediate identifiers in `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function props(str) {\n\
  return str\n\
    .replace(/\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\//g, '')\n\
    .replace(globals, '')\n\
    .match(/[$a-zA-Z_]\\w*/g)\n\
    || [];\n\
}\n\
\n\
/**\n\
 * Return `str` with `props` mapped with `fn`.\n\
 *\n\
 * @param {String} str\n\
 * @param {Array} props\n\
 * @param {Function} fn\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function map(str, props, fn) {\n\
  var re = /\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\/|[a-zA-Z_]\\w*/g;\n\
  return str.replace(re, function(_){\n\
    if ('(' == _[_.length - 1]) return fn(_);\n\
    if (!~props.indexOf(_)) return _;\n\
    return fn(_);\n\
  });\n\
}\n\
\n\
/**\n\
 * Return unique array.\n\
 *\n\
 * @param {Array} arr\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function unique(arr) {\n\
  var ret = [];\n\
\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (~ret.indexOf(arr[i])) continue;\n\
    ret.push(arr[i]);\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Map with prefix `str`.\n\
 */\n\
\n\
function prefixed(str) {\n\
  return function(_){\n\
    return str + _;\n\
  };\n\
}\n\
//@ sourceURL=component-props/index.js"
));
require.register("component-to-function/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var expr = require('props');\n\
\n\
/**\n\
 * Expose `toFunction()`.\n\
 */\n\
\n\
module.exports = toFunction;\n\
\n\
/**\n\
 * Convert `obj` to a `Function`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function toFunction(obj) {\n\
  switch ({}.toString.call(obj)) {\n\
    case '[object Object]':\n\
      return objectToFunction(obj);\n\
    case '[object Function]':\n\
      return obj;\n\
    case '[object String]':\n\
      return stringToFunction(obj);\n\
    case '[object RegExp]':\n\
      return regexpToFunction(obj);\n\
    default:\n\
      return defaultToFunction(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Default to strict equality.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function defaultToFunction(val) {\n\
  return function(obj){\n\
    return val === obj;\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert `re` to a function.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function regexpToFunction(re) {\n\
  return function(obj){\n\
    return re.test(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert property `str` to a function.\n\
 *\n\
 * @param {String} str\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function stringToFunction(str) {\n\
  // immediate such as \"> 20\"\n\
  if (/^ *\\W+/.test(str)) return new Function('_', 'return _ ' + str);\n\
\n\
  // properties such as \"name.first\" or \"age > 18\" or \"age > 18 && age < 36\"\n\
  return new Function('_', 'return ' + get(str));\n\
}\n\
\n\
/**\n\
 * Convert `object` to a function.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function objectToFunction(obj) {\n\
  var match = {}\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key])\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  }\n\
}\n\
\n\
/**\n\
 * Built the getter function. Supports getter style functions\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function get(str) {\n\
  var props = expr(str);\n\
  if (!props.length) return '_.' + str;\n\
\n\
  var val;\n\
  for(var i = 0, prop; prop = props[i]; i++) {\n\
    val = '_.' + prop;\n\
    val = \"('function' == typeof \" + val + \" ? \" + val + \"() : \" + val + \")\";\n\
    str = str.replace(new RegExp(prop, 'g'), val);\n\
  }\n\
\n\
  return str;\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var type = require('type');\n\
var toFunction = require('to-function');\n\
\n\
/**\n\
 * HOP reference.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * Iterate the given `obj` and invoke `fn(val, i)`\n\
 * in optional context `ctx`.\n\
 *\n\
 * @param {String|Array|Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} [ctx]\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn, ctx){\n\
  fn = toFunction(fn);\n\
  ctx = ctx || this;\n\
  switch (type(obj)) {\n\
    case 'array':\n\
      return array(obj, fn, ctx);\n\
    case 'object':\n\
      if ('number' == typeof obj.length) return array(obj, fn, ctx);\n\
      return object(obj, fn, ctx);\n\
    case 'string':\n\
      return string(obj, fn, ctx);\n\
  }\n\
};\n\
\n\
/**\n\
 * Iterate string chars.\n\
 *\n\
 * @param {String} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function string(obj, fn, ctx) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn.call(ctx, obj.charAt(i), i);\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate object keys.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn, ctx) {\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      fn.call(ctx, key, obj[key]);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate array-ish.\n\
 *\n\
 * @param {Array|Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn, ctx) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn.call(ctx, obj[i], i);\n\
  }\n\
}\n\
//@ sourceURL=component-each/index.js"
));
require.register("ripplejs-expression/index.js", Function("exports, require, module",
"var props = require('props');\n\
var unique = require('uniq');\n\
var cache = {};\n\
\n\
function Expression(str) {\n\
  this.str = str;\n\
  this.props = unique(props(str));\n\
  this.fn = compile(str, this.props);\n\
}\n\
\n\
Expression.prototype.exec = function(scope, context){\n\
  scope = scope || {};\n\
  var args = scope ? values(scope, this.props) : [];\n\
  return this.fn.apply(context, args);\n\
};\n\
\n\
Expression.prototype.toString = function(){\n\
  return this.str;\n\
};\n\
\n\
function values(obj, keys) {\n\
  return keys.map(function(key){\n\
    return obj[key];\n\
  });\n\
}\n\
\n\
function compile(str, props){\n\
  if(cache[str]) return cache[str];\n\
  var args = props.slice();\n\
  args.push('return ' + str);\n\
  var fn = Function.apply(null, args);\n\
  cache[str] = fn;\n\
  return fn;\n\
}\n\
\n\
module.exports = Expression;//@ sourceURL=ripplejs-expression/index.js"
));
require.register("component-format-parser/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Parse the given format `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str){\n\
\treturn str.split(/ *\\| */).map(function(call){\n\
\t\tvar parts = call.split(':');\n\
\t\tvar name = parts.shift();\n\
\t\tvar args = parseArgs(parts.join(':'));\n\
\n\
\t\treturn {\n\
\t\t\tname: name,\n\
\t\t\targs: args\n\
\t\t};\n\
\t});\n\
};\n\
\n\
/**\n\
 * Parse args `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parseArgs(str) {\n\
\tvar args = [];\n\
\tvar re = /\"([^\"]*)\"|'([^']*)'|([^ \\t,]+)/g;\n\
\tvar m;\n\
\t\n\
\twhile (m = re.exec(str)) {\n\
\t\targs.push(m[2] || m[1] || m[0]);\n\
\t}\n\
\t\n\
\treturn args;\n\
}\n\
//@ sourceURL=component-format-parser/index.js"
));
require.register("ripplejs-interpolate/index.js", Function("exports, require, module",
"var Expression = require('expression');\n\
var parse = require('format-parser');\n\
var unique = require('uniq');\n\
\n\
/**\n\
 * Run a value through all filters\n\
 *\n\
 * @param  {Mixed}  val    Any value returned from an expression\n\
 * @param  {Array}  types  The filters eg. currency | float | floor\n\
 * @param  {Object} fns     Mapping of filter names, eg. currency, to functions\n\
 * @return {Mixed}\n\
 */\n\
function filter(val, types, fns) {\n\
  fns = fns || {};\n\
  var filters = parse(types.join('|'));\n\
  filters.forEach(function(f){\n\
    var name = f.name.trim();\n\
    var fn = fns[name];\n\
    var args = f.args.slice();\n\
    args.unshift(val);\n\
    if(!fn) throw new Error('Missing filter named \"' + name + '\"');\n\
    val = fn.apply(null, args);\n\
  });\n\
  return val;\n\
}\n\
\n\
/**\n\
 * Create a new interpolator\n\
 */\n\
function Interpolate() {\n\
  this.match = /\\{\\{([^}]+)\\}\\}/g;\n\
  this.filters = {};\n\
}\n\
\n\
/**\n\
 * Hook for plugins\n\
 *\n\
 * @param {Function} fn\n\
 *\n\
 * @return {Interpolate}\n\
 */\n\
Interpolate.prototype.use = function(fn) {\n\
  fn(this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set the delimiters\n\
 *\n\
 * @param {Regex} match\n\
 *\n\
 * @return {Interpolate}\n\
 */\n\
Interpolate.prototype.delimiters = function(match) {\n\
  this.match = match;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Check if a string matches the delimiters\n\
 *\n\
 * @param {String} input\n\
 *\n\
 * @return {Array}\n\
 */\n\
Interpolate.prototype.matches = function(input) {\n\
  var test = new RegExp(this.match.source);\n\
  var matches = test.exec(input);\n\
  if(!matches) return [];\n\
  return matches;\n\
};\n\
\n\
/**\n\
 * Add a new filter\n\
 *\n\
 * @param {String} name\n\
 * @param {Function} fn\n\
 *\n\
 * @return {Interpolate}\n\
 */\n\
Interpolate.prototype.filter = function(name, fn){\n\
  this.filters[name] = fn;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Interpolate a string using the contents\n\
 * inside of the delimiters\n\
 *\n\
 * @param  {String} input\n\
 * @param  {Object} options\n\
 * @return {String}\n\
 */\n\
Interpolate.prototype.exec = function(input, options){\n\
  options = options || {};\n\
  var parts = input.split('|');\n\
  var expr = parts.shift();\n\
  var fn = new Expression(expr);\n\
  var val = fn.exec(options.scope, options.context);\n\
  if(parts.length) {\n\
    val = filter(val, parts, options.filters || this.filters);\n\
  }\n\
  return val;\n\
};\n\
\n\
\n\
/**\n\
 * Check if a string has interpolation\n\
 *\n\
 * @param {String} input\n\
 *\n\
 * @return {Boolean}\n\
 */\n\
Interpolate.prototype.has = function(input) {\n\
  return input.search(this.match) > -1;\n\
};\n\
\n\
\n\
/**\n\
 * Interpolate as a string and replace each\n\
 * match with the interpolated value\n\
 *\n\
 * @return {String}\n\
 */\n\
Interpolate.prototype.replace = function(input, options){\n\
  var self = this;\n\
  return input.replace(this.match, function(_, match){\n\
    var val = self.exec(match, options);\n\
    return (val == null) ? '' : val;\n\
  });\n\
};\n\
\n\
\n\
/**\n\
 * Get the interpolated value from a string\n\
 */\n\
Interpolate.prototype.value = function(input, options){\n\
  var matches = this.matches(input);\n\
  if( matches.length === 0 ) return input;\n\
  if( matches[0].length !== input.length ) return this.replace(input, options);\n\
  return this.exec(matches[1], options);\n\
};\n\
\n\
\n\
/**\n\
 * Get all the interpolated values from a string\n\
 *\n\
 * @return {Array} Array of values\n\
 */\n\
Interpolate.prototype.values = function(input, options){\n\
  var self = this;\n\
  return this.map(input, function(match){\n\
    return self.value(match, options);\n\
  });\n\
};\n\
\n\
\n\
/**\n\
 * Find all the properties used in all expressions in a string\n\
 * @param  {String} str\n\
 * @return {Array}\n\
 */\n\
Interpolate.prototype.props = function(str) {\n\
  var arr = [];\n\
  this.each(str, function(match, expr, filters){\n\
    var fn = new Expression(expr);\n\
    arr = arr.concat(fn.props);\n\
  });\n\
  return unique(arr);\n\
};\n\
\n\
\n\
/**\n\
 * Loop through each matched expression in a string\n\
 *\n\
 * @param {String} str\n\
 *\n\
 * @return {void}\n\
 */\n\
Interpolate.prototype.each = function(str, callback) {\n\
  var m;\n\
  var index = 0;\n\
  var re = this.match;\n\
  while (m = re.exec(str)) {\n\
    var parts = m[1].split('|');\n\
    var expr = parts.shift();\n\
    var filters = parts.join('|');\n\
    callback(m[0], expr, filters, index);\n\
    index++;\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Map the string\n\
 *\n\
 * @param {String} str\n\
 * @param {Function} callback\n\
 *\n\
 * @return {Array}\n\
 */\n\
Interpolate.prototype.map = function(str, callback) {\n\
  var ret = [];\n\
  this.each(str, function(){\n\
    ret.push(callback.apply(null, arguments));\n\
  });\n\
  return ret;\n\
};\n\
\n\
\n\
module.exports = Interpolate;//@ sourceURL=ripplejs-interpolate/index.js"
));
require.register("ripplejs-keypath/index.js", Function("exports, require, module",
"exports.get = function(obj, path) {\n\
  var parts = path.split('.');\n\
  var value = obj;\n\
  while(parts.length) {\n\
    var part = parts.shift();\n\
    value = value[part];\n\
    if(value === undefined) parts.length = 0;\n\
  }\n\
  return value;\n\
};\n\
\n\
exports.set = function(obj, path, value) {\n\
  var parts = path.split('.');\n\
  var target = obj;\n\
  var last = parts.pop();\n\
  while(parts.length) {\n\
    part = parts.shift();\n\
    if(!target[part]) target[part] = {};\n\
    target = target[part];\n\
  }\n\
  target[last] = value;\n\
};//@ sourceURL=ripplejs-keypath/index.js"
));
require.register("ripplejs-path-observer/index.js", Function("exports, require, module",
"var emitter = require('emitter');\n\
var keypath = require('keypath');\n\
var type = require('type');\n\
var raf = require('raf-queue');\n\
\n\
module.exports = function(obj) {\n\
\n\
  /**\n\
   * Stores each observer created for each\n\
   * path so they're singletons. This allows us to\n\
   * fire change events on all related paths.\n\
   *\n\
   * @type {Object}\n\
   */\n\
  var cache = {};\n\
\n\
  /**\n\
   * Takes a path and announces whenever\n\
   * the value at that path changes.\n\
   *\n\
   * @param {String} path The keypath to the value 'foo.bar.baz'\n\
   */\n\
  function PathObserver(path) {\n\
    if(!(this instanceof PathObserver)) return new PathObserver(path);\n\
    if(cache[path]) return cache[path];\n\
    this.path = path;\n\
    Object.defineProperty(this, 'value', {\n\
      get: function() {\n\
        return keypath.get(obj, this.path);\n\
      },\n\
      set: function(val) {\n\
        keypath.set(obj, this.path, val);\n\
      }\n\
    });\n\
    cache[path] = this;\n\
  }\n\
\n\
  /**\n\
   * Remove all path observers\n\
   */\n\
  PathObserver.dispose = function() {\n\
    for(var path in cache) {\n\
      cache[path].dispose();\n\
    }\n\
    this.off();\n\
  };\n\
\n\
  /**\n\
   * Emit a change event next tick\n\
   */\n\
  PathObserver.change = function() {\n\
    raf.once(this.notify, this);\n\
  };\n\
\n\
  /**\n\
   * Notify observers of a change\n\
   */\n\
  PathObserver.notify = function() {\n\
    this.emit('change');\n\
  };\n\
\n\
  /**\n\
   * Mixin\n\
   */\n\
  emitter(PathObserver);\n\
  emitter(PathObserver.prototype);\n\
\n\
  /**\n\
   * Get the value of the path.\n\
   *\n\
   * @return {Mixed}\n\
   */\n\
  PathObserver.prototype.get = function() {\n\
    return this.value;\n\
  };\n\
\n\
  /**\n\
   * Set the value of the keypath\n\
   *\n\
   * @return {PathObserver}\n\
   */\n\
  PathObserver.prototype.set = function(val) {\n\
    var current = this.value;\n\
\n\
    if (type(val) === 'object') {\n\
      var changes = 0;\n\
      for (var key in val) {\n\
        var path = new PathObserver(this.path + '.' + key);\n\
        path.once('change', function(){\n\
          changes += 1;\n\
        });\n\
        path.set(val[key]);\n\
      }\n\
      if (changes > 0) {\n\
        this.emit('change', this.value, current);\n\
      }\n\
      return;\n\
    }\n\
\n\
    // no change\n\
    if(current === val) return this;\n\
\n\
    this.value = val;\n\
    this.emit('change', this.value, current);\n\
    PathObserver.change();\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Bind to changes on this path\n\
   *\n\
   * @param {Function} fn\n\
   *\n\
   * @return {Function}\n\
   */\n\
  PathObserver.prototype.change = function(fn){\n\
    var self = this;\n\
    self.on('change', fn);\n\
    return function(){\n\
      self.off('change', fn);\n\
    };\n\
  };\n\
\n\
  /**\n\
   * Clean up and remove all event bindings\n\
   */\n\
  PathObserver.prototype.dispose = function(){\n\
    this.off('change');\n\
    delete cache[this.path];\n\
  };\n\
\n\
  return PathObserver;\n\
};//@ sourceURL=ripplejs-path-observer/index.js"
));
require.register("yields-uniq/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
try {\n\
  var indexOf = require('indexof');\n\
} catch(e){\n\
  var indexOf = require('indexof-component');\n\
}\n\
\n\
/**\n\
 * Create duplicate free array\n\
 * from the provided `arr`.\n\
 *\n\
 * @param {Array} arr\n\
 * @param {Array} select\n\
 * @return {Array}\n\
 */\n\
\n\
module.exports = function (arr, select) {\n\
  var len = arr.length, ret = [], v;\n\
  select = select ? (select instanceof Array ? select : [select]) : false;\n\
\n\
  for (var i = 0; i < len; i++) {\n\
    v = arr[i];\n\
    if (select && !~indexOf(select, v)) {\n\
      ret.push(v);\n\
    } else if (!~indexOf(ret, v)) {\n\
      ret.push(v);\n\
    }\n\
  }\n\
  return ret;\n\
};\n\
//@ sourceURL=yields-uniq/index.js"
));
require.register("ripplejs-ripple/lib/index.js", Function("exports, require, module",
"var view = require('./view');\n\
\n\
module.exports = function(template) {\n\
  if(template.indexOf('#') === 0 || template.indexOf('.') === 0) {\n\
    template = document.querySelector(template);\n\
  }\n\
  if(typeof template.innerHTML === 'string') {\n\
    template = template.innerHTML;\n\
  }\n\
  return view(template);\n\
};//@ sourceURL=ripplejs-ripple/lib/index.js"
));
require.register("ripplejs-ripple/lib/view.js", Function("exports, require, module",
"var emitter = require('emitter');\n\
var each = require('each');\n\
var model = require('./model');\n\
var Bindings = require('./bindings');\n\
var render = require('./render');\n\
\n\
/**\n\
 * Each of the events that are called on the view\n\
 * and have helper methods created for them.\n\
 */\n\
\n\
var lifecycleEvents = [\n\
  'construct',\n\
  'created',\n\
  'ready',\n\
  'mounted',\n\
  'unmounted',\n\
  'destroying',\n\
  'destroyed'\n\
];\n\
\n\
/**\n\
 * Get a node using element the element itself\n\
 * or a CSS selector\n\
 *\n\
 * @param {Element|String} node\n\
 *\n\
 * @return {Element}\n\
 */\n\
\n\
function getNode(node) {\n\
  if (typeof node === 'string') {\n\
    node = document.querySelector(node);\n\
    if (!node) throw new Error('DOM node doesn\\'t exist');\n\
  }\n\
  return node;\n\
}\n\
\n\
/**\n\
 * Create a new view from a template string\n\
 *\n\
 * @param {String} template\n\
 *\n\
 * @return {View}\n\
 */\n\
\n\
function createView(template) {\n\
\n\
  /**\n\
   * The view controls the lifecycle of the\n\
   * element that it creates from a template.\n\
   * Each element can only have one view and\n\
   * each view can only have one element.\n\
   */\n\
\n\
  function View(options) {\n\
    options = options || {};\n\
    View.emit('construct', this, [options]);\n\
    this.options = options;\n\
    this.children = [];\n\
    this.owner = options.owner;\n\
    this.template = options.template || template;\n\
    this.root = this;\n\
    if (this.owner) {\n\
      this.owner.children.push(this);\n\
      this.root = this.owner.root;\n\
    }\n\
    this.scope = options.scope;\n\
    this.scopeWatchers = {};\n\
    this.model = new View.Model(View.parse(options));\n\
    this.data = this.model.props;\n\
    View.emit('created', this);\n\
    this.el = this.render();\n\
    View.emit('ready', this);\n\
  }\n\
\n\
  /**\n\
   * Mixins\n\
   */\n\
\n\
  emitter(View);\n\
  emitter(View.prototype);\n\
\n\
  /**\n\
   * Stores all of the directives, views,\n\
   * filters etc. that we might want to share\n\
   * between views.\n\
   *\n\
   * @type {Bindings}\n\
   */\n\
\n\
  View.bindings = new Bindings();\n\
\n\
  /**\n\
   * Stores the state of the view.\n\
   *\n\
   * @type {Function}\n\
   */\n\
\n\
  View.Model = model();\n\
\n\
  /**\n\
   * Add a directive\n\
   *\n\
   * @param {String|Regex} match\n\
   * @param {Function} fn\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.directive = function(match, fn) {\n\
    this.bindings.directive(match, fn);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Add a component\n\
   *\n\
   * @param {String} match\n\
   * @param {Function} fn\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.compose = function(name, Child) {\n\
    this.bindings.component(name, Child);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Add interpolation filter\n\
   *\n\
   * @param {String} name\n\
   * @param {Function} fn\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.filter = function(name, fn) {\n\
    if (typeof name !== 'string') {\n\
      for(var key in name) {\n\
        View.filter(key, name[key]);\n\
      }\n\
      return;\n\
    }\n\
    this.bindings.filter(name, fn);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Use a plugin\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.use = function(fn, options) {\n\
    fn(View, options);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Create a new view from a template that shares\n\
   * all of the same Bindings\n\
   *\n\
   * @param {String} template\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.create = function(template) {\n\
    var Child = createView(template);\n\
    Child.bindings = this.bindings;\n\
    return Child;\n\
  };\n\
\n\
  /**\n\
   * Create helper methods for binding to events\n\
   */\n\
\n\
  lifecycleEvents.forEach(function(name) {\n\
    View[name] = function(fn){\n\
      View.on(name, function(view, args){\n\
        fn.apply(view, args);\n\
      });\n\
    };\n\
  });\n\
\n\
  /**\n\
   * Parse the options for the initial data\n\
   */\n\
\n\
  View.parse = function(options) {\n\
    return options.data;\n\
  };\n\
\n\
  /**\n\
   * Set the state off the view. This will trigger\n\
   * refreshes to the UI. If we were previously\n\
   * watching the parent scope for changes to this\n\
   * property, we will remove all of those watchers\n\
   * and then bind them to our model instead.\n\
   *\n\
   * @param {Object} obj\n\
   */\n\
\n\
  View.prototype.set = function(key, value) {\n\
    if ( typeof key !== 'string' ) {\n\
      for(var name in key) this.set(name, key[name]);\n\
      return this;\n\
    }\n\
    if (this.scope && this.scopeWatchers[key]) {\n\
      var self = this;\n\
      this.scopeWatchers[key].forEach(function(callback){\n\
        self.scope.unwatch(key, callback);\n\
        self.model.watch(key, callback);\n\
      });\n\
      delete this.scopeWatchers[key];\n\
    }\n\
    this.model.set(key, value);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Get some data\n\
   *\n\
   * @param {String} key\n\
   */\n\
\n\
  View.prototype.get = function(key) {\n\
    var value = this.model.get(key);\n\
    if (value === undefined && this.scope) {\n\
      return this.scope.get(key);\n\
    }\n\
    return value;\n\
  };\n\
\n\
  /**\n\
   * Get all the properties used in a string\n\
   *\n\
   * @param {String} str\n\
   *\n\
   * @return {Array}\n\
   */\n\
\n\
  View.prototype.props = function(str) {\n\
    return View.bindings.interpolator.props(str);\n\
  };\n\
\n\
  /**\n\
   * Remove the element from the DOM\n\
   */\n\
\n\
  View.prototype.destroy = function() {\n\
    var self = this;\n\
    this.emit('destroying');\n\
    View.emit('destroying', this);\n\
    this.remove();\n\
    this.model.destroy();\n\
    this.off();\n\
    this.children.forEach(function(child){\n\
      child.destroy();\n\
    });\n\
    if (this.owner) {\n\
      var index = this.owner.children.indexOf(this);\n\
      this.owner.children.splice(index, 1);\n\
    }\n\
    each(this.scopeWatchers, function(key, callbacks){\n\
      callbacks.forEach(function(callback){\n\
        self.scope.unwatch(key, callback);\n\
      });\n\
    });\n\
    this.scopeWatchers = null;\n\
    this.scope = null;\n\
    this.el = null;\n\
    this.owner = null;\n\
    this.root = null;\n\
    this.data = null;\n\
    this.emit('destroyed');\n\
    View.emit('destroyed', this);\n\
  };\n\
\n\
  /**\n\
   * Is the view mounted in the DOM\n\
   *\n\
   * @return {Boolean}\n\
   */\n\
\n\
  View.prototype.isMounted = function() {\n\
    return this.el != null && this.el.parentNode != null;\n\
  };\n\
\n\
  /**\n\
   * Render the view to an element. This should\n\
   * only ever render the element once.\n\
   */\n\
\n\
  View.prototype.render = function() {\n\
    return render({\n\
      view: this,\n\
      template: this.template,\n\
      bindings: View.bindings\n\
    });\n\
  };\n\
\n\
  /**\n\
   * Mount the view onto a node\n\
   *\n\
   * @param {Element|String} node An element or CSS selector\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.prototype.appendTo = function(node) {\n\
    getNode(node).appendChild(this.el);\n\
    this.emit('mounted');\n\
    View.emit('mounted', this);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Replace an element in the DOM with this view\n\
   *\n\
   * @param {Element|String} node An element or CSS selector\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.prototype.replace = function(node) {\n\
    var target = getNode(node);\n\
    target.parentNode.replaceChild(this.el, target);\n\
    this.emit('mounted');\n\
    View.emit('mounted', this);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Insert the view before a node\n\
   *\n\
   * @param {Element|String} node\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.prototype.before = function(node) {\n\
    var target = getNode(node);\n\
    target.parentNode.insertBefore(this.el, target);\n\
    this.emit('mounted');\n\
    View.emit('mounted', this);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Insert the view after a node\n\
   *\n\
   * @param {Element|String} node\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.prototype.after = function(node) {\n\
    var target = getNode(node);\n\
    target.parentNode.insertBefore(this.el, target.nextSibling);\n\
    this.emit('mounted');\n\
    View.emit('mounted', this);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Remove the view from the DOM\n\
   *\n\
   * @return {View}\n\
   */\n\
\n\
  View.prototype.remove = function() {\n\
    if (this.isMounted() === false) return this;\n\
    this.el.parentNode.removeChild(this.el);\n\
    this.emit('unmounted');\n\
    View.emit('unmounted', this);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Interpolate a string\n\
   *\n\
   * @param {String} str\n\
   */\n\
\n\
  View.prototype.interpolate = function(str) {\n\
    var self = this;\n\
    var data = {};\n\
    var props = this.props(str);\n\
    props.forEach(function(prop){\n\
      data[prop] = self.get(prop);\n\
    });\n\
    return View.bindings.interpolator.value(str, {\n\
      context: this.scope || this,\n\
      scope: data\n\
    });\n\
  };\n\
\n\
  /**\n\
   * Watch a property for changes\n\
   *\n\
   * @param {Strign} prop\n\
   * @param {Function} callback\n\
   */\n\
\n\
  View.prototype.watch = function(prop, callback) {\n\
    var self = this;\n\
    if (Array.isArray(prop)) {\n\
      return prop.forEach(function(name){\n\
        self.watch(name, callback);\n\
      });\n\
    }\n\
    var value = this.model.get(prop);\n\
    if (value === undefined && this.scope) {\n\
      this.scope.watch(prop, callback);\n\
      if (!this.scopeWatchers[prop]) {\n\
        this.scopeWatchers[prop] = [];\n\
      }\n\
      this.scopeWatchers[prop].push(callback);\n\
      return;\n\
    }\n\
    return this.model.watch(prop, callback);\n\
  };\n\
\n\
  /**\n\
   * Stop watching a property\n\
   *\n\
   * @param {Strign} prop\n\
   * @param {Function} callback\n\
   */\n\
\n\
  View.prototype.unwatch = function(prop, callback) {\n\
    var self = this;\n\
    if (Array.isArray(prop)) {\n\
      return prop.forEach(function(name){\n\
        self.unwatch(name, callback);\n\
      });\n\
    }\n\
    var value = this.model.get(prop);\n\
    if (value === undefined && this.scope) {\n\
      this.scope.unwatch(prop, callback);\n\
      if (!this.scopeWatchers[prop]) return;\n\
      var index = this.scopeWatchers[prop].indexOf(callback);\n\
      this.scopeWatchers[prop].splice(index, 1);\n\
      return;\n\
    }\n\
    return this.model.unwatch(prop, callback);\n\
  };\n\
\n\
  return View;\n\
}\n\
\n\
\n\
/**\n\
 * Exports\n\
 */\n\
\n\
module.exports = createView;//@ sourceURL=ripplejs-ripple/lib/view.js"
));
require.register("ripplejs-ripple/lib/bindings.js", Function("exports, require, module",
"var Interpolator = require('interpolate');\n\
\n\
/**\n\
 * The compiler will take a set of views, an element and\n\
 * a scope and process each node going down the tree. Whenever\n\
 * it finds a node matching a directive it will process it.\n\
 */\n\
function Bindings() {\n\
  this.components = {};\n\
  this.directives = {};\n\
  this.interpolator = new Interpolator();\n\
}\n\
\n\
/**\n\
 * Add a component binding. This will be rendered as a separate\n\
 * view and have it's own scope.\n\
 *\n\
 * @param {String|Regex} matches String or regex to match an element name\n\
 * @param {Function} View\n\
 * @param {Object} options\n\
 */\n\
Bindings.prototype.component = function(name, fn) {\n\
  if(!fn) {\n\
    return this.components[name.nodeName.toLowerCase()];\n\
  }\n\
  this.components[name.toLowerCase()] = fn;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Add an attribute binding. Whenever this attribute is matched\n\
 * in the DOM the function will be code with the current view\n\
 * and the element.\n\
 *\n\
 * @param {String|Regex} matches String or regex to match an attribute name\n\
 * @param {Function} process\n\
 * @param {Object} options\n\
 */\n\
Bindings.prototype.directive = function(attr, fn) {\n\
  if(!fn) {\n\
    return this.directives[attr];\n\
  }\n\
  this.directives[attr] = fn;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Add an interpolation filter\n\
 *\n\
 * @param {String} name\n\
 * @param {Function} fn\n\
 *\n\
 * @return {Bindings}\n\
 */\n\
Bindings.prototype.filter = function(name, fn) {\n\
  if(!fn) {\n\
    return this.interpolator.filters[name];\n\
  }\n\
  this.interpolator.filter(name, fn);\n\
  return this;\n\
};\n\
\n\
module.exports = Bindings;//@ sourceURL=ripplejs-ripple/lib/bindings.js"
));
require.register("ripplejs-ripple/lib/model.js", Function("exports, require, module",
"var observer = require('path-observer');\n\
var emitter = require('emitter');\n\
\n\
module.exports = function(){\n\
\n\
  /**\n\
   * Model.\n\
   *\n\
   * Watch an objects properties for changes.\n\
   *\n\
   * Properties must be set using the `set` method for\n\
   * changes to fire events.\n\
   *\n\
   * @param {Object}\n\
   */\n\
  function Model(props){\n\
    if(!(this instanceof Model)) return new Model(props);\n\
    this.props = props || {};\n\
    this.observer = observer(this.props);\n\
    Model.emit('construct', this);\n\
  }\n\
\n\
  /**\n\
   * Mixins\n\
   */\n\
  emitter(Model);\n\
\n\
  /**\n\
   * Use a plugin\n\
   *\n\
   * @return {Model}\n\
   */\n\
  Model.use = function(fn, options){\n\
    fn(this, options);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Add a function to fire whenever a keypath changes.\n\
   *\n\
   * @param {String} key\n\
   * @param {Function} fn Function to call on event\n\
   *\n\
   * @return {Model}\n\
   */\n\
  Model.prototype.watch = function(key, callback) {\n\
    if(arguments.length === 1) {\n\
      callback = key;\n\
      this.observer.on('change', callback);\n\
    }\n\
    else {\n\
      this.observer(key).on('change', callback);\n\
    }\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Stop watching a property for changes\n\
   *\n\
   * @param {String} key\n\
   * @param {Function} fn\n\
   *\n\
   * @return {Model}\n\
   */\n\
  Model.prototype.unwatch = function(key, callback) {\n\
    if(arguments.length === 1) {\n\
      callback = key;\n\
      this.observer.off('change', callback);\n\
    }\n\
    else {\n\
      this.observer(key).off('change', callback);\n\
    }\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Set a property using a keypath\n\
   *\n\
   * @param {String} key eg. 'foo.bar'\n\
   * @param {Mixed} val\n\
   */\n\
  Model.prototype.set = function(key, val) {\n\
    this.observer(key).set(val);\n\
    return this;\n\
  };\n\
\n\
  /**\n\
   * Get an attribute using a keypath. If an array\n\
   * of keys is passed in an object is returned with\n\
   * those keys\n\
   *\n\
   * @param {String|Array} key\n\
   *\n\
   * @api public\n\
   * @return {Mixed}\n\
   */\n\
  Model.prototype.get = function(keypath) {\n\
    return this.observer(keypath).get();\n\
  };\n\
\n\
  /**\n\
   * Destroy all observers\n\
   *\n\
   * @return {Model}\n\
   */\n\
  Model.prototype.destroy = function(){\n\
    this.observer.dispose();\n\
    return this;\n\
  };\n\
\n\
  return Model;\n\
};//@ sourceURL=ripplejs-ripple/lib/model.js"
));
require.register("ripplejs-ripple/lib/render.js", Function("exports, require, module",
"var walk = require('dom-walk');\n\
var each = require('each');\n\
var attrs = require('attributes');\n\
var domify = require('domify');\n\
var TextBinding = require('./text-binding');\n\
var AttrBinding = require('./attr-binding');\n\
var ChildBinding = require('./child-binding');\n\
var Directive = require('./directive');\n\
\n\
module.exports = function(options) {\n\
  var view = options.view;\n\
  var bindings = options.bindings;\n\
  var el = domify(options.template);\n\
  var fragment = document.createDocumentFragment();\n\
  fragment.appendChild(el);\n\
\n\
  var activeBindings = [];\n\
\n\
  // Walk down the newly created view element\n\
  // and bind everything to the model\n\
  walk(el, function(node, next){\n\
    if(node.nodeType === 3) {\n\
      activeBindings.push(new TextBinding(view, node));\n\
    }\n\
    else if(node.nodeType === 1) {\n\
      var View = bindings.component(node);\n\
      if(View) {\n\
        activeBindings.push(new ChildBinding(view, node, View));\n\
        return next();\n\
      }\n\
      each(attrs(node), function(attr){\n\
        var binding = bindings.directive(attr);\n\
        if(binding) {\n\
          activeBindings.push(new Directive(view, node, attr, binding));\n\
        }\n\
        else {\n\
          activeBindings.push(new AttrBinding(view, node, attr));\n\
        }\n\
      });\n\
    }\n\
    next();\n\
  });\n\
\n\
  view.once('destroying', function(){\n\
    while(activeBindings.length) {\n\
      activeBindings.shift().unbind();\n\
    }\n\
  });\n\
\n\
  view.activeBindings = activeBindings;\n\
\n\
  return fragment.firstChild;\n\
};\n\
//@ sourceURL=ripplejs-ripple/lib/render.js"
));
require.register("ripplejs-ripple/lib/directive.js", Function("exports, require, module",
"var raf = require('raf-queue');\n\
\n\
/**\n\
 * Creates a new directive using a binding object.\n\
 *\n\
 * @param {View} view\n\
 * @param {Element} node\n\
 * @param {String} attr\n\
 * @param {Object} binding\n\
 */\n\
function Directive(view, node, attr, binding) {\n\
  this.queue = this.queue.bind(this);\n\
  this.view = view;\n\
  if(typeof binding === 'function') {\n\
    this.binding = { update: binding };\n\
  }\n\
  else {\n\
    this.binding = binding;\n\
  }\n\
  this.text = node.getAttribute(attr);\n\
  this.node = node;\n\
  this.attr = attr;\n\
  this.props = view.props(this.text);\n\
  this.bind();\n\
}\n\
\n\
/**\n\
 * Start watching the view for changes\n\
 */\n\
Directive.prototype.bind = function(){\n\
  var view = this.view;\n\
  var queue = this.queue;\n\
\n\
  if(this.binding.bind) {\n\
    this.binding.bind.call(this, this.node, this.view);\n\
  }\n\
\n\
  this.props.forEach(function(prop){\n\
    view.watch(prop, queue);\n\
  });\n\
\n\
  this.update();\n\
};\n\
\n\
/**\n\
 * Stop watching the view for changes\n\
 */\n\
Directive.prototype.unbind = function(){\n\
  var view = this.view;\n\
  var queue = this.queue;\n\
\n\
  this.props.forEach(function(prop){\n\
    view.unwatch(prop, queue);\n\
  });\n\
\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
\n\
  if(this.binding.unbind) {\n\
    this.binding.unbind.call(this, this.node, this.view);\n\
  }\n\
};\n\
\n\
/**\n\
 * Update the attribute.\n\
 */\n\
Directive.prototype.update = function(){\n\
  var value = this.view.interpolate(this.text);\n\
  this.binding.update.call(this, value, this.node, this.view);\n\
};\n\
\n\
/**\n\
 * Queue an update\n\
 */\n\
Directive.prototype.queue = function(){\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
  this.job = raf(this.update, this);\n\
};\n\
\n\
module.exports = Directive;//@ sourceURL=ripplejs-ripple/lib/directive.js"
));
require.register("ripplejs-ripple/lib/text-binding.js", Function("exports, require, module",
"var raf = require('raf-queue');\n\
\n\
function TextBinding(view, node) {\n\
  this.update = this.update.bind(this);\n\
  this.view = view;\n\
  this.text = node.data;\n\
  this.node = node;\n\
  this.props = view.props(this.text);\n\
  this.render = this.render.bind(this);\n\
  if(this.props.length) {\n\
    this.bind();\n\
  }\n\
}\n\
\n\
TextBinding.prototype.bind = function(){\n\
  var view = this.view;\n\
  var update = this.update;\n\
\n\
  this.props.forEach(function(prop){\n\
    view.watch(prop, update);\n\
  });\n\
\n\
  this.render();\n\
};\n\
\n\
TextBinding.prototype.unbind = function(){\n\
  var view = this.view;\n\
  var update = this.update;\n\
\n\
  this.props.forEach(function(prop){\n\
    view.unwatch(prop, update);\n\
  });\n\
\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
};\n\
\n\
TextBinding.prototype.render = function(){\n\
  var node = this.node;\n\
  var val = this.view.interpolate(this.text);\n\
\n\
  if(val == null) {\n\
    this.node.data = '';\n\
  }\n\
  else if(val instanceof Element) {\n\
    node.parentNode.replaceChild(val, node);\n\
    this.node = val;\n\
  }\n\
  else {\n\
    var newNode = document.createTextNode(val);\n\
    node.parentNode.replaceChild(newNode, node);\n\
    this.node = newNode;\n\
  }\n\
};\n\
\n\
TextBinding.prototype.update = function(){\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
  this.job = raf(this.render, this);\n\
};\n\
\n\
module.exports = TextBinding;\n\
//@ sourceURL=ripplejs-ripple/lib/text-binding.js"
));
require.register("ripplejs-ripple/lib/attr-binding.js", Function("exports, require, module",
"var isBoolean = require('is-boolean-attribute');\n\
var raf = require('raf-queue');\n\
\n\
/**\n\
 * Creates a new attribute text binding for a view.\n\
 * If the view attribute contains interpolation, the\n\
 * attribute will be automatically updated whenever the\n\
 * result of the expression changes.\n\
 *\n\
 * Updating will be called once per tick. So if there\n\
 * are multiple changes to the view in a single tick,\n\
 * this will only touch the DOM once.\n\
 *\n\
 * @param {View} view\n\
 * @param {Element} node\n\
 * @param {String} attr\n\
 */\n\
function AttrBinding(view, node, attr) {\n\
  this.update = this.update.bind(this);\n\
  this.view = view;\n\
  this.text = node.getAttribute(attr);\n\
  this.node = node;\n\
  this.attr = attr;\n\
  this.props = view.props(this.text);\n\
  this.bind();\n\
}\n\
\n\
/**\n\
 * Start watching the view for changes\n\
 */\n\
AttrBinding.prototype.bind = function(){\n\
  if(!this.props.length) return;\n\
  var view = this.view;\n\
  var update = this.update;\n\
\n\
  this.props.forEach(function(prop){\n\
    view.watch(prop, update);\n\
  });\n\
\n\
  this.render();\n\
};\n\
\n\
/**\n\
 * Stop watching the view for changes\n\
 */\n\
AttrBinding.prototype.unbind = function(){\n\
  if(!this.props.length) return;\n\
  var view = this.view;\n\
  var update = this.update;\n\
\n\
  this.props.forEach(function(prop){\n\
    view.unwatch(prop, update);\n\
  });\n\
\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
};\n\
\n\
/**\n\
 * Update the attribute\n\
 *\n\
 * @return {[type]}\n\
 */\n\
AttrBinding.prototype.render = function(){\n\
  var val = this.view.interpolate(this.text);\n\
  if(val == null) val = '';\n\
  if(isBoolean(this.attr) && !val) {\n\
    this.node.removeAttribute(this.attr);\n\
  }\n\
  else {\n\
    this.node.setAttribute(this.attr, val);\n\
  }\n\
};\n\
\n\
/**\n\
 * Update the attribute.\n\
 */\n\
AttrBinding.prototype.update = function(){\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
  this.job = raf(this.render, this);\n\
};\n\
\n\
module.exports = AttrBinding;//@ sourceURL=ripplejs-ripple/lib/attr-binding.js"
));
require.register("ripplejs-ripple/lib/child-binding.js", Function("exports, require, module",
"var attrs = require('attributes');\n\
var each = require('each');\n\
var unique = require('uniq');\n\
var raf = require('raf-queue');\n\
\n\
/**\n\
 * Creates a new sub-view at a node and binds\n\
 * it to the parent\n\
 *\n\
 * @param {View} view\n\
 * @param {Element} node\n\
 * @param {Function} View\n\
 */\n\
function ChildBinding(view, node, View) {\n\
  this.update = this.update.bind(this);\n\
  this.view = view;\n\
  this.attrs = attrs(node);\n\
  this.props = this.getProps();\n\
  var data = this.values();\n\
  data.yield = node.innerHTML;\n\
  this.child = new View({\n\
    owner: view,\n\
    data: data\n\
  });\n\
  this.child.replace(node);\n\
  this.child.on('destroyed', this.unbind.bind(this));\n\
  this.node = this.child.el;\n\
  this.bind();\n\
}\n\
\n\
/**\n\
 * Get all of the properties used in all of the attributes\n\
 *\n\
 * @return {Array}\n\
 */\n\
ChildBinding.prototype.getProps = function(){\n\
  var ret = [];\n\
  var view = this.view;\n\
  each(this.attrs, function(name, value){\n\
    ret = ret.concat(view.props(value));\n\
  });\n\
  return unique(ret);\n\
};\n\
\n\
/**\n\
 * Bind to changes on the view. Whenever a property\n\
 * changes we'll update the child with the new values.\n\
 */\n\
ChildBinding.prototype.bind = function(){\n\
  var self = this;\n\
  var view = this.view;\n\
\n\
  this.props.forEach(function(prop){\n\
    view.watch(prop, self.update);\n\
  });\n\
\n\
  this.send();\n\
};\n\
\n\
/**\n\
 * Get all the data from the node\n\
 *\n\
 * @return {Object}\n\
 */\n\
ChildBinding.prototype.values = function(){\n\
  var view = this.view;\n\
  var ret = {};\n\
  each(this.attrs, function(name, value){\n\
    ret[name] = view.interpolate(value);\n\
  });\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Send the data to the child\n\
 */\n\
ChildBinding.prototype.send = function(){\n\
  this.child.set(this.values());\n\
};\n\
\n\
/**\n\
 * Unbind this view from the parent\n\
 */\n\
ChildBinding.prototype.unbind = function(){\n\
  var view = this.view;\n\
  var update = this.update;\n\
\n\
  this.props.forEach(function(prop){\n\
    view.unwatch(prop, update);\n\
  });\n\
\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
};\n\
\n\
/**\n\
 * Update the child view will updated values from\n\
 * the parent. This will batch changes together\n\
 * and only fire once per tick.\n\
 */\n\
ChildBinding.prototype.update = function(){\n\
  if(this.job) {\n\
    raf.cancel(this.job);\n\
  }\n\
  this.job = raf(this.send, this);\n\
};\n\
\n\
module.exports = ChildBinding;\n\
//@ sourceURL=ripplejs-ripple/lib/child-binding.js"
));
require.register("segmentio-hermes/hermes.js", Function("exports, require, module",
"!function(e){if(\"object\"==typeof exports)module.exports=e();else if(\"function\"==typeof define&&define.amd)define(e);else{var f;\"undefined\"!=typeof window?f=window:\"undefined\"!=typeof global?f=global:\"undefined\"!=typeof self&&(f=self),f.Hermes=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require==\"function\"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error(\"Cannot find module '\"+o+\"'\")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require==\"function\"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){\n\
\n\
/**\n\
 * Expose `plugin`.\n\
 */\n\
\n\
module.exports = plugin;\n\
\n\
/**\n\
 * Add echoing commands to the robot.\n\
 *\n\
 * @return {Function}\n\
 */\n\
\n\
function plugin(){\n\
  return function(robot){\n\
    robot.on('mention', /^(say|emote|error|warn|success) (.*)$/, function(match, ctx){\n\
      var method = match[1];\n\
      var msg = match[2];\n\
      robot[method](msg, ctx);\n\
    });\n\
\n\
    robot.on('mention', /^reply (.*)$/, function(match, ctx){\n\
      var msg = match[1];\n\
      robot.reply(ctx.user, msg, ctx);\n\
    });\n\
\n\
    robot.on('mention', /^topic (.*)$/, function(match, ctx){\n\
      if (!ctx.room) return;\n\
      var topic = match[1];\n\
      robot.topic(ctx.room, topic);\n\
    });\n\
  };\n\
}\n\
},{}],2:[function(_dereq_,module,exports){\n\
\n\
var fmt = _dereq_('util').format;\n\
\n\
/**\n\
 * Expose `plugin`.\n\
 */\n\
\n\
module.exports = plugin;\n\
\n\
/**\n\
 * Add a `help` method and command for documenting commands.\n\
 *\n\
 * @return {Function}\n\
 */\n\
\n\
function plugin(){\n\
  return function(robot){\n\
    var commands = [];\n\
\n\
    /**\n\
     * Add a new help entry with `triggers` and a `description`.\n\
     *\n\
     * @param {String or Array} triggers\n\
     * @param {String} description\n\
     * @return {Robot}\n\
     */\n\
\n\
    robot.help = function(triggers, description){\n\
      if ('string' == typeof triggers) triggers = [triggers];\n\
      commands.push({ triggers: triggers, description: description });\n\
      return this;\n\
    };\n\
\n\
    /**\n\
     * Listen for `help`, with an optional filter.\n\
     *\n\
     * @param {Response} res\n\
     */\n\
\n\
    robot.on('mention', /^h+(?:e|a)+l+p+!?\\??(?: (.*))?$/i, function(res){\n\
      var cmds = filter(commands, res[1]);\n\
      var msg = cmds.map(format).join('\\n\
\\n\
');\n\
      if (!msg) msg = 'No commands have been registered.';\n\
      res.say(msg);\n\
    });\n\
\n\
    /**\n\
     * Filter a set of `commands` by a `string`.\n\
     *\n\
     * @param {Array} commands\n\
     * @param {String} string\n\
     */\n\
\n\
    function filter(commands, string){\n\
      if (!string) return commands;\n\
      return commands.filter(function(cmd){\n\
        if (~cmd.description.indexOf(string)) return true;\n\
        for (var i = 0, trigger; trigger = cmd.triggers[i]; i++) {\n\
          if (~trigger.indexOf(string)) return true;\n\
        }\n\
        return false;\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Format a command `obj`.\n\
     *\n\
     * @param {Object} obj\n\
     * @return {String}\n\
     */\n\
\n\
    function format(obj){\n\
      var mention = robot.mention();\n\
      var desc = obj.description;\n\
      var triggers = obj.triggers.map(function(string){\n\
        return mention + string;\n\
      });\n\
\n\
      return fmt('%s\\n\
%s', triggers.join('\\n\
'), desc);\n\
    }\n\
  };\n\
}\n\
},{\"util\":12}],3:[function(_dereq_,module,exports){\n\
\n\
var assert = _dereq_('assert');\n\
var echo = _dereq_('./echo');\n\
var format = _dereq_('util').format;\n\
var help = _dereq_('./help');\n\
var memory = _dereq_('./memory');\n\
var noop = function(){};\n\
var type = _dereq_('component-type');\n\
var Emitter = _dereq_('events').EventEmitter;\n\
var inherit = _dereq_('util').inherits;\n\
\n\
/**\n\
 * Expose `Robot`.\n\
 */\n\
\n\
module.exports = Robot;\n\
\n\
/**\n\
 * Initialize a new `Robot` instance with a `name`.\n\
 *\n\
 * @param {Object} name\n\
 */\n\
\n\
function Robot(name){\n\
  if (!(this instanceof Robot)) return new Robot(name);\n\
  this.setMaxListeners(Infinity);\n\
  this.on('error', noop);\n\
  this.name(name || 'Hermes');\n\
  this.template('@%s ');\n\
  this.use(memory());\n\
  this.use(help());\n\
  this.use(echo());\n\
}\n\
\n\
/**\n\
 * Inherit from `Emitter`.\n\
 */\n\
\n\
inherit(Robot, Emitter);\n\
\n\
var on = Robot.prototype.on;\n\
var once = Robot.prototype.once;\n\
var off = Robot.prototype.off = Robot.prototype.removeListener;\n\
\n\
/**\n\
 * Use a `plugin` function.\n\
 *\n\
 * @param {Function} plugin\n\
 * @return {Robot}\n\
 */\n\
\n\
Robot.prototype.use = function(plugin){\n\
  plugin(this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Get or set the robot's `name`.\n\
 *\n\
 * @param {Object} name\n\
 * @return {Robot}\n\
 */\n\
\n\
Robot.prototype.name = function(name){\n\
  if (!arguments.length) return this._name;\n\
  assert('string' == type(name), 'The robot\\'s name must be a string.');\n\
  this._name = name;\n\
  this.nickname(nickify(name));\n\
  this.emit('name', name);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Get or set the robot's `nickname`.\n\
 *\n\
 * @param {Object} nickname\n\
 * @return {Robot}\n\
 */\n\
\n\
Robot.prototype.nickname = function(nickname){\n\
  if (!arguments.length) return this._nickname;\n\
  assert('string' == type(nickname), 'The robot\\'s nickname must be a string.');\n\
  this._nickname = nickname;\n\
  this.emit('nickname', nickname);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Get or set the way the robot is mentioned with a substitution `template`.\n\
 *\n\
 * @param {String} template\n\
 * @return {Robot}\n\
 */\n\
\n\
Robot.prototype.template = function(template){\n\
  if (!arguments.length) return this._template;\n\
  assert('string' == type(template), 'The mention template must be a string.');\n\
  this._template = template;\n\
  this.emit('template', template);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Format a `nickname` into a mention.\n\
 *\n\
 * @param {String} nickname\n\
 * @return {String}\n\
 */\n\
\n\
Robot.prototype.mention = function(nickname){\n\
  if (!nickname) nickname = this.nickname();\n\
  var template = this.template();\n\
  return format(template, nickname);\n\
};\n\
\n\
/**\n\
 * Hear a `string` with optional `context` and process it.\n\
 *\n\
 * @param {String} message\n\
 * @param {Object} context (optional)\n\
 *   @property {String} user\n\
 *   @property {String} room\n\
 * @return {Robot}\n\
 */\n\
\n\
Robot.prototype.hear = function(message, context){\n\
  context = context || {};\n\
  assert('string' == type(message), 'You must pass a message string.');\n\
  assert('object' == type(context), 'The message\\'s context must be an object.');\n\
\n\
  var mention = this.mention();\n\
  var regex = new RegExp('^' + mention + '(.*)', 'i');\n\
  var match = message.match(regex);\n\
\n\
  this.emit('hear', message, context);\n\
  if (match) this.emit('mention', match[1], context);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Wrap `#on` to optionally filter messages by a `regex` and/or `context`.\n\
 *\n\
 * @param {String} event\n\
 * @param {RegExp or String} regex (optional)\n\
 * @param {Object} context (optional)\n\
 *   @property {String} user\n\
 *   @property {String} room\n\
 * @param {Function} fn\n\
 * @return {Robot}\n\
 */\n\
\n\
Robot.prototype.on = function(event, regex, context, fn){\n\
  if ('hear' != event && 'mention' != event) return on.call(this, event, regex);\n\
  if ('function' == type(regex)) fn = regex, context = null, regex = null;\n\
  if ('function' == type(context)) fn = context, context = null;\n\
  if ('object' == type(regex)) context = regex, regex = null;\n\
  if ('string' == type(regex)) regex = new RegExp(regex);\n\
\n\
  regex = regex || /.*/;\n\
  context = context || {};\n\
  var robot = this;\n\
\n\
  on.call(this, event, function(message, ctx){\n\
    if (!has(ctx, context)) return;\n\
    var res = message.match(regex);\n\
    if (!res) return;\n\
    res.message = message;\n\
    res.context = ctx;\n\
    if (ctx.user) res.user = robot.user(ctx.user);\n\
    if (ctx.room) res.room = robot.room(ctx.room);\n\
    bind(res, robot);\n\
    fn(res, robot);\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Wrap `#once` to optionally filter messages by a `regex` and/or `context`.\n\
 *\n\
 * @param {String} event\n\
 * @param {RegExp or String} regex (optional)\n\
 * @param {Object} context (optional)\n\
 *   @property {String} user\n\
 *   @property {String} room\n\
 * @param {Function} fn\n\
 * @return {Robot}\n\
 */\n\
\n\
Robot.prototype.once = function(event, regex, context, fn){\n\
  if ('hear' != event && 'mention' != event) return on.call(this, event, regex);\n\
  var robot = this;\n\
\n\
  return this.on(event, regex, context, function callback(){\n\
    robot.off(event, callback);\n\
    fn.apply(this, arguments);\n\
  });\n\
};\n\
\n\
/**\n\
 * Convert a `name` into a nickname string.\n\
 *\n\
 * @param {String} name\n\
 * @return {String}\n\
 */\n\
\n\
function nickify(name){\n\
  return name.split(' ')[0].toLowerCase();\n\
}\n\
\n\
/**\n\
 * Check whether an `object` has all the values of `another` object.\n\
 *\n\
 * @param {Object} object\n\
 * @param {Object} another\n\
 * @return {Boolean}\n\
 */\n\
\n\
function has(object, another) {\n\
  for (var key in another) {\n\
    if (another[key] !== object[key]) return false;\n\
  }\n\
  return true;\n\
}\n\
\n\
/**\n\
 * Bind a `res` object with all of the speaking methods of a `robot`.\n\
 *\n\
 * @param {Object} res\n\
 * @param {Robot} robot\n\
 */\n\
\n\
function bind(res, robot){\n\
  var user = res.user;\n\
  var room = res.room;\n\
  var ctx = res.context;\n\
  res.say = function(msg){ robot.say(msg, ctx); };\n\
  res.emote = function(msg){ robot.emote(msg, ctx); };\n\
  res.reply = function(msg){ robot.reply(user, msg, ctx); };\n\
  res.error = function(msg){ robot.error(msg, ctx); };\n\
  res.warn = function(msg){ robot.warn(msg, ctx); };\n\
  res.info = function(msg){ robot.info(msg, ctx); };\n\
  res.success = function(msg){ robot.success(msg, ctx); };\n\
  res.topic = function(topic){ robot.topic(room, topic); };\n\
  res.on = function(event, regexp, fn){ robot.on(event, regexp, ctx, fn); };\n\
  res.once = function(event, regexp, fn){ robot.once(event, regexp, ctx, fn); };\n\
  res.off = function(event, fn){ robot.off(event, regexp, ctx, fn); };\n\
  res.hear = function(msg){ robot.hear(msg, ctx); };\n\
}\n\
},{\"./echo\":1,\"./help\":2,\"./memory\":4,\"assert\":5,\"component-type\":13,\"events\":8,\"util\":12}],4:[function(_dereq_,module,exports){\n\
\n\
var assert = _dereq_('assert');\n\
var filter = _dereq_('lodash').filter;\n\
var find = _dereq_('lodash').find;\n\
var values = _dereq_('lodash').values;\n\
\n\
/**\n\
 * Expose `plugin`.\n\
 */\n\
\n\
module.exports = exports = plugin;\n\
\n\
/**\n\
 * Add basic in-memory storage to the `robot`.\n\
 *\n\
 * @return {Function}\n\
 */\n\
\n\
function plugin(){\n\
  return function(robot){\n\
    var data = {};\n\
    var rooms = {};\n\
    var users = {};\n\
\n\
    /**\n\
     * Get or set a custom data by `key`.\n\
     *\n\
     * @param {String} key\n\
     * @param {Object} value (optional)\n\
     * @return {Mixed}\n\
     */\n\
\n\
    robot.data = function(key, value){\n\
      if (1 == arguments.length) return data[key];\n\
      data[key] = value;\n\
      this.emit('data', key, value);\n\
      return this;\n\
    };\n\
\n\
    /**\n\
     * Get or set a room by `id`, or get all rooms.\n\
     *\n\
     * @param {String or Object} id (optional)\n\
     * @param {Object} attrs (optional)\n\
     * @return {Mixed}\n\
     */\n\
\n\
    robot.room = function(id, attrs){\n\
      if (1 == arguments.length) {\n\
        return 'string' == typeof id\n\
          ? rooms[id]\n\
          : find(rooms, id);\n\
      }\n\
\n\
      attrs = attrs || {};\n\
      attrs.id = id;\n\
      rooms[id] = attrs\n\
      this.emit('room', id, attrs);\n\
      return this;\n\
    };\n\
\n\
    /**\n\
     * Get rooms by `attrs`.\n\
     *\n\
     * @param {Object} attrs (optional)\n\
     * @return {Array}\n\
     */\n\
\n\
    robot.rooms = function(attrs){\n\
      if (0 == arguments.length) return values(rooms);\n\
      return filter(rooms, attrs);\n\
    };\n\
\n\
    /**\n\
     * Get or set a user by `id`, or get all users.\n\
     *\n\
     * @param {String or Object} id (optional)\n\
     * @param {Object} attrs (optional)\n\
     * @return {Mixed}\n\
     */\n\
\n\
    robot.user = function(id, attrs){\n\
      if (1 == arguments.length) {\n\
        return 'string' == typeof id\n\
          ? users[id]\n\
          : find(users, id);\n\
      }\n\
\n\
      attrs = attrs || {};\n\
      attrs.id = id;\n\
      assert(attrs.name, 'A user must have a name.');\n\
      if (!attrs.nickname) attrs.nickname = attrs.name;\n\
      users[id] = attrs;\n\
      this.emit('user', id, attrs);\n\
      return this;\n\
    };\n\
\n\
    /**\n\
     * Get users by `attrs`.\n\
     *\n\
     * @param {Object} attrs (optional)\n\
     * @return {Array}\n\
     */\n\
\n\
    robot.users = function(attrs){\n\
      if (0 == arguments.length) return values(users);\n\
      return filter(users, attrs);\n\
    };\n\
  };\n\
}\n\
\n\
},{\"assert\":5,\"lodash\":14}],5:[function(_dereq_,module,exports){\n\
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0\n\
//\n\
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!\n\
//\n\
// Originally from narwhal.js (http://narwhaljs.org)\n\
// Copyright (c) 2009 Thomas Robinson <280north.com>\n\
//\n\
// Permission is hereby granted, free of charge, to any person obtaining a copy\n\
// of this software and associated documentation files (the 'Software'), to\n\
// deal in the Software without restriction, including without limitation the\n\
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or\n\
// sell copies of the Software, and to permit persons to whom the Software is\n\
// furnished to do so, subject to the following conditions:\n\
//\n\
// The above copyright notice and this permission notice shall be included in\n\
// all copies or substantial portions of the Software.\n\
//\n\
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n\
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n\
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n\
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN\n\
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n\
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
\n\
// when used in node, this will actually load the util module we depend on\n\
// versus loading the builtin util module as happens otherwise\n\
// this is a bug in node module loading as far as I am concerned\n\
var util = _dereq_('util/');\n\
\n\
var pSlice = Array.prototype.slice;\n\
var hasOwn = Object.prototype.hasOwnProperty;\n\
\n\
// 1. The assert module provides functions that throw\n\
// AssertionError's when particular conditions are not met. The\n\
// assert module must conform to the following interface.\n\
\n\
var assert = module.exports = ok;\n\
\n\
// 2. The AssertionError is defined in assert.\n\
// new assert.AssertionError({ message: message,\n\
//                             actual: actual,\n\
//                             expected: expected })\n\
\n\
assert.AssertionError = function AssertionError(options) {\n\
  this.name = 'AssertionError';\n\
  this.actual = options.actual;\n\
  this.expected = options.expected;\n\
  this.operator = options.operator;\n\
  if (options.message) {\n\
    this.message = options.message;\n\
    this.generatedMessage = false;\n\
  } else {\n\
    this.message = getMessage(this);\n\
    this.generatedMessage = true;\n\
  }\n\
  var stackStartFunction = options.stackStartFunction || fail;\n\
\n\
  if (Error.captureStackTrace) {\n\
    Error.captureStackTrace(this, stackStartFunction);\n\
  }\n\
  else {\n\
    // non v8 browsers so we can have a stacktrace\n\
    var err = new Error();\n\
    if (err.stack) {\n\
      var out = err.stack;\n\
\n\
      // try to strip useless frames\n\
      var fn_name = stackStartFunction.name;\n\
      var idx = out.indexOf('\\n\
' + fn_name);\n\
      if (idx >= 0) {\n\
        // once we have located the function frame\n\
        // we need to strip out everything before it (and its line)\n\
        var next_line = out.indexOf('\\n\
', idx + 1);\n\
        out = out.substring(next_line + 1);\n\
      }\n\
\n\
      this.stack = out;\n\
    }\n\
  }\n\
};\n\
\n\
// assert.AssertionError instanceof Error\n\
util.inherits(assert.AssertionError, Error);\n\
\n\
function replacer(key, value) {\n\
  if (util.isUndefined(value)) {\n\
    return '' + value;\n\
  }\n\
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {\n\
    return value.toString();\n\
  }\n\
  if (util.isFunction(value) || util.isRegExp(value)) {\n\
    return value.toString();\n\
  }\n\
  return value;\n\
}\n\
\n\
function truncate(s, n) {\n\
  if (util.isString(s)) {\n\
    return s.length < n ? s : s.slice(0, n);\n\
  } else {\n\
    return s;\n\
  }\n\
}\n\
\n\
function getMessage(self) {\n\
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +\n\
         self.operator + ' ' +\n\
         truncate(JSON.stringify(self.expected, replacer), 128);\n\
}\n\
\n\
// At present only the three keys mentioned above are used and\n\
// understood by the spec. Implementations or sub modules can pass\n\
// other keys to the AssertionError's constructor - they will be\n\
// ignored.\n\
\n\
// 3. All of the following functions must throw an AssertionError\n\
// when a corresponding condition is not met, with a message that\n\
// may be undefined if not provided.  All assertion methods provide\n\
// both the actual and expected values to the assertion error for\n\
// display purposes.\n\
\n\
function fail(actual, expected, message, operator, stackStartFunction) {\n\
  throw new assert.AssertionError({\n\
    message: message,\n\
    actual: actual,\n\
    expected: expected,\n\
    operator: operator,\n\
    stackStartFunction: stackStartFunction\n\
  });\n\
}\n\
\n\
// EXTENSION! allows for well behaved errors defined elsewhere.\n\
assert.fail = fail;\n\
\n\
// 4. Pure assertion tests whether a value is truthy, as determined\n\
// by !!guard.\n\
// assert.ok(guard, message_opt);\n\
// This statement is equivalent to assert.equal(true, !!guard,\n\
// message_opt);. To test strictly for the value true, use\n\
// assert.strictEqual(true, guard, message_opt);.\n\
\n\
function ok(value, message) {\n\
  if (!value) fail(value, true, message, '==', assert.ok);\n\
}\n\
assert.ok = ok;\n\
\n\
// 5. The equality assertion tests shallow, coercive equality with\n\
// ==.\n\
// assert.equal(actual, expected, message_opt);\n\
\n\
assert.equal = function equal(actual, expected, message) {\n\
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);\n\
};\n\
\n\
// 6. The non-equality assertion tests for whether two objects are not equal\n\
// with != assert.notEqual(actual, expected, message_opt);\n\
\n\
assert.notEqual = function notEqual(actual, expected, message) {\n\
  if (actual == expected) {\n\
    fail(actual, expected, message, '!=', assert.notEqual);\n\
  }\n\
};\n\
\n\
// 7. The equivalence assertion tests a deep equality relation.\n\
// assert.deepEqual(actual, expected, message_opt);\n\
\n\
assert.deepEqual = function deepEqual(actual, expected, message) {\n\
  if (!_deepEqual(actual, expected)) {\n\
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);\n\
  }\n\
};\n\
\n\
function _deepEqual(actual, expected) {\n\
  // 7.1. All identical values are equivalent, as determined by ===.\n\
  if (actual === expected) {\n\
    return true;\n\
\n\
  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {\n\
    if (actual.length != expected.length) return false;\n\
\n\
    for (var i = 0; i < actual.length; i++) {\n\
      if (actual[i] !== expected[i]) return false;\n\
    }\n\
\n\
    return true;\n\
\n\
  // 7.2. If the expected value is a Date object, the actual value is\n\
  // equivalent if it is also a Date object that refers to the same time.\n\
  } else if (util.isDate(actual) && util.isDate(expected)) {\n\
    return actual.getTime() === expected.getTime();\n\
\n\
  // 7.3 If the expected value is a RegExp object, the actual value is\n\
  // equivalent if it is also a RegExp object with the same source and\n\
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).\n\
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {\n\
    return actual.source === expected.source &&\n\
           actual.global === expected.global &&\n\
           actual.multiline === expected.multiline &&\n\
           actual.lastIndex === expected.lastIndex &&\n\
           actual.ignoreCase === expected.ignoreCase;\n\
\n\
  // 7.4. Other pairs that do not both pass typeof value == 'object',\n\
  // equivalence is determined by ==.\n\
  } else if (!util.isObject(actual) && !util.isObject(expected)) {\n\
    return actual == expected;\n\
\n\
  // 7.5 For all other Object pairs, including Array objects, equivalence is\n\
  // determined by having the same number of owned properties (as verified\n\
  // with Object.prototype.hasOwnProperty.call), the same set of keys\n\
  // (although not necessarily the same order), equivalent values for every\n\
  // corresponding key, and an identical 'prototype' property. Note: this\n\
  // accounts for both named and indexed properties on Arrays.\n\
  } else {\n\
    return objEquiv(actual, expected);\n\
  }\n\
}\n\
\n\
function isArguments(object) {\n\
  return Object.prototype.toString.call(object) == '[object Arguments]';\n\
}\n\
\n\
function objEquiv(a, b) {\n\
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))\n\
    return false;\n\
  // an identical 'prototype' property.\n\
  if (a.prototype !== b.prototype) return false;\n\
  //~~~I've managed to break Object.keys through screwy arguments passing.\n\
  //   Converting to array solves the problem.\n\
  if (isArguments(a)) {\n\
    if (!isArguments(b)) {\n\
      return false;\n\
    }\n\
    a = pSlice.call(a);\n\
    b = pSlice.call(b);\n\
    return _deepEqual(a, b);\n\
  }\n\
  try {\n\
    var ka = objectKeys(a),\n\
        kb = objectKeys(b),\n\
        key, i;\n\
  } catch (e) {//happens when one is a string literal and the other isn't\n\
    return false;\n\
  }\n\
  // having the same number of owned properties (keys incorporates\n\
  // hasOwnProperty)\n\
  if (ka.length != kb.length)\n\
    return false;\n\
  //the same set of keys (although not necessarily the same order),\n\
  ka.sort();\n\
  kb.sort();\n\
  //~~~cheap key test\n\
  for (i = ka.length - 1; i >= 0; i--) {\n\
    if (ka[i] != kb[i])\n\
      return false;\n\
  }\n\
  //equivalent values for every corresponding key, and\n\
  //~~~possibly expensive deep test\n\
  for (i = ka.length - 1; i >= 0; i--) {\n\
    key = ka[i];\n\
    if (!_deepEqual(a[key], b[key])) return false;\n\
  }\n\
  return true;\n\
}\n\
\n\
// 8. The non-equivalence assertion tests for any deep inequality.\n\
// assert.notDeepEqual(actual, expected, message_opt);\n\
\n\
assert.notDeepEqual = function notDeepEqual(actual, expected, message) {\n\
  if (_deepEqual(actual, expected)) {\n\
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);\n\
  }\n\
};\n\
\n\
// 9. The strict equality assertion tests strict equality, as determined by ===.\n\
// assert.strictEqual(actual, expected, message_opt);\n\
\n\
assert.strictEqual = function strictEqual(actual, expected, message) {\n\
  if (actual !== expected) {\n\
    fail(actual, expected, message, '===', assert.strictEqual);\n\
  }\n\
};\n\
\n\
// 10. The strict non-equality assertion tests for strict inequality, as\n\
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);\n\
\n\
assert.notStrictEqual = function notStrictEqual(actual, expected, message) {\n\
  if (actual === expected) {\n\
    fail(actual, expected, message, '!==', assert.notStrictEqual);\n\
  }\n\
};\n\
\n\
function expectedException(actual, expected) {\n\
  if (!actual || !expected) {\n\
    return false;\n\
  }\n\
\n\
  if (Object.prototype.toString.call(expected) == '[object RegExp]') {\n\
    return expected.test(actual);\n\
  } else if (actual instanceof expected) {\n\
    return true;\n\
  } else if (expected.call({}, actual) === true) {\n\
    return true;\n\
  }\n\
\n\
  return false;\n\
}\n\
\n\
function _throws(shouldThrow, block, expected, message) {\n\
  var actual;\n\
\n\
  if (util.isString(expected)) {\n\
    message = expected;\n\
    expected = null;\n\
  }\n\
\n\
  try {\n\
    block();\n\
  } catch (e) {\n\
    actual = e;\n\
  }\n\
\n\
  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +\n\
            (message ? ' ' + message : '.');\n\
\n\
  if (shouldThrow && !actual) {\n\
    fail(actual, expected, 'Missing expected exception' + message);\n\
  }\n\
\n\
  if (!shouldThrow && expectedException(actual, expected)) {\n\
    fail(actual, expected, 'Got unwanted exception' + message);\n\
  }\n\
\n\
  if ((shouldThrow && actual && expected &&\n\
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {\n\
    throw actual;\n\
  }\n\
}\n\
\n\
// 11. Expected to throw an error:\n\
// assert.throws(block, Error_opt, message_opt);\n\
\n\
assert.throws = function(block, /*optional*/error, /*optional*/message) {\n\
  _throws.apply(this, [true].concat(pSlice.call(arguments)));\n\
};\n\
\n\
// EXTENSION! This is annoying to write outside this module.\n\
assert.doesNotThrow = function(block, /*optional*/message) {\n\
  _throws.apply(this, [false].concat(pSlice.call(arguments)));\n\
};\n\
\n\
assert.ifError = function(err) { if (err) {throw err;}};\n\
\n\
var objectKeys = Object.keys || function (obj) {\n\
  var keys = [];\n\
  for (var key in obj) {\n\
    if (hasOwn.call(obj, key)) keys.push(key);\n\
  }\n\
  return keys;\n\
};\n\
\n\
},{\"util/\":7}],6:[function(_dereq_,module,exports){\n\
module.exports = function isBuffer(arg) {\n\
  return arg && typeof arg === 'object'\n\
    && typeof arg.copy === 'function'\n\
    && typeof arg.fill === 'function'\n\
    && typeof arg.readUInt8 === 'function';\n\
}\n\
},{}],7:[function(_dereq_,module,exports){\n\
(function (process,global){\n\
// Copyright Joyent, Inc. and other Node contributors.\n\
//\n\
// Permission is hereby granted, free of charge, to any person obtaining a\n\
// copy of this software and associated documentation files (the\n\
// \"Software\"), to deal in the Software without restriction, including\n\
// without limitation the rights to use, copy, modify, merge, publish,\n\
// distribute, sublicense, and/or sell copies of the Software, and to permit\n\
// persons to whom the Software is furnished to do so, subject to the\n\
// following conditions:\n\
//\n\
// The above copyright notice and this permission notice shall be included\n\
// in all copies or substantial portions of the Software.\n\
//\n\
// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n\
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n\
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n\
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n\
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n\
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n\
// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
\n\
var formatRegExp = /%[sdj%]/g;\n\
exports.format = function(f) {\n\
  if (!isString(f)) {\n\
    var objects = [];\n\
    for (var i = 0; i < arguments.length; i++) {\n\
      objects.push(inspect(arguments[i]));\n\
    }\n\
    return objects.join(' ');\n\
  }\n\
\n\
  var i = 1;\n\
  var args = arguments;\n\
  var len = args.length;\n\
  var str = String(f).replace(formatRegExp, function(x) {\n\
    if (x === '%%') return '%';\n\
    if (i >= len) return x;\n\
    switch (x) {\n\
      case '%s': return String(args[i++]);\n\
      case '%d': return Number(args[i++]);\n\
      case '%j':\n\
        try {\n\
          return JSON.stringify(args[i++]);\n\
        } catch (_) {\n\
          return '[Circular]';\n\
        }\n\
      default:\n\
        return x;\n\
    }\n\
  });\n\
  for (var x = args[i]; i < len; x = args[++i]) {\n\
    if (isNull(x) || !isObject(x)) {\n\
      str += ' ' + x;\n\
    } else {\n\
      str += ' ' + inspect(x);\n\
    }\n\
  }\n\
  return str;\n\
};\n\
\n\
\n\
// Mark that a method should not be used.\n\
// Returns a modified function which warns once by default.\n\
// If --no-deprecation is set, then it is a no-op.\n\
exports.deprecate = function(fn, msg) {\n\
  // Allow for deprecating things in the process of starting up.\n\
  if (isUndefined(global.process)) {\n\
    return function() {\n\
      return exports.deprecate(fn, msg).apply(this, arguments);\n\
    };\n\
  }\n\
\n\
  if (process.noDeprecation === true) {\n\
    return fn;\n\
  }\n\
\n\
  var warned = false;\n\
  function deprecated() {\n\
    if (!warned) {\n\
      if (process.throwDeprecation) {\n\
        throw new Error(msg);\n\
      } else if (process.traceDeprecation) {\n\
        console.trace(msg);\n\
      } else {\n\
        console.error(msg);\n\
      }\n\
      warned = true;\n\
    }\n\
    return fn.apply(this, arguments);\n\
  }\n\
\n\
  return deprecated;\n\
};\n\
\n\
\n\
var debugs = {};\n\
var debugEnviron;\n\
exports.debuglog = function(set) {\n\
  if (isUndefined(debugEnviron))\n\
    debugEnviron = process.env.NODE_DEBUG || '';\n\
  set = set.toUpperCase();\n\
  if (!debugs[set]) {\n\
    if (new RegExp('\\\\b' + set + '\\\\b', 'i').test(debugEnviron)) {\n\
      var pid = process.pid;\n\
      debugs[set] = function() {\n\
        var msg = exports.format.apply(exports, arguments);\n\
        console.error('%s %d: %s', set, pid, msg);\n\
      };\n\
    } else {\n\
      debugs[set] = function() {};\n\
    }\n\
  }\n\
  return debugs[set];\n\
};\n\
\n\
\n\
/**\n\
 * Echos the value of a value. Trys to print the value out\n\
 * in the best way possible given the different types.\n\
 *\n\
 * @param {Object} obj The object to print out.\n\
 * @param {Object} opts Optional options object that alters the output.\n\
 */\n\
/* legacy: obj, showHidden, depth, colors*/\n\
function inspect(obj, opts) {\n\
  // default options\n\
  var ctx = {\n\
    seen: [],\n\
    stylize: stylizeNoColor\n\
  };\n\
  // legacy...\n\
  if (arguments.length >= 3) ctx.depth = arguments[2];\n\
  if (arguments.length >= 4) ctx.colors = arguments[3];\n\
  if (isBoolean(opts)) {\n\
    // legacy...\n\
    ctx.showHidden = opts;\n\
  } else if (opts) {\n\
    // got an \"options\" object\n\
    exports._extend(ctx, opts);\n\
  }\n\
  // set default options\n\
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;\n\
  if (isUndefined(ctx.depth)) ctx.depth = 2;\n\
  if (isUndefined(ctx.colors)) ctx.colors = false;\n\
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;\n\
  if (ctx.colors) ctx.stylize = stylizeWithColor;\n\
  return formatValue(ctx, obj, ctx.depth);\n\
}\n\
exports.inspect = inspect;\n\
\n\
\n\
// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics\n\
inspect.colors = {\n\
  'bold' : [1, 22],\n\
  'italic' : [3, 23],\n\
  'underline' : [4, 24],\n\
  'inverse' : [7, 27],\n\
  'white' : [37, 39],\n\
  'grey' : [90, 39],\n\
  'black' : [30, 39],\n\
  'blue' : [34, 39],\n\
  'cyan' : [36, 39],\n\
  'green' : [32, 39],\n\
  'magenta' : [35, 39],\n\
  'red' : [31, 39],\n\
  'yellow' : [33, 39]\n\
};\n\
\n\
// Don't use 'blue' not visible on cmd.exe\n\
inspect.styles = {\n\
  'special': 'cyan',\n\
  'number': 'yellow',\n\
  'boolean': 'yellow',\n\
  'undefined': 'grey',\n\
  'null': 'bold',\n\
  'string': 'green',\n\
  'date': 'magenta',\n\
  // \"name\": intentionally not styling\n\
  'regexp': 'red'\n\
};\n\
\n\
\n\
function stylizeWithColor(str, styleType) {\n\
  var style = inspect.styles[styleType];\n\
\n\
  if (style) {\n\
    return '\\u001b[' + inspect.colors[style][0] + 'm' + str +\n\
           '\\u001b[' + inspect.colors[style][1] + 'm';\n\
  } else {\n\
    return str;\n\
  }\n\
}\n\
\n\
\n\
function stylizeNoColor(str, styleType) {\n\
  return str;\n\
}\n\
\n\
\n\
function arrayToHash(array) {\n\
  var hash = {};\n\
\n\
  array.forEach(function(val, idx) {\n\
    hash[val] = true;\n\
  });\n\
\n\
  return hash;\n\
}\n\
\n\
\n\
function formatValue(ctx, value, recurseTimes) {\n\
  // Provide a hook for user-specified inspect functions.\n\
  // Check that value is an object with an inspect function on it\n\
  if (ctx.customInspect &&\n\
      value &&\n\
      isFunction(value.inspect) &&\n\
      // Filter out the util module, it's inspect function is special\n\
      value.inspect !== exports.inspect &&\n\
      // Also filter out any prototype objects using the circular check.\n\
      !(value.constructor && value.constructor.prototype === value)) {\n\
    var ret = value.inspect(recurseTimes, ctx);\n\
    if (!isString(ret)) {\n\
      ret = formatValue(ctx, ret, recurseTimes);\n\
    }\n\
    return ret;\n\
  }\n\
\n\
  // Primitive types cannot have properties\n\
  var primitive = formatPrimitive(ctx, value);\n\
  if (primitive) {\n\
    return primitive;\n\
  }\n\
\n\
  // Look up the keys of the object.\n\
  var keys = Object.keys(value);\n\
  var visibleKeys = arrayToHash(keys);\n\
\n\
  if (ctx.showHidden) {\n\
    keys = Object.getOwnPropertyNames(value);\n\
  }\n\
\n\
  // IE doesn't make error fields non-enumerable\n\
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx\n\
  if (isError(value)\n\
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {\n\
    return formatError(value);\n\
  }\n\
\n\
  // Some type of object without properties can be shortcutted.\n\
  if (keys.length === 0) {\n\
    if (isFunction(value)) {\n\
      var name = value.name ? ': ' + value.name : '';\n\
      return ctx.stylize('[Function' + name + ']', 'special');\n\
    }\n\
    if (isRegExp(value)) {\n\
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');\n\
    }\n\
    if (isDate(value)) {\n\
      return ctx.stylize(Date.prototype.toString.call(value), 'date');\n\
    }\n\
    if (isError(value)) {\n\
      return formatError(value);\n\
    }\n\
  }\n\
\n\
  var base = '', array = false, braces = ['{', '}'];\n\
\n\
  // Make Array say that they are Array\n\
  if (isArray(value)) {\n\
    array = true;\n\
    braces = ['[', ']'];\n\
  }\n\
\n\
  // Make functions say that they are functions\n\
  if (isFunction(value)) {\n\
    var n = value.name ? ': ' + value.name : '';\n\
    base = ' [Function' + n + ']';\n\
  }\n\
\n\
  // Make RegExps say that they are RegExps\n\
  if (isRegExp(value)) {\n\
    base = ' ' + RegExp.prototype.toString.call(value);\n\
  }\n\
\n\
  // Make dates with properties first say the date\n\
  if (isDate(value)) {\n\
    base = ' ' + Date.prototype.toUTCString.call(value);\n\
  }\n\
\n\
  // Make error with message first say the error\n\
  if (isError(value)) {\n\
    base = ' ' + formatError(value);\n\
  }\n\
\n\
  if (keys.length === 0 && (!array || value.length == 0)) {\n\
    return braces[0] + base + braces[1];\n\
  }\n\
\n\
  if (recurseTimes < 0) {\n\
    if (isRegExp(value)) {\n\
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');\n\
    } else {\n\
      return ctx.stylize('[Object]', 'special');\n\
    }\n\
  }\n\
\n\
  ctx.seen.push(value);\n\
\n\
  var output;\n\
  if (array) {\n\
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);\n\
  } else {\n\
    output = keys.map(function(key) {\n\
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);\n\
    });\n\
  }\n\
\n\
  ctx.seen.pop();\n\
\n\
  return reduceToSingleString(output, base, braces);\n\
}\n\
\n\
\n\
function formatPrimitive(ctx, value) {\n\
  if (isUndefined(value))\n\
    return ctx.stylize('undefined', 'undefined');\n\
  if (isString(value)) {\n\
    var simple = '\\'' + JSON.stringify(value).replace(/^\"|\"$/g, '')\n\
                                             .replace(/'/g, \"\\\\'\")\n\
                                             .replace(/\\\\\"/g, '\"') + '\\'';\n\
    return ctx.stylize(simple, 'string');\n\
  }\n\
  if (isNumber(value))\n\
    return ctx.stylize('' + value, 'number');\n\
  if (isBoolean(value))\n\
    return ctx.stylize('' + value, 'boolean');\n\
  // For some reason typeof null is \"object\", so special case here.\n\
  if (isNull(value))\n\
    return ctx.stylize('null', 'null');\n\
}\n\
\n\
\n\
function formatError(value) {\n\
  return '[' + Error.prototype.toString.call(value) + ']';\n\
}\n\
\n\
\n\
function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {\n\
  var output = [];\n\
  for (var i = 0, l = value.length; i < l; ++i) {\n\
    if (hasOwnProperty(value, String(i))) {\n\
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,\n\
          String(i), true));\n\
    } else {\n\
      output.push('');\n\
    }\n\
  }\n\
  keys.forEach(function(key) {\n\
    if (!key.match(/^\\d+$/)) {\n\
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,\n\
          key, true));\n\
    }\n\
  });\n\
  return output;\n\
}\n\
\n\
\n\
function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {\n\
  var name, str, desc;\n\
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };\n\
  if (desc.get) {\n\
    if (desc.set) {\n\
      str = ctx.stylize('[Getter/Setter]', 'special');\n\
    } else {\n\
      str = ctx.stylize('[Getter]', 'special');\n\
    }\n\
  } else {\n\
    if (desc.set) {\n\
      str = ctx.stylize('[Setter]', 'special');\n\
    }\n\
  }\n\
  if (!hasOwnProperty(visibleKeys, key)) {\n\
    name = '[' + key + ']';\n\
  }\n\
  if (!str) {\n\
    if (ctx.seen.indexOf(desc.value) < 0) {\n\
      if (isNull(recurseTimes)) {\n\
        str = formatValue(ctx, desc.value, null);\n\
      } else {\n\
        str = formatValue(ctx, desc.value, recurseTimes - 1);\n\
      }\n\
      if (str.indexOf('\\n\
') > -1) {\n\
        if (array) {\n\
          str = str.split('\\n\
').map(function(line) {\n\
            return '  ' + line;\n\
          }).join('\\n\
').substr(2);\n\
        } else {\n\
          str = '\\n\
' + str.split('\\n\
').map(function(line) {\n\
            return '   ' + line;\n\
          }).join('\\n\
');\n\
        }\n\
      }\n\
    } else {\n\
      str = ctx.stylize('[Circular]', 'special');\n\
    }\n\
  }\n\
  if (isUndefined(name)) {\n\
    if (array && key.match(/^\\d+$/)) {\n\
      return str;\n\
    }\n\
    name = JSON.stringify('' + key);\n\
    if (name.match(/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)) {\n\
      name = name.substr(1, name.length - 2);\n\
      name = ctx.stylize(name, 'name');\n\
    } else {\n\
      name = name.replace(/'/g, \"\\\\'\")\n\
                 .replace(/\\\\\"/g, '\"')\n\
                 .replace(/(^\"|\"$)/g, \"'\");\n\
      name = ctx.stylize(name, 'string');\n\
    }\n\
  }\n\
\n\
  return name + ': ' + str;\n\
}\n\
\n\
\n\
function reduceToSingleString(output, base, braces) {\n\
  var numLinesEst = 0;\n\
  var length = output.reduce(function(prev, cur) {\n\
    numLinesEst++;\n\
    if (cur.indexOf('\\n\
') >= 0) numLinesEst++;\n\
    return prev + cur.replace(/\\u001b\\[\\d\\d?m/g, '').length + 1;\n\
  }, 0);\n\
\n\
  if (length > 60) {\n\
    return braces[0] +\n\
           (base === '' ? '' : base + '\\n\
 ') +\n\
           ' ' +\n\
           output.join(',\\n\
  ') +\n\
           ' ' +\n\
           braces[1];\n\
  }\n\
\n\
  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];\n\
}\n\
\n\
\n\
// NOTE: These type checking functions intentionally don't use `instanceof`\n\
// because it is fragile and can be easily faked with `Object.create()`.\n\
function isArray(ar) {\n\
  return Array.isArray(ar);\n\
}\n\
exports.isArray = isArray;\n\
\n\
function isBoolean(arg) {\n\
  return typeof arg === 'boolean';\n\
}\n\
exports.isBoolean = isBoolean;\n\
\n\
function isNull(arg) {\n\
  return arg === null;\n\
}\n\
exports.isNull = isNull;\n\
\n\
function isNullOrUndefined(arg) {\n\
  return arg == null;\n\
}\n\
exports.isNullOrUndefined = isNullOrUndefined;\n\
\n\
function isNumber(arg) {\n\
  return typeof arg === 'number';\n\
}\n\
exports.isNumber = isNumber;\n\
\n\
function isString(arg) {\n\
  return typeof arg === 'string';\n\
}\n\
exports.isString = isString;\n\
\n\
function isSymbol(arg) {\n\
  return typeof arg === 'symbol';\n\
}\n\
exports.isSymbol = isSymbol;\n\
\n\
function isUndefined(arg) {\n\
  return arg === void 0;\n\
}\n\
exports.isUndefined = isUndefined;\n\
\n\
function isRegExp(re) {\n\
  return isObject(re) && objectToString(re) === '[object RegExp]';\n\
}\n\
exports.isRegExp = isRegExp;\n\
\n\
function isObject(arg) {\n\
  return typeof arg === 'object' && arg !== null;\n\
}\n\
exports.isObject = isObject;\n\
\n\
function isDate(d) {\n\
  return isObject(d) && objectToString(d) === '[object Date]';\n\
}\n\
exports.isDate = isDate;\n\
\n\
function isError(e) {\n\
  return isObject(e) &&\n\
      (objectToString(e) === '[object Error]' || e instanceof Error);\n\
}\n\
exports.isError = isError;\n\
\n\
function isFunction(arg) {\n\
  return typeof arg === 'function';\n\
}\n\
exports.isFunction = isFunction;\n\
\n\
function isPrimitive(arg) {\n\
  return arg === null ||\n\
         typeof arg === 'boolean' ||\n\
         typeof arg === 'number' ||\n\
         typeof arg === 'string' ||\n\
         typeof arg === 'symbol' ||  // ES6 symbol\n\
         typeof arg === 'undefined';\n\
}\n\
exports.isPrimitive = isPrimitive;\n\
\n\
exports.isBuffer = _dereq_('./support/isBuffer');\n\
\n\
function objectToString(o) {\n\
  return Object.prototype.toString.call(o);\n\
}\n\
\n\
\n\
function pad(n) {\n\
  return n < 10 ? '0' + n.toString(10) : n.toString(10);\n\
}\n\
\n\
\n\
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',\n\
              'Oct', 'Nov', 'Dec'];\n\
\n\
// 26 Feb 16:19:34\n\
function timestamp() {\n\
  var d = new Date();\n\
  var time = [pad(d.getHours()),\n\
              pad(d.getMinutes()),\n\
              pad(d.getSeconds())].join(':');\n\
  return [d.getDate(), months[d.getMonth()], time].join(' ');\n\
}\n\
\n\
\n\
// log is just a thin wrapper to console.log that prepends a timestamp\n\
exports.log = function() {\n\
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));\n\
};\n\
\n\
\n\
/**\n\
 * Inherit the prototype methods from one constructor into another.\n\
 *\n\
 * The Function.prototype.inherits from lang.js rewritten as a standalone\n\
 * function (not on Function.prototype). NOTE: If this file is to be loaded\n\
 * during bootstrapping this function needs to be rewritten using some native\n\
 * functions as prototype setup using normal JavaScript does not work as\n\
 * expected during bootstrapping (see mirror.js in r114903).\n\
 *\n\
 * @param {function} ctor Constructor function which needs to inherit the\n\
 *     prototype.\n\
 * @param {function} superCtor Constructor function to inherit prototype from.\n\
 */\n\
exports.inherits = _dereq_('inherits');\n\
\n\
exports._extend = function(origin, add) {\n\
  // Don't do anything if add isn't an object\n\
  if (!add || !isObject(add)) return origin;\n\
\n\
  var keys = Object.keys(add);\n\
  var i = keys.length;\n\
  while (i--) {\n\
    origin[keys[i]] = add[keys[i]];\n\
  }\n\
  return origin;\n\
};\n\
\n\
function hasOwnProperty(obj, prop) {\n\
  return Object.prototype.hasOwnProperty.call(obj, prop);\n\
}\n\
\n\
}).call(this,_dereq_(\"/Users/Storm/dev/segmentio/hermes/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js\"),typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {})\n\
},{\"./support/isBuffer\":6,\"/Users/Storm/dev/segmentio/hermes/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js\":10,\"inherits\":9}],8:[function(_dereq_,module,exports){\n\
// Copyright Joyent, Inc. and other Node contributors.\n\
//\n\
// Permission is hereby granted, free of charge, to any person obtaining a\n\
// copy of this software and associated documentation files (the\n\
// \"Software\"), to deal in the Software without restriction, including\n\
// without limitation the rights to use, copy, modify, merge, publish,\n\
// distribute, sublicense, and/or sell copies of the Software, and to permit\n\
// persons to whom the Software is furnished to do so, subject to the\n\
// following conditions:\n\
//\n\
// The above copyright notice and this permission notice shall be included\n\
// in all copies or substantial portions of the Software.\n\
//\n\
// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n\
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n\
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n\
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n\
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n\
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n\
// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
\n\
function EventEmitter() {\n\
  this._events = this._events || {};\n\
  this._maxListeners = this._maxListeners || undefined;\n\
}\n\
module.exports = EventEmitter;\n\
\n\
// Backwards-compat with node 0.10.x\n\
EventEmitter.EventEmitter = EventEmitter;\n\
\n\
EventEmitter.prototype._events = undefined;\n\
EventEmitter.prototype._maxListeners = undefined;\n\
\n\
// By default EventEmitters will print a warning if more than 10 listeners are\n\
// added to it. This is a useful default which helps finding memory leaks.\n\
EventEmitter.defaultMaxListeners = 10;\n\
\n\
// Obviously not all Emitters should be limited to 10. This function allows\n\
// that to be increased. Set to zero for unlimited.\n\
EventEmitter.prototype.setMaxListeners = function(n) {\n\
  if (!isNumber(n) || n < 0 || isNaN(n))\n\
    throw TypeError('n must be a positive number');\n\
  this._maxListeners = n;\n\
  return this;\n\
};\n\
\n\
EventEmitter.prototype.emit = function(type) {\n\
  var er, handler, len, args, i, listeners;\n\
\n\
  if (!this._events)\n\
    this._events = {};\n\
\n\
  // If there is no 'error' event listener then throw.\n\
  if (type === 'error') {\n\
    if (!this._events.error ||\n\
        (isObject(this._events.error) && !this._events.error.length)) {\n\
      er = arguments[1];\n\
      if (er instanceof Error) {\n\
        throw er; // Unhandled 'error' event\n\
      } else {\n\
        throw TypeError('Uncaught, unspecified \"error\" event.');\n\
      }\n\
      return false;\n\
    }\n\
  }\n\
\n\
  handler = this._events[type];\n\
\n\
  if (isUndefined(handler))\n\
    return false;\n\
\n\
  if (isFunction(handler)) {\n\
    switch (arguments.length) {\n\
      // fast cases\n\
      case 1:\n\
        handler.call(this);\n\
        break;\n\
      case 2:\n\
        handler.call(this, arguments[1]);\n\
        break;\n\
      case 3:\n\
        handler.call(this, arguments[1], arguments[2]);\n\
        break;\n\
      // slower\n\
      default:\n\
        len = arguments.length;\n\
        args = new Array(len - 1);\n\
        for (i = 1; i < len; i++)\n\
          args[i - 1] = arguments[i];\n\
        handler.apply(this, args);\n\
    }\n\
  } else if (isObject(handler)) {\n\
    len = arguments.length;\n\
    args = new Array(len - 1);\n\
    for (i = 1; i < len; i++)\n\
      args[i - 1] = arguments[i];\n\
\n\
    listeners = handler.slice();\n\
    len = listeners.length;\n\
    for (i = 0; i < len; i++)\n\
      listeners[i].apply(this, args);\n\
  }\n\
\n\
  return true;\n\
};\n\
\n\
EventEmitter.prototype.addListener = function(type, listener) {\n\
  var m;\n\
\n\
  if (!isFunction(listener))\n\
    throw TypeError('listener must be a function');\n\
\n\
  if (!this._events)\n\
    this._events = {};\n\
\n\
  // To avoid recursion in the case that type === \"newListener\"! Before\n\
  // adding it to the listeners, first emit \"newListener\".\n\
  if (this._events.newListener)\n\
    this.emit('newListener', type,\n\
              isFunction(listener.listener) ?\n\
              listener.listener : listener);\n\
\n\
  if (!this._events[type])\n\
    // Optimize the case of one listener. Don't need the extra array object.\n\
    this._events[type] = listener;\n\
  else if (isObject(this._events[type]))\n\
    // If we've already got an array, just append.\n\
    this._events[type].push(listener);\n\
  else\n\
    // Adding the second element, need to change to array.\n\
    this._events[type] = [this._events[type], listener];\n\
\n\
  // Check for listener leak\n\
  if (isObject(this._events[type]) && !this._events[type].warned) {\n\
    var m;\n\
    if (!isUndefined(this._maxListeners)) {\n\
      m = this._maxListeners;\n\
    } else {\n\
      m = EventEmitter.defaultMaxListeners;\n\
    }\n\
\n\
    if (m && m > 0 && this._events[type].length > m) {\n\
      this._events[type].warned = true;\n\
      console.error('(node) warning: possible EventEmitter memory ' +\n\
                    'leak detected. %d listeners added. ' +\n\
                    'Use emitter.setMaxListeners() to increase limit.',\n\
                    this._events[type].length);\n\
      console.trace();\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
EventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\
\n\
EventEmitter.prototype.once = function(type, listener) {\n\
  if (!isFunction(listener))\n\
    throw TypeError('listener must be a function');\n\
\n\
  var fired = false;\n\
\n\
  function g() {\n\
    this.removeListener(type, g);\n\
\n\
    if (!fired) {\n\
      fired = true;\n\
      listener.apply(this, arguments);\n\
    }\n\
  }\n\
\n\
  g.listener = listener;\n\
  this.on(type, g);\n\
\n\
  return this;\n\
};\n\
\n\
// emits a 'removeListener' event iff the listener was removed\n\
EventEmitter.prototype.removeListener = function(type, listener) {\n\
  var list, position, length, i;\n\
\n\
  if (!isFunction(listener))\n\
    throw TypeError('listener must be a function');\n\
\n\
  if (!this._events || !this._events[type])\n\
    return this;\n\
\n\
  list = this._events[type];\n\
  length = list.length;\n\
  position = -1;\n\
\n\
  if (list === listener ||\n\
      (isFunction(list.listener) && list.listener === listener)) {\n\
    delete this._events[type];\n\
    if (this._events.removeListener)\n\
      this.emit('removeListener', type, listener);\n\
\n\
  } else if (isObject(list)) {\n\
    for (i = length; i-- > 0;) {\n\
      if (list[i] === listener ||\n\
          (list[i].listener && list[i].listener === listener)) {\n\
        position = i;\n\
        break;\n\
      }\n\
    }\n\
\n\
    if (position < 0)\n\
      return this;\n\
\n\
    if (list.length === 1) {\n\
      list.length = 0;\n\
      delete this._events[type];\n\
    } else {\n\
      list.splice(position, 1);\n\
    }\n\
\n\
    if (this._events.removeListener)\n\
      this.emit('removeListener', type, listener);\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
EventEmitter.prototype.removeAllListeners = function(type) {\n\
  var key, listeners;\n\
\n\
  if (!this._events)\n\
    return this;\n\
\n\
  // not listening for removeListener, no need to emit\n\
  if (!this._events.removeListener) {\n\
    if (arguments.length === 0)\n\
      this._events = {};\n\
    else if (this._events[type])\n\
      delete this._events[type];\n\
    return this;\n\
  }\n\
\n\
  // emit removeListener for all listeners on all events\n\
  if (arguments.length === 0) {\n\
    for (key in this._events) {\n\
      if (key === 'removeListener') continue;\n\
      this.removeAllListeners(key);\n\
    }\n\
    this.removeAllListeners('removeListener');\n\
    this._events = {};\n\
    return this;\n\
  }\n\
\n\
  listeners = this._events[type];\n\
\n\
  if (isFunction(listeners)) {\n\
    this.removeListener(type, listeners);\n\
  } else {\n\
    // LIFO order\n\
    while (listeners.length)\n\
      this.removeListener(type, listeners[listeners.length - 1]);\n\
  }\n\
  delete this._events[type];\n\
\n\
  return this;\n\
};\n\
\n\
EventEmitter.prototype.listeners = function(type) {\n\
  var ret;\n\
  if (!this._events || !this._events[type])\n\
    ret = [];\n\
  else if (isFunction(this._events[type]))\n\
    ret = [this._events[type]];\n\
  else\n\
    ret = this._events[type].slice();\n\
  return ret;\n\
};\n\
\n\
EventEmitter.listenerCount = function(emitter, type) {\n\
  var ret;\n\
  if (!emitter._events || !emitter._events[type])\n\
    ret = 0;\n\
  else if (isFunction(emitter._events[type]))\n\
    ret = 1;\n\
  else\n\
    ret = emitter._events[type].length;\n\
  return ret;\n\
};\n\
\n\
function isFunction(arg) {\n\
  return typeof arg === 'function';\n\
}\n\
\n\
function isNumber(arg) {\n\
  return typeof arg === 'number';\n\
}\n\
\n\
function isObject(arg) {\n\
  return typeof arg === 'object' && arg !== null;\n\
}\n\
\n\
function isUndefined(arg) {\n\
  return arg === void 0;\n\
}\n\
\n\
},{}],9:[function(_dereq_,module,exports){\n\
if (typeof Object.create === 'function') {\n\
  // implementation from standard node.js 'util' module\n\
  module.exports = function inherits(ctor, superCtor) {\n\
    ctor.super_ = superCtor\n\
    ctor.prototype = Object.create(superCtor.prototype, {\n\
      constructor: {\n\
        value: ctor,\n\
        enumerable: false,\n\
        writable: true,\n\
        configurable: true\n\
      }\n\
    });\n\
  };\n\
} else {\n\
  // old school shim for old browsers\n\
  module.exports = function inherits(ctor, superCtor) {\n\
    ctor.super_ = superCtor\n\
    var TempCtor = function () {}\n\
    TempCtor.prototype = superCtor.prototype\n\
    ctor.prototype = new TempCtor()\n\
    ctor.prototype.constructor = ctor\n\
  }\n\
}\n\
\n\
},{}],10:[function(_dereq_,module,exports){\n\
// shim for using process in browser\n\
\n\
var process = module.exports = {};\n\
\n\
process.nextTick = (function () {\n\
    var canSetImmediate = typeof window !== 'undefined'\n\
    && window.setImmediate;\n\
    var canPost = typeof window !== 'undefined'\n\
    && window.postMessage && window.addEventListener\n\
    ;\n\
\n\
    if (canSetImmediate) {\n\
        return function (f) { return window.setImmediate(f) };\n\
    }\n\
\n\
    if (canPost) {\n\
        var queue = [];\n\
        window.addEventListener('message', function (ev) {\n\
            var source = ev.source;\n\
            if ((source === window || source === null) && ev.data === 'process-tick') {\n\
                ev.stopPropagation();\n\
                if (queue.length > 0) {\n\
                    var fn = queue.shift();\n\
                    fn();\n\
                }\n\
            }\n\
        }, true);\n\
\n\
        return function nextTick(fn) {\n\
            queue.push(fn);\n\
            window.postMessage('process-tick', '*');\n\
        };\n\
    }\n\
\n\
    return function nextTick(fn) {\n\
        setTimeout(fn, 0);\n\
    };\n\
})();\n\
\n\
process.title = 'browser';\n\
process.browser = true;\n\
process.env = {};\n\
process.argv = [];\n\
\n\
function noop() {}\n\
\n\
process.on = noop;\n\
process.once = noop;\n\
process.off = noop;\n\
process.emit = noop;\n\
\n\
process.binding = function (name) {\n\
    throw new Error('process.binding is not supported');\n\
}\n\
\n\
// TODO(shtylman)\n\
process.cwd = function () { return '/' };\n\
process.chdir = function (dir) {\n\
    throw new Error('process.chdir is not supported');\n\
};\n\
\n\
},{}],11:[function(_dereq_,module,exports){\n\
module.exports=_dereq_(6)\n\
},{}],12:[function(_dereq_,module,exports){\n\
module.exports=_dereq_(7)\n\
},{\"./support/isBuffer\":11,\"/Users/Storm/dev/segmentio/hermes/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js\":10,\"inherits\":9}],13:[function(_dereq_,module,exports){\n\
\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
\n\
},{}],14:[function(_dereq_,module,exports){\n\
(function (global){\n\
/**\n\
 * @license\n\
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>\n\
 * Build: `lodash modern -o ./dist/lodash.js`\n\
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>\n\
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>\n\
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n\
 * Available under MIT license <http://lodash.com/license>\n\
 */\n\
;(function() {\n\
\n\
  /** Used as a safe reference for `undefined` in pre ES5 environments */\n\
  var undefined;\n\
\n\
  /** Used to pool arrays and objects used internally */\n\
  var arrayPool = [],\n\
      objectPool = [];\n\
\n\
  /** Used to generate unique IDs */\n\
  var idCounter = 0;\n\
\n\
  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */\n\
  var keyPrefix = +new Date + '';\n\
\n\
  /** Used as the size when optimizations are enabled for large arrays */\n\
  var largeArraySize = 75;\n\
\n\
  /** Used as the max size of the `arrayPool` and `objectPool` */\n\
  var maxPoolSize = 40;\n\
\n\
  /** Used to detect and test whitespace */\n\
  var whitespace = (\n\
    // whitespace\n\
    ' \\t\\x0B\\f\\xA0\\ufeff' +\n\
\n\
    // line terminators\n\
    '\\n\
\\r\\u2028\\u2029' +\n\
\n\
    // unicode category \"Zs\" space separators\n\
    '\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000'\n\
  );\n\
\n\
  /** Used to match empty string literals in compiled template source */\n\
  var reEmptyStringLeading = /\\b__p \\+= '';/g,\n\
      reEmptyStringMiddle = /\\b(__p \\+=) '' \\+/g,\n\
      reEmptyStringTrailing = /(__e\\(.*?\\)|\\b__t\\)) \\+\\n\
'';/g;\n\
\n\
  /**\n\
   * Used to match ES6 template delimiters\n\
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals\n\
   */\n\
  var reEsTemplate = /\\$\\{([^\\\\}]*(?:\\\\.[^\\\\}]*)*)\\}/g;\n\
\n\
  /** Used to match regexp flags from their coerced string values */\n\
  var reFlags = /\\w*$/;\n\
\n\
  /** Used to detected named functions */\n\
  var reFuncName = /^\\s*function[ \\n\
\\r\\t]+\\w/;\n\
\n\
  /** Used to match \"interpolate\" template delimiters */\n\
  var reInterpolate = /<%=([\\s\\S]+?)%>/g;\n\
\n\
  /** Used to match leading whitespace and zeros to be removed */\n\
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');\n\
\n\
  /** Used to ensure capturing order of template delimiters */\n\
  var reNoMatch = /($^)/;\n\
\n\
  /** Used to detect functions containing a `this` reference */\n\
  var reThis = /\\bthis\\b/;\n\
\n\
  /** Used to match unescaped characters in compiled string literals */\n\
  var reUnescapedString = /['\\n\
\\r\\t\\u2028\\u2029\\\\]/g;\n\
\n\
  /** Used to assign default `context` object properties */\n\
  var contextProps = [\n\
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',\n\
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',\n\
    'parseInt', 'setTimeout'\n\
  ];\n\
\n\
  /** Used to make template sourceURLs easier to identify */\n\
  var templateCounter = 0;\n\
\n\
  /** `Object#toString` result shortcuts */\n\
  var argsClass = '[object Arguments]',\n\
      arrayClass = '[object Array]',\n\
      boolClass = '[object Boolean]',\n\
      dateClass = '[object Date]',\n\
      funcClass = '[object Function]',\n\
      numberClass = '[object Number]',\n\
      objectClass = '[object Object]',\n\
      regexpClass = '[object RegExp]',\n\
      stringClass = '[object String]';\n\
\n\
  /** Used to identify object classifications that `_.clone` supports */\n\
  var cloneableClasses = {};\n\
  cloneableClasses[funcClass] = false;\n\
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =\n\
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =\n\
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =\n\
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;\n\
\n\
  /** Used as an internal `_.debounce` options object */\n\
  var debounceOptions = {\n\
    'leading': false,\n\
    'maxWait': 0,\n\
    'trailing': false\n\
  };\n\
\n\
  /** Used as the property descriptor for `__bindData__` */\n\
  var descriptor = {\n\
    'configurable': false,\n\
    'enumerable': false,\n\
    'value': null,\n\
    'writable': false\n\
  };\n\
\n\
  /** Used to determine if values are of the language type Object */\n\
  var objectTypes = {\n\
    'boolean': false,\n\
    'function': true,\n\
    'object': true,\n\
    'number': false,\n\
    'string': false,\n\
    'undefined': false\n\
  };\n\
\n\
  /** Used to escape characters for inclusion in compiled string literals */\n\
  var stringEscapes = {\n\
    '\\\\': '\\\\',\n\
    \"'\": \"'\",\n\
    '\\n\
': 'n',\n\
    '\\r': 'r',\n\
    '\\t': 't',\n\
    '\\u2028': 'u2028',\n\
    '\\u2029': 'u2029'\n\
  };\n\
\n\
  /** Used as a reference to the global object */\n\
  var root = (objectTypes[typeof window] && window) || this;\n\
\n\
  /** Detect free variable `exports` */\n\
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;\n\
\n\
  /** Detect free variable `module` */\n\
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;\n\
\n\
  /** Detect the popular CommonJS extension `module.exports` */\n\
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;\n\
\n\
  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */\n\
  var freeGlobal = objectTypes[typeof global] && global;\n\
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {\n\
    root = freeGlobal;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * The base implementation of `_.indexOf` without support for binary searches\n\
   * or `fromIndex` constraints.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to search.\n\
   * @param {*} value The value to search for.\n\
   * @param {number} [fromIndex=0] The index to search from.\n\
   * @returns {number} Returns the index of the matched value or `-1`.\n\
   */\n\
  function baseIndexOf(array, value, fromIndex) {\n\
    var index = (fromIndex || 0) - 1,\n\
        length = array ? array.length : 0;\n\
\n\
    while (++index < length) {\n\
      if (array[index] === value) {\n\
        return index;\n\
      }\n\
    }\n\
    return -1;\n\
  }\n\
\n\
  /**\n\
   * An implementation of `_.contains` for cache objects that mimics the return\n\
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.\n\
   *\n\
   * @private\n\
   * @param {Object} cache The cache object to inspect.\n\
   * @param {*} value The value to search for.\n\
   * @returns {number} Returns `0` if `value` is found, else `-1`.\n\
   */\n\
  function cacheIndexOf(cache, value) {\n\
    var type = typeof value;\n\
    cache = cache.cache;\n\
\n\
    if (type == 'boolean' || value == null) {\n\
      return cache[value] ? 0 : -1;\n\
    }\n\
    if (type != 'number' && type != 'string') {\n\
      type = 'object';\n\
    }\n\
    var key = type == 'number' ? value : keyPrefix + value;\n\
    cache = (cache = cache[type]) && cache[key];\n\
\n\
    return type == 'object'\n\
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)\n\
      : (cache ? 0 : -1);\n\
  }\n\
\n\
  /**\n\
   * Adds a given value to the corresponding cache object.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to add to the cache.\n\
   */\n\
  function cachePush(value) {\n\
    var cache = this.cache,\n\
        type = typeof value;\n\
\n\
    if (type == 'boolean' || value == null) {\n\
      cache[value] = true;\n\
    } else {\n\
      if (type != 'number' && type != 'string') {\n\
        type = 'object';\n\
      }\n\
      var key = type == 'number' ? value : keyPrefix + value,\n\
          typeCache = cache[type] || (cache[type] = {});\n\
\n\
      if (type == 'object') {\n\
        (typeCache[key] || (typeCache[key] = [])).push(value);\n\
      } else {\n\
        typeCache[key] = true;\n\
      }\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Used by `_.max` and `_.min` as the default callback when a given\n\
   * collection is a string value.\n\
   *\n\
   * @private\n\
   * @param {string} value The character to inspect.\n\
   * @returns {number} Returns the code unit of given character.\n\
   */\n\
  function charAtCallback(value) {\n\
    return value.charCodeAt(0);\n\
  }\n\
\n\
  /**\n\
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting\n\
   * them in ascending order.\n\
   *\n\
   * @private\n\
   * @param {Object} a The object to compare to `b`.\n\
   * @param {Object} b The object to compare to `a`.\n\
   * @returns {number} Returns the sort order indicator of `1` or `-1`.\n\
   */\n\
  function compareAscending(a, b) {\n\
    var ac = a.criteria,\n\
        bc = b.criteria,\n\
        index = -1,\n\
        length = ac.length;\n\
\n\
    while (++index < length) {\n\
      var value = ac[index],\n\
          other = bc[index];\n\
\n\
      if (value !== other) {\n\
        if (value > other || typeof value == 'undefined') {\n\
          return 1;\n\
        }\n\
        if (value < other || typeof other == 'undefined') {\n\
          return -1;\n\
        }\n\
      }\n\
    }\n\
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications\n\
    // that causes it, under certain circumstances, to return the same value for\n\
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247\n\
    //\n\
    // This also ensures a stable sort in V8 and other engines.\n\
    // See http://code.google.com/p/v8/issues/detail?id=90\n\
    return a.index - b.index;\n\
  }\n\
\n\
  /**\n\
   * Creates a cache object to optimize linear searches of large arrays.\n\
   *\n\
   * @private\n\
   * @param {Array} [array=[]] The array to search.\n\
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.\n\
   */\n\
  function createCache(array) {\n\
    var index = -1,\n\
        length = array.length,\n\
        first = array[0],\n\
        mid = array[(length / 2) | 0],\n\
        last = array[length - 1];\n\
\n\
    if (first && typeof first == 'object' &&\n\
        mid && typeof mid == 'object' && last && typeof last == 'object') {\n\
      return false;\n\
    }\n\
    var cache = getObject();\n\
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;\n\
\n\
    var result = getObject();\n\
    result.array = array;\n\
    result.cache = cache;\n\
    result.push = cachePush;\n\
\n\
    while (++index < length) {\n\
      result.push(array[index]);\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * Used by `template` to escape characters for inclusion in compiled\n\
   * string literals.\n\
   *\n\
   * @private\n\
   * @param {string} match The matched character to escape.\n\
   * @returns {string} Returns the escaped character.\n\
   */\n\
  function escapeStringChar(match) {\n\
    return '\\\\' + stringEscapes[match];\n\
  }\n\
\n\
  /**\n\
   * Gets an array from the array pool or creates a new one if the pool is empty.\n\
   *\n\
   * @private\n\
   * @returns {Array} The array from the pool.\n\
   */\n\
  function getArray() {\n\
    return arrayPool.pop() || [];\n\
  }\n\
\n\
  /**\n\
   * Gets an object from the object pool or creates a new one if the pool is empty.\n\
   *\n\
   * @private\n\
   * @returns {Object} The object from the pool.\n\
   */\n\
  function getObject() {\n\
    return objectPool.pop() || {\n\
      'array': null,\n\
      'cache': null,\n\
      'criteria': null,\n\
      'false': false,\n\
      'index': 0,\n\
      'null': false,\n\
      'number': null,\n\
      'object': null,\n\
      'push': null,\n\
      'string': null,\n\
      'true': false,\n\
      'undefined': false,\n\
      'value': null\n\
    };\n\
  }\n\
\n\
  /**\n\
   * Releases the given array back to the array pool.\n\
   *\n\
   * @private\n\
   * @param {Array} [array] The array to release.\n\
   */\n\
  function releaseArray(array) {\n\
    array.length = 0;\n\
    if (arrayPool.length < maxPoolSize) {\n\
      arrayPool.push(array);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Releases the given object back to the object pool.\n\
   *\n\
   * @private\n\
   * @param {Object} [object] The object to release.\n\
   */\n\
  function releaseObject(object) {\n\
    var cache = object.cache;\n\
    if (cache) {\n\
      releaseObject(cache);\n\
    }\n\
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;\n\
    if (objectPool.length < maxPoolSize) {\n\
      objectPool.push(object);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Slices the `collection` from the `start` index up to, but not including,\n\
   * the `end` index.\n\
   *\n\
   * Note: This function is used instead of `Array#slice` to support node lists\n\
   * in IE < 9 and to ensure dense arrays are returned.\n\
   *\n\
   * @private\n\
   * @param {Array|Object|string} collection The collection to slice.\n\
   * @param {number} start The start index.\n\
   * @param {number} end The end index.\n\
   * @returns {Array} Returns the new array.\n\
   */\n\
  function slice(array, start, end) {\n\
    start || (start = 0);\n\
    if (typeof end == 'undefined') {\n\
      end = array ? array.length : 0;\n\
    }\n\
    var index = -1,\n\
        length = end - start || 0,\n\
        result = Array(length < 0 ? 0 : length);\n\
\n\
    while (++index < length) {\n\
      result[index] = array[start + index];\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * Create a new `lodash` function using the given context object.\n\
   *\n\
   * @static\n\
   * @memberOf _\n\
   * @category Utilities\n\
   * @param {Object} [context=root] The context object.\n\
   * @returns {Function} Returns the `lodash` function.\n\
   */\n\
  function runInContext(context) {\n\
    // Avoid issues with some ES3 environments that attempt to use values, named\n\
    // after built-in constructors like `Object`, for the creation of literals.\n\
    // ES5 clears this up by stating that literals must use built-in constructors.\n\
    // See http://es5.github.io/#x11.1.5.\n\
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;\n\
\n\
    /** Native constructor references */\n\
    var Array = context.Array,\n\
        Boolean = context.Boolean,\n\
        Date = context.Date,\n\
        Function = context.Function,\n\
        Math = context.Math,\n\
        Number = context.Number,\n\
        Object = context.Object,\n\
        RegExp = context.RegExp,\n\
        String = context.String,\n\
        TypeError = context.TypeError;\n\
\n\
    /**\n\
     * Used for `Array` method references.\n\
     *\n\
     * Normally `Array.prototype` would suffice, however, using an array literal\n\
     * avoids issues in Narwhal.\n\
     */\n\
    var arrayRef = [];\n\
\n\
    /** Used for native method references */\n\
    var objectProto = Object.prototype;\n\
\n\
    /** Used to restore the original `_` reference in `noConflict` */\n\
    var oldDash = context._;\n\
\n\
    /** Used to resolve the internal [[Class]] of values */\n\
    var toString = objectProto.toString;\n\
\n\
    /** Used to detect if a method is native */\n\
    var reNative = RegExp('^' +\n\
      String(toString)\n\
        .replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')\n\
        .replace(/toString| for [^\\]]+/g, '.*?') + '$'\n\
    );\n\
\n\
    /** Native method shortcuts */\n\
    var ceil = Math.ceil,\n\
        clearTimeout = context.clearTimeout,\n\
        floor = Math.floor,\n\
        fnToString = Function.prototype.toString,\n\
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,\n\
        hasOwnProperty = objectProto.hasOwnProperty,\n\
        push = arrayRef.push,\n\
        setTimeout = context.setTimeout,\n\
        splice = arrayRef.splice,\n\
        unshift = arrayRef.unshift;\n\
\n\
    /** Used to set meta data on functions */\n\
    var defineProperty = (function() {\n\
      // IE 8 only accepts DOM elements\n\
      try {\n\
        var o = {},\n\
            func = isNative(func = Object.defineProperty) && func,\n\
            result = func(o, o, o) && func;\n\
      } catch(e) { }\n\
      return result;\n\
    }());\n\
\n\
    /* Native method shortcuts for methods with the same name as other `lodash` methods */\n\
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,\n\
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,\n\
        nativeIsFinite = context.isFinite,\n\
        nativeIsNaN = context.isNaN,\n\
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,\n\
        nativeMax = Math.max,\n\
        nativeMin = Math.min,\n\
        nativeParseInt = context.parseInt,\n\
        nativeRandom = Math.random;\n\
\n\
    /** Used to lookup a built-in constructor by [[Class]] */\n\
    var ctorByClass = {};\n\
    ctorByClass[arrayClass] = Array;\n\
    ctorByClass[boolClass] = Boolean;\n\
    ctorByClass[dateClass] = Date;\n\
    ctorByClass[funcClass] = Function;\n\
    ctorByClass[objectClass] = Object;\n\
    ctorByClass[numberClass] = Number;\n\
    ctorByClass[regexpClass] = RegExp;\n\
    ctorByClass[stringClass] = String;\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object which wraps the given value to enable intuitive\n\
     * method chaining.\n\
     *\n\
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:\n\
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,\n\
     * and `unshift`\n\
     *\n\
     * Chaining is supported in custom builds as long as the `value` method is\n\
     * implicitly or explicitly included in the build.\n\
     *\n\
     * The chainable wrapper functions are:\n\
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,\n\
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,\n\
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,\n\
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,\n\
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,\n\
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,\n\
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,\n\
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,\n\
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,\n\
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,\n\
     * and `zip`\n\
     *\n\
     * The non-chainable wrapper functions are:\n\
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,\n\
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,\n\
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,\n\
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,\n\
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,\n\
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,\n\
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,\n\
     * `template`, `unescape`, `uniqueId`, and `value`\n\
     *\n\
     * The wrapper functions `first` and `last` return wrapped values when `n` is\n\
     * provided, otherwise they return unwrapped values.\n\
     *\n\
     * Explicit chaining can be enabled by using the `_.chain` method.\n\
     *\n\
     * @name _\n\
     * @constructor\n\
     * @category Chaining\n\
     * @param {*} value The value to wrap in a `lodash` instance.\n\
     * @returns {Object} Returns a `lodash` instance.\n\
     * @example\n\
     *\n\
     * var wrapped = _([1, 2, 3]);\n\
     *\n\
     * // returns an unwrapped value\n\
     * wrapped.reduce(function(sum, num) {\n\
     *   return sum + num;\n\
     * });\n\
     * // => 6\n\
     *\n\
     * // returns a wrapped value\n\
     * var squares = wrapped.map(function(num) {\n\
     *   return num * num;\n\
     * });\n\
     *\n\
     * _.isArray(squares);\n\
     * // => false\n\
     *\n\
     * _.isArray(squares.value());\n\
     * // => true\n\
     */\n\
    function lodash(value) {\n\
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor\n\
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))\n\
       ? value\n\
       : new lodashWrapper(value);\n\
    }\n\
\n\
    /**\n\
     * A fast path for creating `lodash` wrapper objects.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to wrap in a `lodash` instance.\n\
     * @param {boolean} chainAll A flag to enable chaining for all methods\n\
     * @returns {Object} Returns a `lodash` instance.\n\
     */\n\
    function lodashWrapper(value, chainAll) {\n\
      this.__chain__ = !!chainAll;\n\
      this.__wrapped__ = value;\n\
    }\n\
    // ensure `new lodashWrapper` is an instance of `lodash`\n\
    lodashWrapper.prototype = lodash.prototype;\n\
\n\
    /**\n\
     * An object used to flag environments features.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Object\n\
     */\n\
    var support = lodash.support = {};\n\
\n\
    /**\n\
     * Detect if functions can be decompiled by `Function#toString`\n\
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).\n\
     *\n\
     * @memberOf _.support\n\
     * @type boolean\n\
     */\n\
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);\n\
\n\
    /**\n\
     * Detect if `Function#name` is supported (all but IE).\n\
     *\n\
     * @memberOf _.support\n\
     * @type boolean\n\
     */\n\
    support.funcNames = typeof Function.name == 'string';\n\
\n\
    /**\n\
     * By default, the template delimiters used by Lo-Dash are similar to those in\n\
     * embedded Ruby (ERB). Change the following template settings to use alternative\n\
     * delimiters.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Object\n\
     */\n\
    lodash.templateSettings = {\n\
\n\
      /**\n\
       * Used to detect `data` property values to be HTML-escaped.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'escape': /<%-([\\s\\S]+?)%>/g,\n\
\n\
      /**\n\
       * Used to detect code to be evaluated.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'evaluate': /<%([\\s\\S]+?)%>/g,\n\
\n\
      /**\n\
       * Used to detect `data` property values to inject.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'interpolate': reInterpolate,\n\
\n\
      /**\n\
       * Used to reference the data object in the template text.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type string\n\
       */\n\
      'variable': '',\n\
\n\
      /**\n\
       * Used to import variables into the compiled template.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type Object\n\
       */\n\
      'imports': {\n\
\n\
        /**\n\
         * A reference to the `lodash` function.\n\
         *\n\
         * @memberOf _.templateSettings.imports\n\
         * @type Function\n\
         */\n\
        '_': lodash\n\
      }\n\
    };\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The base implementation of `_.bind` that creates the bound function and\n\
     * sets its meta data.\n\
     *\n\
     * @private\n\
     * @param {Array} bindData The bind data array.\n\
     * @returns {Function} Returns the new bound function.\n\
     */\n\
    function baseBind(bindData) {\n\
      var func = bindData[0],\n\
          partialArgs = bindData[2],\n\
          thisArg = bindData[4];\n\
\n\
      function bound() {\n\
        // `Function#bind` spec\n\
        // http://es5.github.io/#x15.3.4.5\n\
        if (partialArgs) {\n\
          // avoid `arguments` object deoptimizations by using `slice` instead\n\
          // of `Array.prototype.slice.call` and not assigning `arguments` to a\n\
          // variable as a ternary expression\n\
          var args = slice(partialArgs);\n\
          push.apply(args, arguments);\n\
        }\n\
        // mimic the constructor's `return` behavior\n\
        // http://es5.github.io/#x13.2.2\n\
        if (this instanceof bound) {\n\
          // ensure `new bound` is an instance of `func`\n\
          var thisBinding = baseCreate(func.prototype),\n\
              result = func.apply(thisBinding, args || arguments);\n\
          return isObject(result) ? result : thisBinding;\n\
        }\n\
        return func.apply(thisArg, args || arguments);\n\
      }\n\
      setBindData(bound, bindData);\n\
      return bound;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.clone` without argument juggling or support\n\
     * for `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates clones with source counterparts.\n\
     * @returns {*} Returns the cloned value.\n\
     */\n\
    function baseClone(value, isDeep, callback, stackA, stackB) {\n\
      if (callback) {\n\
        var result = callback(value);\n\
        if (typeof result != 'undefined') {\n\
          return result;\n\
        }\n\
      }\n\
      // inspect [[Class]]\n\
      var isObj = isObject(value);\n\
      if (isObj) {\n\
        var className = toString.call(value);\n\
        if (!cloneableClasses[className]) {\n\
          return value;\n\
        }\n\
        var ctor = ctorByClass[className];\n\
        switch (className) {\n\
          case boolClass:\n\
          case dateClass:\n\
            return new ctor(+value);\n\
\n\
          case numberClass:\n\
          case stringClass:\n\
            return new ctor(value);\n\
\n\
          case regexpClass:\n\
            result = ctor(value.source, reFlags.exec(value));\n\
            result.lastIndex = value.lastIndex;\n\
            return result;\n\
        }\n\
      } else {\n\
        return value;\n\
      }\n\
      var isArr = isArray(value);\n\
      if (isDeep) {\n\
        // check for circular references and return corresponding clone\n\
        var initedStack = !stackA;\n\
        stackA || (stackA = getArray());\n\
        stackB || (stackB = getArray());\n\
\n\
        var length = stackA.length;\n\
        while (length--) {\n\
          if (stackA[length] == value) {\n\
            return stackB[length];\n\
          }\n\
        }\n\
        result = isArr ? ctor(value.length) : {};\n\
      }\n\
      else {\n\
        result = isArr ? slice(value) : assign({}, value);\n\
      }\n\
      // add array properties assigned by `RegExp#exec`\n\
      if (isArr) {\n\
        if (hasOwnProperty.call(value, 'index')) {\n\
          result.index = value.index;\n\
        }\n\
        if (hasOwnProperty.call(value, 'input')) {\n\
          result.input = value.input;\n\
        }\n\
      }\n\
      // exit for shallow clone\n\
      if (!isDeep) {\n\
        return result;\n\
      }\n\
      // add the source value to the stack of traversed objects\n\
      // and associate it with its clone\n\
      stackA.push(value);\n\
      stackB.push(result);\n\
\n\
      // recursively populate clone (susceptible to call stack limits)\n\
      (isArr ? forEach : forOwn)(value, function(objValue, key) {\n\
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);\n\
      });\n\
\n\
      if (initedStack) {\n\
        releaseArray(stackA);\n\
        releaseArray(stackB);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.create` without support for assigning\n\
     * properties to the created object.\n\
     *\n\
     * @private\n\
     * @param {Object} prototype The object to inherit from.\n\
     * @returns {Object} Returns the new object.\n\
     */\n\
    function baseCreate(prototype, properties) {\n\
      return isObject(prototype) ? nativeCreate(prototype) : {};\n\
    }\n\
    // fallback for browsers without `Object.create`\n\
    if (!nativeCreate) {\n\
      baseCreate = (function() {\n\
        function Object() {}\n\
        return function(prototype) {\n\
          if (isObject(prototype)) {\n\
            Object.prototype = prototype;\n\
            var result = new Object;\n\
            Object.prototype = null;\n\
          }\n\
          return result || context.Object();\n\
        };\n\
      }());\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.createCallback` without support for creating\n\
     * \"_.pluck\" or \"_.where\" style callbacks.\n\
     *\n\
     * @private\n\
     * @param {*} [func=identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param {number} [argCount] The number of arguments the callback accepts.\n\
     * @returns {Function} Returns a callback function.\n\
     */\n\
    function baseCreateCallback(func, thisArg, argCount) {\n\
      if (typeof func != 'function') {\n\
        return identity;\n\
      }\n\
      // exit early for no `thisArg` or already bound by `Function#bind`\n\
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {\n\
        return func;\n\
      }\n\
      var bindData = func.__bindData__;\n\
      if (typeof bindData == 'undefined') {\n\
        if (support.funcNames) {\n\
          bindData = !func.name;\n\
        }\n\
        bindData = bindData || !support.funcDecomp;\n\
        if (!bindData) {\n\
          var source = fnToString.call(func);\n\
          if (!support.funcNames) {\n\
            bindData = !reFuncName.test(source);\n\
          }\n\
          if (!bindData) {\n\
            // checks if `func` references the `this` keyword and stores the result\n\
            bindData = reThis.test(source);\n\
            setBindData(func, bindData);\n\
          }\n\
        }\n\
      }\n\
      // exit early if there are no `this` references or `func` is bound\n\
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {\n\
        return func;\n\
      }\n\
      switch (argCount) {\n\
        case 1: return function(value) {\n\
          return func.call(thisArg, value);\n\
        };\n\
        case 2: return function(a, b) {\n\
          return func.call(thisArg, a, b);\n\
        };\n\
        case 3: return function(value, index, collection) {\n\
          return func.call(thisArg, value, index, collection);\n\
        };\n\
        case 4: return function(accumulator, value, index, collection) {\n\
          return func.call(thisArg, accumulator, value, index, collection);\n\
        };\n\
      }\n\
      return bind(func, thisArg);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `createWrapper` that creates the wrapper and\n\
     * sets its meta data.\n\
     *\n\
     * @private\n\
     * @param {Array} bindData The bind data array.\n\
     * @returns {Function} Returns the new function.\n\
     */\n\
    function baseCreateWrapper(bindData) {\n\
      var func = bindData[0],\n\
          bitmask = bindData[1],\n\
          partialArgs = bindData[2],\n\
          partialRightArgs = bindData[3],\n\
          thisArg = bindData[4],\n\
          arity = bindData[5];\n\
\n\
      var isBind = bitmask & 1,\n\
          isBindKey = bitmask & 2,\n\
          isCurry = bitmask & 4,\n\
          isCurryBound = bitmask & 8,\n\
          key = func;\n\
\n\
      function bound() {\n\
        var thisBinding = isBind ? thisArg : this;\n\
        if (partialArgs) {\n\
          var args = slice(partialArgs);\n\
          push.apply(args, arguments);\n\
        }\n\
        if (partialRightArgs || isCurry) {\n\
          args || (args = slice(arguments));\n\
          if (partialRightArgs) {\n\
            push.apply(args, partialRightArgs);\n\
          }\n\
          if (isCurry && args.length < arity) {\n\
            bitmask |= 16 & ~32;\n\
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);\n\
          }\n\
        }\n\
        args || (args = arguments);\n\
        if (isBindKey) {\n\
          func = thisBinding[key];\n\
        }\n\
        if (this instanceof bound) {\n\
          thisBinding = baseCreate(func.prototype);\n\
          var result = func.apply(thisBinding, args);\n\
          return isObject(result) ? result : thisBinding;\n\
        }\n\
        return func.apply(thisBinding, args);\n\
      }\n\
      setBindData(bound, bindData);\n\
      return bound;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.difference` that accepts a single array\n\
     * of values to exclude.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to process.\n\
     * @param {Array} [values] The array of values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     */\n\
    function baseDifference(array, values) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array ? array.length : 0,\n\
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,\n\
          result = [];\n\
\n\
      if (isLarge) {\n\
        var cache = createCache(values);\n\
        if (cache) {\n\
          indexOf = cacheIndexOf;\n\
          values = cache;\n\
        } else {\n\
          isLarge = false;\n\
        }\n\
      }\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (indexOf(values, value) < 0) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      if (isLarge) {\n\
        releaseObject(values);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.flatten` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.\n\
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.\n\
     * @param {number} [fromIndex=0] The index to start from.\n\
     * @returns {Array} Returns a new flattened array.\n\
     */\n\
    function baseFlatten(array, isShallow, isStrict, fromIndex) {\n\
      var index = (fromIndex || 0) - 1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
\n\
        if (value && typeof value == 'object' && typeof value.length == 'number'\n\
            && (isArray(value) || isArguments(value))) {\n\
          // recursively flatten arrays (susceptible to call stack limits)\n\
          if (!isShallow) {\n\
            value = baseFlatten(value, isShallow, isStrict);\n\
          }\n\
          var valIndex = -1,\n\
              valLength = value.length,\n\
              resIndex = result.length;\n\
\n\
          result.length += valLength;\n\
          while (++valIndex < valLength) {\n\
            result[resIndex++] = value[valIndex];\n\
          }\n\
        } else if (!isStrict) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,\n\
     * that allows partial \"_.where\" style comparisons.\n\
     *\n\
     * @private\n\
     * @param {*} a The value to compare.\n\
     * @param {*} b The other value to compare.\n\
     * @param {Function} [callback] The function to customize comparing values.\n\
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.\n\
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.\n\
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     */\n\
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {\n\
      // used to indicate that when comparing objects, `a` has at least the properties of `b`\n\
      if (callback) {\n\
        var result = callback(a, b);\n\
        if (typeof result != 'undefined') {\n\
          return !!result;\n\
        }\n\
      }\n\
      // exit early for identical values\n\
      if (a === b) {\n\
        // treat `+0` vs. `-0` as not equal\n\
        return a !== 0 || (1 / a == 1 / b);\n\
      }\n\
      var type = typeof a,\n\
          otherType = typeof b;\n\
\n\
      // exit early for unlike primitive values\n\
      if (a === a &&\n\
          !(a && objectTypes[type]) &&\n\
          !(b && objectTypes[otherType])) {\n\
        return false;\n\
      }\n\
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior\n\
      // http://es5.github.io/#x15.3.4.4\n\
      if (a == null || b == null) {\n\
        return a === b;\n\
      }\n\
      // compare [[Class]] names\n\
      var className = toString.call(a),\n\
          otherClass = toString.call(b);\n\
\n\
      if (className == argsClass) {\n\
        className = objectClass;\n\
      }\n\
      if (otherClass == argsClass) {\n\
        otherClass = objectClass;\n\
      }\n\
      if (className != otherClass) {\n\
        return false;\n\
      }\n\
      switch (className) {\n\
        case boolClass:\n\
        case dateClass:\n\
          // coerce dates and booleans to numbers, dates to milliseconds and booleans\n\
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal\n\
          return +a == +b;\n\
\n\
        case numberClass:\n\
          // treat `NaN` vs. `NaN` as equal\n\
          return (a != +a)\n\
            ? b != +b\n\
            // but treat `+0` vs. `-0` as not equal\n\
            : (a == 0 ? (1 / a == 1 / b) : a == +b);\n\
\n\
        case regexpClass:\n\
        case stringClass:\n\
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)\n\
          // treat string primitives and their corresponding object instances as equal\n\
          return a == String(b);\n\
      }\n\
      var isArr = className == arrayClass;\n\
      if (!isArr) {\n\
        // unwrap any `lodash` wrapped values\n\
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),\n\
            bWrapped = hasOwnProperty.call(b, '__wrapped__');\n\
\n\
        if (aWrapped || bWrapped) {\n\
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);\n\
        }\n\
        // exit for functions and DOM nodes\n\
        if (className != objectClass) {\n\
          return false;\n\
        }\n\
        // in older versions of Opera, `arguments` objects have `Array` constructors\n\
        var ctorA = a.constructor,\n\
            ctorB = b.constructor;\n\
\n\
        // non `Object` object instances with different constructors are not equal\n\
        if (ctorA != ctorB &&\n\
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&\n\
              ('constructor' in a && 'constructor' in b)\n\
            ) {\n\
          return false;\n\
        }\n\
      }\n\
      // assume cyclic structures are equal\n\
      // the algorithm for detecting cyclic structures is adapted from ES 5.1\n\
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)\n\
      var initedStack = !stackA;\n\
      stackA || (stackA = getArray());\n\
      stackB || (stackB = getArray());\n\
\n\
      var length = stackA.length;\n\
      while (length--) {\n\
        if (stackA[length] == a) {\n\
          return stackB[length] == b;\n\
        }\n\
      }\n\
      var size = 0;\n\
      result = true;\n\
\n\
      // add `a` and `b` to the stack of traversed objects\n\
      stackA.push(a);\n\
      stackB.push(b);\n\
\n\
      // recursively compare objects and arrays (susceptible to call stack limits)\n\
      if (isArr) {\n\
        // compare lengths to determine if a deep comparison is necessary\n\
        length = a.length;\n\
        size = b.length;\n\
        result = size == length;\n\
\n\
        if (result || isWhere) {\n\
          // deep compare the contents, ignoring non-numeric properties\n\
          while (size--) {\n\
            var index = length,\n\
                value = b[size];\n\
\n\
            if (isWhere) {\n\
              while (index--) {\n\
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {\n\
                  break;\n\
                }\n\
              }\n\
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {\n\
              break;\n\
            }\n\
          }\n\
        }\n\
      }\n\
      else {\n\
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`\n\
        // which, in this case, is more costly\n\
        forIn(b, function(value, key, b) {\n\
          if (hasOwnProperty.call(b, key)) {\n\
            // count the number of properties.\n\
            size++;\n\
            // deep compare each property value.\n\
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));\n\
          }\n\
        });\n\
\n\
        if (result && !isWhere) {\n\
          // ensure both objects have the same number of properties\n\
          forIn(a, function(value, key, a) {\n\
            if (hasOwnProperty.call(a, key)) {\n\
              // `size` will be `-1` if `a` has more properties than `b`\n\
              return (result = --size > -1);\n\
            }\n\
          });\n\
        }\n\
      }\n\
      stackA.pop();\n\
      stackB.pop();\n\
\n\
      if (initedStack) {\n\
        releaseArray(stackA);\n\
        releaseArray(stackB);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.merge` without argument juggling or support\n\
     * for `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The destination object.\n\
     * @param {Object} source The source object.\n\
     * @param {Function} [callback] The function to customize merging properties.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates values with source counterparts.\n\
     */\n\
    function baseMerge(object, source, callback, stackA, stackB) {\n\
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {\n\
        var found,\n\
            isArr,\n\
            result = source,\n\
            value = object[key];\n\
\n\
        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {\n\
          // avoid merging previously merged cyclic sources\n\
          var stackLength = stackA.length;\n\
          while (stackLength--) {\n\
            if ((found = stackA[stackLength] == source)) {\n\
              value = stackB[stackLength];\n\
              break;\n\
            }\n\
          }\n\
          if (!found) {\n\
            var isShallow;\n\
            if (callback) {\n\
              result = callback(value, source);\n\
              if ((isShallow = typeof result != 'undefined')) {\n\
                value = result;\n\
              }\n\
            }\n\
            if (!isShallow) {\n\
              value = isArr\n\
                ? (isArray(value) ? value : [])\n\
                : (isPlainObject(value) ? value : {});\n\
            }\n\
            // add `source` and associated `value` to the stack of traversed objects\n\
            stackA.push(source);\n\
            stackB.push(value);\n\
\n\
            // recursively merge objects and arrays (susceptible to call stack limits)\n\
            if (!isShallow) {\n\
              baseMerge(value, source, callback, stackA, stackB);\n\
            }\n\
          }\n\
        }\n\
        else {\n\
          if (callback) {\n\
            result = callback(value, source);\n\
            if (typeof result == 'undefined') {\n\
              result = source;\n\
            }\n\
          }\n\
          if (typeof result != 'undefined') {\n\
            value = result;\n\
          }\n\
        }\n\
        object[key] = value;\n\
      });\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.random` without argument juggling or support\n\
     * for returning floating-point numbers.\n\
     *\n\
     * @private\n\
     * @param {number} min The minimum possible value.\n\
     * @param {number} max The maximum possible value.\n\
     * @returns {number} Returns a random number.\n\
     */\n\
    function baseRandom(min, max) {\n\
      return min + floor(nativeRandom() * (max - min + 1));\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.uniq` without support for callback shorthands\n\
     * or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to process.\n\
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.\n\
     * @param {Function} [callback] The function called per iteration.\n\
     * @returns {Array} Returns a duplicate-value-free array.\n\
     */\n\
    function baseUniq(array, isSorted, callback) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,\n\
          seen = (callback || isLarge) ? getArray() : result;\n\
\n\
      if (isLarge) {\n\
        var cache = createCache(seen);\n\
        indexOf = cacheIndexOf;\n\
        seen = cache;\n\
      }\n\
      while (++index < length) {\n\
        var value = array[index],\n\
            computed = callback ? callback(value, index, array) : value;\n\
\n\
        if (isSorted\n\
              ? !index || seen[seen.length - 1] !== computed\n\
              : indexOf(seen, computed) < 0\n\
            ) {\n\
          if (callback || isLarge) {\n\
            seen.push(computed);\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      if (isLarge) {\n\
        releaseArray(seen.array);\n\
        releaseObject(seen);\n\
      } else if (callback) {\n\
        releaseArray(seen);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that aggregates a collection, creating an object composed\n\
     * of keys generated from the results of running each element of the collection\n\
     * through a callback. The given `setter` function sets the keys and values\n\
     * of the composed object.\n\
     *\n\
     * @private\n\
     * @param {Function} setter The setter function.\n\
     * @returns {Function} Returns the new aggregator function.\n\
     */\n\
    function createAggregator(setter) {\n\
      return function(collection, callback, thisArg) {\n\
        var result = {};\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
        var index = -1,\n\
            length = collection ? collection.length : 0;\n\
\n\
        if (typeof length == 'number') {\n\
          while (++index < length) {\n\
            var value = collection[index];\n\
            setter(result, value, callback(value, index, collection), collection);\n\
          }\n\
        } else {\n\
          forOwn(collection, function(value, key, collection) {\n\
            setter(result, value, callback(value, key, collection), collection);\n\
          });\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, either curries or invokes `func`\n\
     * with an optional `this` binding and partially applied arguments.\n\
     *\n\
     * @private\n\
     * @param {Function|string} func The function or method name to reference.\n\
     * @param {number} bitmask The bitmask of method flags to compose.\n\
     *  The bitmask may be composed of the following flags:\n\
     *  1 - `_.bind`\n\
     *  2 - `_.bindKey`\n\
     *  4 - `_.curry`\n\
     *  8 - `_.curry` (bound)\n\
     *  16 - `_.partial`\n\
     *  32 - `_.partialRight`\n\
     * @param {Array} [partialArgs] An array of arguments to prepend to those\n\
     *  provided to the new function.\n\
     * @param {Array} [partialRightArgs] An array of arguments to append to those\n\
     *  provided to the new function.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {number} [arity] The arity of `func`.\n\
     * @returns {Function} Returns the new function.\n\
     */\n\
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {\n\
      var isBind = bitmask & 1,\n\
          isBindKey = bitmask & 2,\n\
          isCurry = bitmask & 4,\n\
          isCurryBound = bitmask & 8,\n\
          isPartial = bitmask & 16,\n\
          isPartialRight = bitmask & 32;\n\
\n\
      if (!isBindKey && !isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      if (isPartial && !partialArgs.length) {\n\
        bitmask &= ~16;\n\
        isPartial = partialArgs = false;\n\
      }\n\
      if (isPartialRight && !partialRightArgs.length) {\n\
        bitmask &= ~32;\n\
        isPartialRight = partialRightArgs = false;\n\
      }\n\
      var bindData = func && func.__bindData__;\n\
      if (bindData && bindData !== true) {\n\
        // clone `bindData`\n\
        bindData = slice(bindData);\n\
        if (bindData[2]) {\n\
          bindData[2] = slice(bindData[2]);\n\
        }\n\
        if (bindData[3]) {\n\
          bindData[3] = slice(bindData[3]);\n\
        }\n\
        // set `thisBinding` is not previously bound\n\
        if (isBind && !(bindData[1] & 1)) {\n\
          bindData[4] = thisArg;\n\
        }\n\
        // set if previously bound but not currently (subsequent curried functions)\n\
        if (!isBind && bindData[1] & 1) {\n\
          bitmask |= 8;\n\
        }\n\
        // set curried arity if not yet set\n\
        if (isCurry && !(bindData[1] & 4)) {\n\
          bindData[5] = arity;\n\
        }\n\
        // append partial left arguments\n\
        if (isPartial) {\n\
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);\n\
        }\n\
        // append partial right arguments\n\
        if (isPartialRight) {\n\
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);\n\
        }\n\
        // merge flags\n\
        bindData[1] |= bitmask;\n\
        return createWrapper.apply(null, bindData);\n\
      }\n\
      // fast path for `_.bind`\n\
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;\n\
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);\n\
    }\n\
\n\
    /**\n\
     * Used by `escape` to convert characters to HTML entities.\n\
     *\n\
     * @private\n\
     * @param {string} match The matched character to escape.\n\
     * @returns {string} Returns the escaped character.\n\
     */\n\
    function escapeHtmlChar(match) {\n\
      return htmlEscapes[match];\n\
    }\n\
\n\
    /**\n\
     * Gets the appropriate \"indexOf\" function. If the `_.indexOf` method is\n\
     * customized, this method returns the custom method, otherwise it returns\n\
     * the `baseIndexOf` function.\n\
     *\n\
     * @private\n\
     * @returns {Function} Returns the \"indexOf\" function.\n\
     */\n\
    function getIndexOf() {\n\
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a native function.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.\n\
     */\n\
    function isNative(value) {\n\
      return typeof value == 'function' && reNative.test(value);\n\
    }\n\
\n\
    /**\n\
     * Sets `this` binding data on a given function.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to set data on.\n\
     * @param {Array} value The data array to set.\n\
     */\n\
    var setBindData = !defineProperty ? noop : function(func, value) {\n\
      descriptor.value = value;\n\
      defineProperty(func, '__bindData__', descriptor);\n\
    };\n\
\n\
    /**\n\
     * A fallback implementation of `isPlainObject` which checks if a given value\n\
     * is an object created by the `Object` constructor, assuming objects created\n\
     * by the `Object` constructor have no inherited enumerable properties and that\n\
     * there are no `Object.prototype` extensions.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.\n\
     */\n\
    function shimIsPlainObject(value) {\n\
      var ctor,\n\
          result;\n\
\n\
      // avoid non Object objects, `arguments` objects, and DOM elements\n\
      if (!(value && toString.call(value) == objectClass) ||\n\
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {\n\
        return false;\n\
      }\n\
      // In most environments an object's own properties are iterated before\n\
      // its inherited properties. If the last iterated property is an object's\n\
      // own property then there are no inherited enumerable properties.\n\
      forIn(value, function(value, key) {\n\
        result = key;\n\
      });\n\
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);\n\
    }\n\
\n\
    /**\n\
     * Used by `unescape` to convert HTML entities to characters.\n\
     *\n\
     * @private\n\
     * @param {string} match The matched character to unescape.\n\
     * @returns {string} Returns the unescaped character.\n\
     */\n\
    function unescapeHtmlChar(match) {\n\
      return htmlUnescapes[match];\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Checks if `value` is an `arguments` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.\n\
     * @example\n\
     *\n\
     * (function() { return _.isArguments(arguments); })(1, 2, 3);\n\
     * // => true\n\
     *\n\
     * _.isArguments([1, 2, 3]);\n\
     * // => false\n\
     */\n\
    function isArguments(value) {\n\
      return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
        toString.call(value) == argsClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.\n\
     * @example\n\
     *\n\
     * (function() { return _.isArray(arguments); })();\n\
     * // => false\n\
     *\n\
     * _.isArray([1, 2, 3]);\n\
     * // => true\n\
     */\n\
    var isArray = nativeIsArray || function(value) {\n\
      return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
        toString.call(value) == arrayClass || false;\n\
    };\n\
\n\
    /**\n\
     * A fallback implementation of `Object.keys` which produces an array of the\n\
     * given object's own enumerable property names.\n\
     *\n\
     * @private\n\
     * @type Function\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names.\n\
     */\n\
    var shimKeys = function(object) {\n\
      var index, iterable = object, result = [];\n\
      if (!iterable) return result;\n\
      if (!(objectTypes[typeof object])) return result;\n\
        for (index in iterable) {\n\
          if (hasOwnProperty.call(iterable, index)) {\n\
            result.push(index);\n\
          }\n\
        }\n\
      return result\n\
    };\n\
\n\
    /**\n\
     * Creates an array composed of the own enumerable property names of an object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names.\n\
     * @example\n\
     *\n\
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)\n\
     */\n\
    var keys = !nativeKeys ? shimKeys : function(object) {\n\
      if (!isObject(object)) {\n\
        return [];\n\
      }\n\
      return nativeKeys(object);\n\
    };\n\
\n\
    /**\n\
     * Used to convert characters to HTML entities:\n\
     *\n\
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`\n\
     * don't require escaping in HTML and have no special meaning unless they're part\n\
     * of a tag or an unquoted attribute value.\n\
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under \"semi-related fun fact\")\n\
     */\n\
    var htmlEscapes = {\n\
      '&': '&amp;',\n\
      '<': '&lt;',\n\
      '>': '&gt;',\n\
      '\"': '&quot;',\n\
      \"'\": '&#39;'\n\
    };\n\
\n\
    /** Used to convert HTML entities to characters */\n\
    var htmlUnescapes = invert(htmlEscapes);\n\
\n\
    /** Used to match HTML entities and HTML characters */\n\
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),\n\
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object. Subsequent sources will overwrite property assignments of previous\n\
     * sources. If a callback is provided it will be executed to produce the\n\
     * assigned values. The callback is bound to `thisArg` and invoked with two\n\
     * arguments; (objectValue, sourceValue).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @alias extend\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param {Function} [callback] The function to customize assigning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });\n\
     * // => { 'name': 'fred', 'employer': 'slate' }\n\
     *\n\
     * var defaults = _.partialRight(_.assign, function(a, b) {\n\
     *   return typeof a == 'undefined' ? b : a;\n\
     * });\n\
     *\n\
     * var object = { 'name': 'barney' };\n\
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });\n\
     * // => { 'name': 'barney', 'employer': 'slate' }\n\
     */\n\
    var assign = function(object, source, guard) {\n\
      var index, iterable = object, result = iterable;\n\
      if (!iterable) return result;\n\
      var args = arguments,\n\
          argsIndex = 0,\n\
          argsLength = typeof guard == 'number' ? 2 : args.length;\n\
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {\n\
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);\n\
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {\n\
        callback = args[--argsLength];\n\
      }\n\
      while (++argsIndex < argsLength) {\n\
        iterable = args[argsIndex];\n\
        if (iterable && objectTypes[typeof iterable]) {\n\
        var ownIndex = -1,\n\
            ownProps = objectTypes[typeof iterable] && keys(iterable),\n\
            length = ownProps ? ownProps.length : 0;\n\
\n\
        while (++ownIndex < length) {\n\
          index = ownProps[ownIndex];\n\
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];\n\
        }\n\
        }\n\
      }\n\
      return result\n\
    };\n\
\n\
    /**\n\
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also\n\
     * be cloned, otherwise they will be assigned by reference. If a callback\n\
     * is provided it will be executed to produce the cloned values. If the\n\
     * callback returns `undefined` cloning will be handled by the method instead.\n\
     * The callback is bound to `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the cloned value.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * var shallow = _.clone(characters);\n\
     * shallow[0] === characters[0];\n\
     * // => true\n\
     *\n\
     * var deep = _.clone(characters, true);\n\
     * deep[0] === characters[0];\n\
     * // => false\n\
     *\n\
     * _.mixin({\n\
     *   'clone': _.partialRight(_.clone, function(value) {\n\
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;\n\
     *   })\n\
     * });\n\
     *\n\
     * var clone = _.clone(document.body);\n\
     * clone.childNodes.length;\n\
     * // => 0\n\
     */\n\
    function clone(value, isDeep, callback, thisArg) {\n\
      // allows working with \"Collections\" methods without using their `index`\n\
      // and `collection` arguments for `isDeep` and `callback`\n\
      if (typeof isDeep != 'boolean' && isDeep != null) {\n\
        thisArg = callback;\n\
        callback = isDeep;\n\
        isDeep = false;\n\
      }\n\
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates a deep clone of `value`. If a callback is provided it will be\n\
     * executed to produce the cloned values. If the callback returns `undefined`\n\
     * cloning will be handled by the method instead. The callback is bound to\n\
     * `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * Note: This method is loosely based on the structured clone algorithm. Functions\n\
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and\n\
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.\n\
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the deep cloned value.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * var deep = _.cloneDeep(characters);\n\
     * deep[0] === characters[0];\n\
     * // => false\n\
     *\n\
     * var view = {\n\
     *   'label': 'docs',\n\
     *   'node': element\n\
     * };\n\
     *\n\
     * var clone = _.cloneDeep(view, function(value) {\n\
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;\n\
     * });\n\
     *\n\
     * clone.node == view.node;\n\
     * // => false\n\
     */\n\
    function cloneDeep(value, callback, thisArg) {\n\
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates an object that inherits from the given `prototype` object. If a\n\
     * `properties` object is provided its own enumerable properties are assigned\n\
     * to the created object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} prototype The object to inherit from.\n\
     * @param {Object} [properties] The properties to assign to the object.\n\
     * @returns {Object} Returns the new object.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * function Circle() {\n\
     *   Shape.call(this);\n\
     * }\n\
     *\n\
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });\n\
     *\n\
     * var circle = new Circle;\n\
     * circle instanceof Circle;\n\
     * // => true\n\
     *\n\
     * circle instanceof Shape;\n\
     * // => true\n\
     */\n\
    function create(prototype, properties) {\n\
      var result = baseCreate(prototype);\n\
      return properties ? assign(result, properties) : result;\n\
    }\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object for all destination properties that resolve to `undefined`. Once a\n\
     * property is set, additional defaults of the same property will be ignored.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param- {Object} [guard] Allows working with `_.reduce` without using its\n\
     *  `key` and `object` arguments as sources.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'barney' };\n\
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });\n\
     * // => { 'name': 'barney', 'employer': 'slate' }\n\
     */\n\
    var defaults = function(object, source, guard) {\n\
      var index, iterable = object, result = iterable;\n\
      if (!iterable) return result;\n\
      var args = arguments,\n\
          argsIndex = 0,\n\
          argsLength = typeof guard == 'number' ? 2 : args.length;\n\
      while (++argsIndex < argsLength) {\n\
        iterable = args[argsIndex];\n\
        if (iterable && objectTypes[typeof iterable]) {\n\
        var ownIndex = -1,\n\
            ownProps = objectTypes[typeof iterable] && keys(iterable),\n\
            length = ownProps ? ownProps.length : 0;\n\
\n\
        while (++ownIndex < length) {\n\
          index = ownProps[ownIndex];\n\
          if (typeof result[index] == 'undefined') result[index] = iterable[index];\n\
        }\n\
        }\n\
      }\n\
      return result\n\
    };\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it returns the key of the\n\
     * first element that passes the callback check, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called per\n\
     *  iteration. If a property name or object is provided it will be used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = {\n\
     *   'barney': {  'age': 36, 'blocked': false },\n\
     *   'fred': {    'age': 40, 'blocked': true },\n\
     *   'pebbles': { 'age': 1,  'blocked': false }\n\
     * };\n\
     *\n\
     * _.findKey(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => 'barney' (property order is not guaranteed across environments)\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findKey(characters, { 'age': 1 });\n\
     * // => 'pebbles'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findKey(characters, 'blocked');\n\
     * // => 'fred'\n\
     */\n\
    function findKey(object, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      forOwn(object, function(value, key, object) {\n\
        if (callback(value, key, object)) {\n\
          result = key;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findKey` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called per\n\
     *  iteration. If a property name or object is provided it will be used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = {\n\
     *   'barney': {  'age': 36, 'blocked': true },\n\
     *   'fred': {    'age': 40, 'blocked': false },\n\
     *   'pebbles': { 'age': 1,  'blocked': true }\n\
     * };\n\
     *\n\
     * _.findLastKey(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastKey(characters, { 'age': 40 });\n\
     * // => 'fred'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastKey(characters, 'blocked');\n\
     * // => 'pebbles'\n\
     */\n\
    function findLastKey(object, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      forOwnRight(object, function(value, key, object) {\n\
        if (callback(value, key, object)) {\n\
          result = key;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over own and inherited enumerable properties of an object,\n\
     * executing the callback for each property. The callback is bound to `thisArg`\n\
     * and invoked with three arguments; (value, key, object). Callbacks may exit\n\
     * iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.move = function(x, y) {\n\
     *   this.x += x;\n\
     *   this.y += y;\n\
     * };\n\
     *\n\
     * _.forIn(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)\n\
     */\n\
    var forIn = function(collection, callback, thisArg) {\n\
      var index, iterable = collection, result = iterable;\n\
      if (!iterable) return result;\n\
      if (!objectTypes[typeof iterable]) return result;\n\
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);\n\
        for (index in iterable) {\n\
          if (callback(iterable[index], index, collection) === false) return result;\n\
        }\n\
      return result\n\
    };\n\
\n\
    /**\n\
     * This method is like `_.forIn` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.move = function(x, y) {\n\
     *   this.x += x;\n\
     *   this.y += y;\n\
     * };\n\
     *\n\
     * _.forInRight(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'\n\
     */\n\
    function forInRight(object, callback, thisArg) {\n\
      var pairs = [];\n\
\n\
      forIn(object, function(value, key) {\n\
        pairs.push(key, value);\n\
      });\n\
\n\
      var length = pairs.length;\n\
      callback = baseCreateCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        if (callback(pairs[length--], pairs[length], object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Iterates over own enumerable properties of an object, executing the callback\n\
     * for each property. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, key, object). Callbacks may exit iteration early by\n\
     * explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)\n\
     */\n\
    var forOwn = function(collection, callback, thisArg) {\n\
      var index, iterable = collection, result = iterable;\n\
      if (!iterable) return result;\n\
      if (!objectTypes[typeof iterable]) return result;\n\
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);\n\
        var ownIndex = -1,\n\
            ownProps = objectTypes[typeof iterable] && keys(iterable),\n\
            length = ownProps ? ownProps.length : 0;\n\
\n\
        while (++ownIndex < length) {\n\
          index = ownProps[ownIndex];\n\
          if (callback(iterable[index], index, collection) === false) return result;\n\
        }\n\
      return result\n\
    };\n\
\n\
    /**\n\
     * This method is like `_.forOwn` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'\n\
     */\n\
    function forOwnRight(object, callback, thisArg) {\n\
      var props = keys(object),\n\
          length = props.length;\n\
\n\
      callback = baseCreateCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        var key = props[length];\n\
        if (callback(object[key], key, object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a sorted array of property names of all enumerable properties,\n\
     * own and inherited, of `object` that have function values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias methods\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names that have function values.\n\
     * @example\n\
     *\n\
     * _.functions(_);\n\
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]\n\
     */\n\
    function functions(object) {\n\
      var result = [];\n\
      forIn(object, function(value, key) {\n\
        if (isFunction(value)) {\n\
          result.push(key);\n\
        }\n\
      });\n\
      return result.sort();\n\
    }\n\
\n\
    /**\n\
     * Checks if the specified property name exists as a direct property of `object`,\n\
     * instead of an inherited property.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @param {string} key The name of the property to check.\n\
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.\n\
     * @example\n\
     *\n\
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');\n\
     * // => true\n\
     */\n\
    function has(object, key) {\n\
      return object ? hasOwnProperty.call(object, key) : false;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of the inverted keys and values of the given object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to invert.\n\
     * @returns {Object} Returns the created inverted object.\n\
     * @example\n\
     *\n\
     * _.invert({ 'first': 'fred', 'second': 'barney' });\n\
     * // => { 'fred': 'first', 'barney': 'second' }\n\
     */\n\
    function invert(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = {};\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        result[object[key]] = key;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a boolean value.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.\n\
     * @example\n\
     *\n\
     * _.isBoolean(null);\n\
     * // => false\n\
     */\n\
    function isBoolean(value) {\n\
      return value === true || value === false ||\n\
        value && typeof value == 'object' && toString.call(value) == boolClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a date.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.\n\
     * @example\n\
     *\n\
     * _.isDate(new Date);\n\
     * // => true\n\
     */\n\
    function isDate(value) {\n\
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a DOM element.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.\n\
     * @example\n\
     *\n\
     * _.isElement(document.body);\n\
     * // => true\n\
     */\n\
    function isElement(value) {\n\
      return value && value.nodeType === 1 || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a\n\
     * length of `0` and objects with no own enumerable properties are considered\n\
     * \"empty\".\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Array|Object|string} value The value to inspect.\n\
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.\n\
     * @example\n\
     *\n\
     * _.isEmpty([1, 2, 3]);\n\
     * // => false\n\
     *\n\
     * _.isEmpty({});\n\
     * // => true\n\
     *\n\
     * _.isEmpty('');\n\
     * // => true\n\
     */\n\
    function isEmpty(value) {\n\
      var result = true;\n\
      if (!value) {\n\
        return result;\n\
      }\n\
      var className = toString.call(value),\n\
          length = value.length;\n\
\n\
      if ((className == arrayClass || className == stringClass || className == argsClass ) ||\n\
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {\n\
        return !length;\n\
      }\n\
      forOwn(value, function() {\n\
        return (result = false);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison between two values to determine if they are\n\
     * equivalent to each other. If a callback is provided it will be executed\n\
     * to compare values. If the callback returns `undefined` comparisons will\n\
     * be handled by the method instead. The callback is bound to `thisArg` and\n\
     * invoked with two arguments; (a, b).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} a The value to compare.\n\
     * @param {*} b The other value to compare.\n\
     * @param {Function} [callback] The function to customize comparing values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * var copy = { 'name': 'fred' };\n\
     *\n\
     * object == copy;\n\
     * // => false\n\
     *\n\
     * _.isEqual(object, copy);\n\
     * // => true\n\
     *\n\
     * var words = ['hello', 'goodbye'];\n\
     * var otherWords = ['hi', 'goodbye'];\n\
     *\n\
     * _.isEqual(words, otherWords, function(a, b) {\n\
     *   var reGreet = /^(?:hello|hi)$/i,\n\
     *       aGreet = _.isString(a) && reGreet.test(a),\n\
     *       bGreet = _.isString(b) && reGreet.test(b);\n\
     *\n\
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;\n\
     * });\n\
     * // => true\n\
     */\n\
    function isEqual(a, b, callback, thisArg) {\n\
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is, or can be coerced to, a finite number.\n\
     *\n\
     * Note: This is not the same as native `isFinite` which will return true for\n\
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFinite(-101);\n\
     * // => true\n\
     *\n\
     * _.isFinite('10');\n\
     * // => true\n\
     *\n\
     * _.isFinite(true);\n\
     * // => false\n\
     *\n\
     * _.isFinite('');\n\
     * // => false\n\
     *\n\
     * _.isFinite(Infinity);\n\
     * // => false\n\
     */\n\
    function isFinite(value) {\n\
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFunction(_);\n\
     * // => true\n\
     */\n\
    function isFunction(value) {\n\
      return typeof value == 'function';\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is the language type of Object.\n\
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.\n\
     * @example\n\
     *\n\
     * _.isObject({});\n\
     * // => true\n\
     *\n\
     * _.isObject([1, 2, 3]);\n\
     * // => true\n\
     *\n\
     * _.isObject(1);\n\
     * // => false\n\
     */\n\
    function isObject(value) {\n\
      // check if the value is the ECMAScript language type of Object\n\
      // http://es5.github.io/#x8\n\
      // and avoid a V8 bug\n\
      // http://code.google.com/p/v8/issues/detail?id=2291\n\
      return !!(value && objectTypes[typeof value]);\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `NaN`.\n\
     *\n\
     * Note: This is not the same as native `isNaN` which will return `true` for\n\
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNaN(NaN);\n\
     * // => true\n\
     *\n\
     * _.isNaN(new Number(NaN));\n\
     * // => true\n\
     *\n\
     * isNaN(undefined);\n\
     * // => true\n\
     *\n\
     * _.isNaN(undefined);\n\
     * // => false\n\
     */\n\
    function isNaN(value) {\n\
      // `NaN` as a primitive is the only value that is not equal to itself\n\
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)\n\
      return isNumber(value) && value != +value;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `null`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNull(null);\n\
     * // => true\n\
     *\n\
     * _.isNull(undefined);\n\
     * // => false\n\
     */\n\
    function isNull(value) {\n\
      return value === null;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a number.\n\
     *\n\
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNumber(8.4 * 5);\n\
     * // => true\n\
     */\n\
    function isNumber(value) {\n\
      return typeof value == 'number' ||\n\
        value && typeof value == 'object' && toString.call(value) == numberClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an object created by the `Object` constructor.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * _.isPlainObject(new Shape);\n\
     * // => false\n\
     *\n\
     * _.isPlainObject([1, 2, 3]);\n\
     * // => false\n\
     *\n\
     * _.isPlainObject({ 'x': 0, 'y': 0 });\n\
     * // => true\n\
     */\n\
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {\n\
      if (!(value && toString.call(value) == objectClass)) {\n\
        return false;\n\
      }\n\
      var valueOf = value.valueOf,\n\
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);\n\
\n\
      return objProto\n\
        ? (value == objProto || getPrototypeOf(value) == objProto)\n\
        : shimIsPlainObject(value);\n\
    };\n\
\n\
    /**\n\
     * Checks if `value` is a regular expression.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.\n\
     * @example\n\
     *\n\
     * _.isRegExp(/fred/);\n\
     * // => true\n\
     */\n\
    function isRegExp(value) {\n\
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a string.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.\n\
     * @example\n\
     *\n\
     * _.isString('fred');\n\
     * // => true\n\
     */\n\
    function isString(value) {\n\
      return typeof value == 'string' ||\n\
        value && typeof value == 'object' && toString.call(value) == stringClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `undefined`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isUndefined(void 0);\n\
     * // => true\n\
     */\n\
    function isUndefined(value) {\n\
      return typeof value == 'undefined';\n\
    }\n\
\n\
    /**\n\
     * Creates an object with the same keys as `object` and values generated by\n\
     * running each own enumerable property of `object` through the callback.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     *\n\
     * var characters = {\n\
     *   'fred': { 'name': 'fred', 'age': 40 },\n\
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }\n\
     * };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.mapValues(characters, 'age');\n\
     * // => { 'fred': 40, 'pebbles': 1 }\n\
     */\n\
    function mapValues(object, callback, thisArg) {\n\
      var result = {};\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      forOwn(object, function(value, key, object) {\n\
        result[key] = callback(value, key, object);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Recursively merges own enumerable properties of the source object(s), that\n\
     * don't resolve to `undefined` into the destination object. Subsequent sources\n\
     * will overwrite property assignments of previous sources. If a callback is\n\
     * provided it will be executed to produce the merged values of the destination\n\
     * and source properties. If the callback returns `undefined` merging will\n\
     * be handled by the method instead. The callback is bound to `thisArg` and\n\
     * invoked with two arguments; (objectValue, sourceValue).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param {Function} [callback] The function to customize merging properties.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * var names = {\n\
     *   'characters': [\n\
     *     { 'name': 'barney' },\n\
     *     { 'name': 'fred' }\n\
     *   ]\n\
     * };\n\
     *\n\
     * var ages = {\n\
     *   'characters': [\n\
     *     { 'age': 36 },\n\
     *     { 'age': 40 }\n\
     *   ]\n\
     * };\n\
     *\n\
     * _.merge(names, ages);\n\
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }\n\
     *\n\
     * var food = {\n\
     *   'fruits': ['apple'],\n\
     *   'vegetables': ['beet']\n\
     * };\n\
     *\n\
     * var otherFood = {\n\
     *   'fruits': ['banana'],\n\
     *   'vegetables': ['carrot']\n\
     * };\n\
     *\n\
     * _.merge(food, otherFood, function(a, b) {\n\
     *   return _.isArray(a) ? a.concat(b) : undefined;\n\
     * });\n\
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }\n\
     */\n\
    function merge(object) {\n\
      var args = arguments,\n\
          length = 2;\n\
\n\
      if (!isObject(object)) {\n\
        return object;\n\
      }\n\
      // allows working with `_.reduce` and `_.reduceRight` without using\n\
      // their `index` and `collection` arguments\n\
      if (typeof args[2] != 'number') {\n\
        length = args.length;\n\
      }\n\
      if (length > 3 && typeof args[length - 2] == 'function') {\n\
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);\n\
      } else if (length > 2 && typeof args[length - 1] == 'function') {\n\
        callback = args[--length];\n\
      }\n\
      var sources = slice(arguments, 1, length),\n\
          index = -1,\n\
          stackA = getArray(),\n\
          stackB = getArray();\n\
\n\
      while (++index < length) {\n\
        baseMerge(object, sources[index], callback, stackA, stackB);\n\
      }\n\
      releaseArray(stackA);\n\
      releaseArray(stackB);\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a shallow clone of `object` excluding the specified properties.\n\
     * Property names may be specified as individual arguments or as arrays of\n\
     * property names. If a callback is provided it will be executed for each\n\
     * property of `object` omitting the properties the callback returns truey\n\
     * for. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...string|string[]} [callback] The properties to omit or the\n\
     *  function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns an object without the omitted properties.\n\
     * @example\n\
     *\n\
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');\n\
     * // => { 'name': 'fred' }\n\
     *\n\
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {\n\
     *   return typeof value == 'number';\n\
     * });\n\
     * // => { 'name': 'fred' }\n\
     */\n\
    function omit(object, callback, thisArg) {\n\
      var result = {};\n\
      if (typeof callback != 'function') {\n\
        var props = [];\n\
        forIn(object, function(value, key) {\n\
          props.push(key);\n\
        });\n\
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));\n\
\n\
        var index = -1,\n\
            length = props.length;\n\
\n\
        while (++index < length) {\n\
          var key = props[index];\n\
          result[key] = object[key];\n\
        }\n\
      } else {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        forIn(object, function(value, key, object) {\n\
          if (!callback(value, key, object)) {\n\
            result[key] = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a two dimensional array of an object's key-value pairs,\n\
     * i.e. `[[key1, value1], [key2, value2]]`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns new array of key-value pairs.\n\
     * @example\n\
     *\n\
     * _.pairs({ 'barney': 36, 'fred': 40 });\n\
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)\n\
     */\n\
    function pairs(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        result[index] = [key, object[key]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a shallow clone of `object` composed of the specified properties.\n\
     * Property names may be specified as individual arguments or as arrays of\n\
     * property names. If a callback is provided it will be executed for each\n\
     * property of `object` picking the properties the callback returns truey\n\
     * for. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...string|string[]} [callback] The function called per\n\
     *  iteration or property names to pick, specified as individual property\n\
     *  names or arrays of property names.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns an object composed of the picked properties.\n\
     * @example\n\
     *\n\
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');\n\
     * // => { 'name': 'fred' }\n\
     *\n\
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {\n\
     *   return key.charAt(0) != '_';\n\
     * });\n\
     * // => { 'name': 'fred' }\n\
     */\n\
    function pick(object, callback, thisArg) {\n\
      var result = {};\n\
      if (typeof callback != 'function') {\n\
        var index = -1,\n\
            props = baseFlatten(arguments, true, false, 1),\n\
            length = isObject(object) ? props.length : 0;\n\
\n\
        while (++index < length) {\n\
          var key = props[index];\n\
          if (key in object) {\n\
            result[key] = object[key];\n\
          }\n\
        }\n\
      } else {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        forIn(object, function(value, key, object) {\n\
          if (callback(value, key, object)) {\n\
            result[key] = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * An alternative to `_.reduce` this method transforms `object` to a new\n\
     * `accumulator` object which is the result of running each of its own\n\
     * enumerable properties through a callback, with each callback execution\n\
     * potentially mutating the `accumulator` object. The callback is bound to\n\
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).\n\
     * Callbacks may exit iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Array|Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] The custom accumulator value.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {\n\
     *   num *= num;\n\
     *   if (num % 2) {\n\
     *     return result.push(num) < 3;\n\
     *   }\n\
     * });\n\
     * // => [1, 9, 25]\n\
     *\n\
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {\n\
     *   result[key] = num * 3;\n\
     * });\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     */\n\
    function transform(object, callback, accumulator, thisArg) {\n\
      var isArr = isArray(object);\n\
      if (accumulator == null) {\n\
        if (isArr) {\n\
          accumulator = [];\n\
        } else {\n\
          var ctor = object && object.constructor,\n\
              proto = ctor && ctor.prototype;\n\
\n\
          accumulator = baseCreate(proto);\n\
        }\n\
      }\n\
      if (callback) {\n\
        callback = lodash.createCallback(callback, thisArg, 4);\n\
        (isArr ? forEach : forOwn)(object, function(value, index, object) {\n\
          return callback(accumulator, value, index, object);\n\
        });\n\
      }\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * Creates an array composed of the own enumerable property values of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property values.\n\
     * @example\n\
     *\n\
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => [1, 2, 3] (property order is not guaranteed across environments)\n\
     */\n\
    function values(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = object[props[index]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array of elements from the specified indexes, or keys, of the\n\
     * `collection`. Indexes may be specified as individual arguments or as arrays\n\
     * of indexes.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`\n\
     *   to retrieve, specified as individual indexes or arrays of indexes.\n\
     * @returns {Array} Returns a new array of elements corresponding to the\n\
     *  provided indexes.\n\
     * @example\n\
     *\n\
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);\n\
     * // => ['a', 'c', 'e']\n\
     *\n\
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);\n\
     * // => ['fred', 'pebbles']\n\
     */\n\
    function at(collection) {\n\
      var args = arguments,\n\
          index = -1,\n\
          props = baseFlatten(args, true, false, 1),\n\
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,\n\
          result = Array(length);\n\
\n\
      while(++index < length) {\n\
        result[index] = collection[props[index]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if a given value is present in a collection using strict equality\n\
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the\n\
     * offset from the end of the collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias include\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {*} target The value to check for.\n\
     * @param {number} [fromIndex=0] The index to search from.\n\
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.\n\
     * @example\n\
     *\n\
     * _.contains([1, 2, 3], 1);\n\
     * // => true\n\
     *\n\
     * _.contains([1, 2, 3], 1, 2);\n\
     * // => false\n\
     *\n\
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');\n\
     * // => true\n\
     *\n\
     * _.contains('pebbles', 'eb');\n\
     * // => true\n\
     */\n\
    function contains(collection, target, fromIndex) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = collection ? collection.length : 0,\n\
          result = false;\n\
\n\
      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;\n\
      if (isArray(collection)) {\n\
        result = indexOf(collection, target, fromIndex) > -1;\n\
      } else if (typeof length == 'number') {\n\
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;\n\
      } else {\n\
        forOwn(collection, function(value) {\n\
          if (++index >= fromIndex) {\n\
            return !(result = value === target);\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of `collection` through the callback. The corresponding value\n\
     * of each key is the number of times the key was returned by the callback.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy(['one', 'two', 'three'], 'length');\n\
     * // => { '3': 2, '5': 1 }\n\
     */\n\
    var countBy = createAggregator(function(result, value, key) {\n\
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);\n\
    });\n\
\n\
    /**\n\
     * Checks if the given callback returns truey value for **all** elements of\n\
     * a collection. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias all\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if all elements passed the callback check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.every([true, 1, null, 'yes']);\n\
     * // => false\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.every(characters, 'age');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.every(characters, { 'age': 36 });\n\
     * // => false\n\
     */\n\
    function every(collection, callback, thisArg) {\n\
      var result = true;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      var index = -1,\n\
          length = collection ? collection.length : 0;\n\
\n\
      if (typeof length == 'number') {\n\
        while (++index < length) {\n\
          if (!(result = !!callback(collection[index], index, collection))) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        forOwn(collection, function(value, index, collection) {\n\
          return (result = !!callback(value, index, collection));\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, returning an array of all elements\n\
     * the callback returns truey for. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias select\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of elements that passed the callback check.\n\
     * @example\n\
     *\n\
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });\n\
     * // => [2, 4, 6]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.filter(characters, 'blocked');\n\
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.filter(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]\n\
     */\n\
    function filter(collection, callback, thisArg) {\n\
      var result = [];\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      var index = -1,\n\
          length = collection ? collection.length : 0;\n\
\n\
      if (typeof length == 'number') {\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (callback(value, index, collection)) {\n\
            result.push(value);\n\
          }\n\
        }\n\
      } else {\n\
        forOwn(collection, function(value, index, collection) {\n\
          if (callback(value, index, collection)) {\n\
            result.push(value);\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, returning the first element that\n\
     * the callback returns truey for. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias detect, findWhere\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': true },\n\
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }\n\
     * ];\n\
     *\n\
     * _.find(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.find(characters, { 'age': 1 });\n\
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.find(characters, 'blocked');\n\
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }\n\
     */\n\
    function find(collection, callback, thisArg) {\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      var index = -1,\n\
          length = collection ? collection.length : 0;\n\
\n\
      if (typeof length == 'number') {\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (callback(value, index, collection)) {\n\
            return value;\n\
          }\n\
        }\n\
      } else {\n\
        var result;\n\
        forOwn(collection, function(value, index, collection) {\n\
          if (callback(value, index, collection)) {\n\
            result = value;\n\
            return false;\n\
          }\n\
        });\n\
        return result;\n\
      }\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * _.findLast([1, 2, 3, 4], function(num) {\n\
     *   return num % 2 == 1;\n\
     * });\n\
     * // => 3\n\
     */\n\
    function findLast(collection, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      forEachRight(collection, function(value, index, collection) {\n\
        if (callback(value, index, collection)) {\n\
          result = value;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, executing the callback for each\n\
     * element. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection). Callbacks may exit iteration early by\n\
     * explicitly returning `false`.\n\
     *\n\
     * Note: As with other \"Collections\" methods, objects with a `length` property\n\
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`\n\
     * may be used for object iteration.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias each\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');\n\
     * // => logs each number and returns '1,2,3'\n\
     *\n\
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });\n\
     * // => logs each number and returns the object (property order is not guaranteed across environments)\n\
     */\n\
    function forEach(collection, callback, thisArg) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0;\n\
\n\
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);\n\
      if (typeof length == 'number') {\n\
        while (++index < length) {\n\
          if (callback(collection[index], index, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        forOwn(collection, callback);\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forEach` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias eachRight\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');\n\
     * // => logs each number from right to left and returns '3,2,1'\n\
     */\n\
    function forEachRight(collection, callback, thisArg) {\n\
      var length = collection ? collection.length : 0;\n\
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);\n\
      if (typeof length == 'number') {\n\
        while (length--) {\n\
          if (callback(collection[length], length, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        var props = keys(collection);\n\
        length = props.length;\n\
        forOwn(collection, function(value, key, collection) {\n\
          key = props ? props[--length] : --length;\n\
          return callback(collection[key], key, collection);\n\
        });\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of a collection through the callback. The corresponding value\n\
     * of each key is an array of the elements responsible for generating the key.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });\n\
     * // => { '4': [4.2], '6': [6.1, 6.4] }\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);\n\
     * // => { '4': [4.2], '6': [6.1, 6.4] }\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.groupBy(['one', 'two', 'three'], 'length');\n\
     * // => { '3': ['one', 'two'], '5': ['three'] }\n\
     */\n\
    var groupBy = createAggregator(function(result, value, key) {\n\
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);\n\
    });\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of the collection through the given callback. The corresponding\n\
     * value of each key is the last element responsible for generating the key.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * var keys = [\n\
     *   { 'dir': 'left', 'code': 97 },\n\
     *   { 'dir': 'right', 'code': 100 }\n\
     * ];\n\
     *\n\
     * _.indexBy(keys, 'dir');\n\
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     */\n\
    var indexBy = createAggregator(function(result, value, key) {\n\
      result[key] = value;\n\
    });\n\
\n\
    /**\n\
     * Invokes the method named by `methodName` on each element in the `collection`\n\
     * returning an array of the results of each invoked method. Additional arguments\n\
     * will be provided to each invoked method. If `methodName` is a function it\n\
     * will be invoked for, and `this` bound to, each element in the `collection`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|string} methodName The name of the method to invoke or\n\
     *  the function invoked per iteration.\n\
     * @param {...*} [arg] Arguments to invoke the method with.\n\
     * @returns {Array} Returns a new array of the results of each invoked method.\n\
     * @example\n\
     *\n\
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');\n\
     * // => [[1, 5, 7], [1, 2, 3]]\n\
     *\n\
     * _.invoke([123, 456], String.prototype.split, '');\n\
     * // => [['1', '2', '3'], ['4', '5', '6']]\n\
     */\n\
    function invoke(collection, methodName) {\n\
      var args = slice(arguments, 2),\n\
          index = -1,\n\
          isFunc = typeof methodName == 'function',\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      forEach(collection, function(value) {\n\
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of values by running each element in the collection\n\
     * through the callback. The callback is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias collect\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * _.map([1, 2, 3], function(num) { return num * 3; });\n\
     * // => [3, 6, 9]\n\
     *\n\
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });\n\
     * // => [3, 6, 9] (property order is not guaranteed across environments)\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(characters, 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function map(collection, callback, thisArg) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      if (typeof length == 'number') {\n\
        var result = Array(length);\n\
        while (++index < length) {\n\
          result[index] = callback(collection[index], index, collection);\n\
        }\n\
      } else {\n\
        result = [];\n\
        forOwn(collection, function(value, key, collection) {\n\
          result[++index] = callback(value, key, collection);\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the maximum value of a collection. If the collection is empty or\n\
     * falsey `-Infinity` is returned. If a callback is provided it will be executed\n\
     * for each value in the collection to generate the criterion by which the value\n\
     * is ranked. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the maximum value.\n\
     * @example\n\
     *\n\
     * _.max([4, 2, 8, 6]);\n\
     * // => 8\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.max(characters, function(chr) { return chr.age; });\n\
     * // => { 'name': 'fred', 'age': 40 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.max(characters, 'age');\n\
     * // => { 'name': 'fred', 'age': 40 };\n\
     */\n\
    function max(collection, callback, thisArg) {\n\
      var computed = -Infinity,\n\
          result = computed;\n\
\n\
      // allows working with functions like `_.map` without using\n\
      // their `index` argument as a callback\n\
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {\n\
        callback = null;\n\
      }\n\
      if (callback == null && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (value > result) {\n\
            result = value;\n\
          }\n\
        }\n\
      } else {\n\
        callback = (callback == null && isString(collection))\n\
          ? charAtCallback\n\
          : lodash.createCallback(callback, thisArg, 3);\n\
\n\
        forEach(collection, function(value, index, collection) {\n\
          var current = callback(value, index, collection);\n\
          if (current > computed) {\n\
            computed = current;\n\
            result = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the minimum value of a collection. If the collection is empty or\n\
     * falsey `Infinity` is returned. If a callback is provided it will be executed\n\
     * for each value in the collection to generate the criterion by which the value\n\
     * is ranked. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the minimum value.\n\
     * @example\n\
     *\n\
     * _.min([4, 2, 8, 6]);\n\
     * // => 2\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.min(characters, function(chr) { return chr.age; });\n\
     * // => { 'name': 'barney', 'age': 36 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.min(characters, 'age');\n\
     * // => { 'name': 'barney', 'age': 36 };\n\
     */\n\
    function min(collection, callback, thisArg) {\n\
      var computed = Infinity,\n\
          result = computed;\n\
\n\
      // allows working with functions like `_.map` without using\n\
      // their `index` argument as a callback\n\
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {\n\
        callback = null;\n\
      }\n\
      if (callback == null && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (value < result) {\n\
            result = value;\n\
          }\n\
        }\n\
      } else {\n\
        callback = (callback == null && isString(collection))\n\
          ? charAtCallback\n\
          : lodash.createCallback(callback, thisArg, 3);\n\
\n\
        forEach(collection, function(value, index, collection) {\n\
          var current = callback(value, index, collection);\n\
          if (current < computed) {\n\
            computed = current;\n\
            result = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the value of a specified property from all elements in the collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {string} property The name of the property to pluck.\n\
     * @returns {Array} Returns a new array of property values.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.pluck(characters, 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    var pluck = map;\n\
\n\
    /**\n\
     * Reduces a collection to a value which is the accumulated result of running\n\
     * each element in the collection through the callback, where each successive\n\
     * callback execution consumes the return value of the previous execution. If\n\
     * `accumulator` is not provided the first element of the collection will be\n\
     * used as the initial `accumulator` value. The callback is bound to `thisArg`\n\
     * and invoked with four arguments; (accumulator, value, index|key, collection).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldl, inject\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] Initial value of the accumulator.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var sum = _.reduce([1, 2, 3], function(sum, num) {\n\
     *   return sum + num;\n\
     * });\n\
     * // => 6\n\
     *\n\
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {\n\
     *   result[key] = num * 3;\n\
     *   return result;\n\
     * }, {});\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     */\n\
    function reduce(collection, callback, accumulator, thisArg) {\n\
      if (!collection) return accumulator;\n\
      var noaccum = arguments.length < 3;\n\
      callback = lodash.createCallback(callback, thisArg, 4);\n\
\n\
      var index = -1,\n\
          length = collection.length;\n\
\n\
      if (typeof length == 'number') {\n\
        if (noaccum) {\n\
          accumulator = collection[++index];\n\
        }\n\
        while (++index < length) {\n\
          accumulator = callback(accumulator, collection[index], index, collection);\n\
        }\n\
      } else {\n\
        forOwn(collection, function(value, index, collection) {\n\
          accumulator = noaccum\n\
            ? (noaccum = false, value)\n\
            : callback(accumulator, value, index, collection)\n\
        });\n\
      }\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.reduce` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldr\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] Initial value of the accumulator.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var list = [[0, 1], [2, 3], [4, 5]];\n\
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);\n\
     * // => [4, 5, 2, 3, 0, 1]\n\
     */\n\
    function reduceRight(collection, callback, accumulator, thisArg) {\n\
      var noaccum = arguments.length < 3;\n\
      callback = lodash.createCallback(callback, thisArg, 4);\n\
      forEachRight(collection, function(value, index, collection) {\n\
        accumulator = noaccum\n\
          ? (noaccum = false, value)\n\
          : callback(accumulator, value, index, collection);\n\
      });\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * The opposite of `_.filter` this method returns the elements of a\n\
     * collection that the callback does **not** return truey for.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of elements that failed the callback check.\n\
     * @example\n\
     *\n\
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });\n\
     * // => [1, 3, 5]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.reject(characters, 'blocked');\n\
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.reject(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]\n\
     */\n\
    function reject(collection, callback, thisArg) {\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      return filter(collection, function(value, index, collection) {\n\
        return !callback(value, index, collection);\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Retrieves a random element or `n` random elements from a collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to sample.\n\
     * @param {number} [n] The number of elements to sample.\n\
     * @param- {Object} [guard] Allows working with functions like `_.map`\n\
     *  without using their `index` arguments as `n`.\n\
     * @returns {Array} Returns the random sample(s) of `collection`.\n\
     * @example\n\
     *\n\
     * _.sample([1, 2, 3, 4]);\n\
     * // => 2\n\
     *\n\
     * _.sample([1, 2, 3, 4], 2);\n\
     * // => [3, 1]\n\
     */\n\
    function sample(collection, n, guard) {\n\
      if (collection && typeof collection.length != 'number') {\n\
        collection = values(collection);\n\
      }\n\
      if (n == null || guard) {\n\
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;\n\
      }\n\
      var result = shuffle(collection);\n\
      result.length = nativeMin(nativeMax(0, n), result.length);\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of shuffled values, using a version of the Fisher-Yates\n\
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to shuffle.\n\
     * @returns {Array} Returns a new shuffled collection.\n\
     * @example\n\
     *\n\
     * _.shuffle([1, 2, 3, 4, 5, 6]);\n\
     * // => [4, 1, 6, 3, 5, 2]\n\
     */\n\
    function shuffle(collection) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      forEach(collection, function(value) {\n\
        var rand = baseRandom(0, ++index);\n\
        result[index] = result[rand];\n\
        result[rand] = value;\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the size of the `collection` by returning `collection.length` for arrays\n\
     * and array-like objects or the number of own enumerable properties for objects.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to inspect.\n\
     * @returns {number} Returns `collection.length` or number of own enumerable properties.\n\
     * @example\n\
     *\n\
     * _.size([1, 2]);\n\
     * // => 2\n\
     *\n\
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => 3\n\
     *\n\
     * _.size('pebbles');\n\
     * // => 7\n\
     */\n\
    function size(collection) {\n\
      var length = collection ? collection.length : 0;\n\
      return typeof length == 'number' ? length : keys(collection).length;\n\
    }\n\
\n\
    /**\n\
     * Checks if the callback returns a truey value for **any** element of a\n\
     * collection. The function returns as soon as it finds a passing value and\n\
     * does not iterate over the entire collection. The callback is bound to\n\
     * `thisArg` and invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias any\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if any element passed the callback check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.some([null, 0, 'yes', false], Boolean);\n\
     * // => true\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.some(characters, 'blocked');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.some(characters, { 'age': 1 });\n\
     * // => false\n\
     */\n\
    function some(collection, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      var index = -1,\n\
          length = collection ? collection.length : 0;\n\
\n\
      if (typeof length == 'number') {\n\
        while (++index < length) {\n\
          if ((result = callback(collection[index], index, collection))) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        forOwn(collection, function(value, index, collection) {\n\
          return !(result = callback(value, index, collection));\n\
        });\n\
      }\n\
      return !!result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of elements, sorted in ascending order by the results of\n\
     * running each element in a collection through the callback. This method\n\
     * performs a stable sort, that is, it will preserve the original sort order\n\
     * of equal elements. The callback is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an array of property names is provided for `callback` the collection\n\
     * will be sorted by each property value.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Array|Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of sorted elements.\n\
     * @example\n\
     *\n\
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });\n\
     * // => [3, 1, 2]\n\
     *\n\
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);\n\
     * // => [3, 1, 2]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40 },\n\
     *   { 'name': 'barney',  'age': 26 },\n\
     *   { 'name': 'fred',    'age': 30 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(_.sortBy(characters, 'age'), _.values);\n\
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]\n\
     *\n\
     * // sorting by multiple properties\n\
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);\n\
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]\n\
     */\n\
    function sortBy(collection, callback, thisArg) {\n\
      var index = -1,\n\
          isArr = isArray(callback),\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      if (!isArr) {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
      }\n\
      forEach(collection, function(value, key, collection) {\n\
        var object = result[++index] = getObject();\n\
        if (isArr) {\n\
          object.criteria = map(callback, function(key) { return value[key]; });\n\
        } else {\n\
          (object.criteria = getArray())[0] = callback(value, key, collection);\n\
        }\n\
        object.index = index;\n\
        object.value = value;\n\
      });\n\
\n\
      length = result.length;\n\
      result.sort(compareAscending);\n\
      while (length--) {\n\
        var object = result[length];\n\
        result[length] = object.value;\n\
        if (!isArr) {\n\
          releaseArray(object.criteria);\n\
        }\n\
        releaseObject(object);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Converts the `collection` to an array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to convert.\n\
     * @returns {Array} Returns the new converted array.\n\
     * @example\n\
     *\n\
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);\n\
     * // => [2, 3, 4]\n\
     */\n\
    function toArray(collection) {\n\
      if (collection && typeof collection.length == 'number') {\n\
        return slice(collection);\n\
      }\n\
      return values(collection);\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison of each element in a `collection` to the given\n\
     * `properties` object, returning an array of all elements that have equivalent\n\
     * property values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Object} props The object of property values to filter by.\n\
     * @returns {Array} Returns a new array of elements that have the given properties.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },\n\
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }\n\
     * ];\n\
     *\n\
     * _.where(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]\n\
     *\n\
     * _.where(characters, { 'pets': ['dino'] });\n\
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]\n\
     */\n\
    var where = filter;\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array with all falsey values removed. The values `false`, `null`,\n\
     * `0`, `\"\"`, `undefined`, and `NaN` are all falsey.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to compact.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.compact([0, 1, false, 2, '', 3]);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function compact(array) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (value) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all values of the provided arrays using strict\n\
     * equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to process.\n\
     * @param {...Array} [values] The arrays of values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);\n\
     * // => [1, 3, 4]\n\
     */\n\
    function difference(array) {\n\
      return baseDifference(array, baseFlatten(arguments, true, true, 1));\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it returns the index of the first\n\
     * element that passes the callback check, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': true },\n\
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }\n\
     * ];\n\
     *\n\
     * _.findIndex(characters, function(chr) {\n\
     *   return chr.age < 20;\n\
     * });\n\
     * // => 2\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findIndex(characters, { 'age': 36 });\n\
     * // => 0\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findIndex(characters, 'blocked');\n\
     * // => 1\n\
     */\n\
    function findIndex(array, callback, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (++index < length) {\n\
        if (callback(array[index], index, array)) {\n\
          return index;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36, 'blocked': true },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': false },\n\
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }\n\
     * ];\n\
     *\n\
     * _.findLastIndex(characters, function(chr) {\n\
     *   return chr.age > 30;\n\
     * });\n\
     * // => 1\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastIndex(characters, { 'age': 36 });\n\
     * // => 0\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastIndex(characters, 'blocked');\n\
     * // => 2\n\
     */\n\
    function findLastIndex(array, callback, thisArg) {\n\
      var length = array ? array.length : 0;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        if (callback(array[length], length, array)) {\n\
          return length;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * Gets the first element or first `n` elements of an array. If a callback\n\
     * is provided elements at the beginning of the array are returned as long\n\
     * as the callback returns truey. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias head, take\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback] The function called\n\
     *  per element or the number of elements to return. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the first element(s) of `array`.\n\
     * @example\n\
     *\n\
     * _.first([1, 2, 3]);\n\
     * // => 1\n\
     *\n\
     * _.first([1, 2, 3], 2);\n\
     * // => [1, 2]\n\
     *\n\
     * _.first([1, 2, 3], function(num) {\n\
     *   return num < 3;\n\
     * });\n\
     * // => [1, 2]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.first(characters, 'blocked');\n\
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function first(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = -1;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (++index < length && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = callback;\n\
        if (n == null || thisArg) {\n\
          return array ? array[0] : undefined;\n\
        }\n\
      }\n\
      return slice(array, 0, nativeMin(nativeMax(0, n), length));\n\
    }\n\
\n\
    /**\n\
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`\n\
     * is truey, the array will only be flattened a single level. If a callback\n\
     * is provided each element of the array is passed through the callback before\n\
     * flattening. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new flattened array.\n\
     * @example\n\
     *\n\
     * _.flatten([1, [2], [3, [[4]]]]);\n\
     * // => [1, 2, 3, 4];\n\
     *\n\
     * _.flatten([1, [2], [3, [[4]]]], true);\n\
     * // => [1, 2, 3, [[4]]];\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },\n\
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.flatten(characters, 'pets');\n\
     * // => ['hoppy', 'baby puss', 'dino']\n\
     */\n\
    function flatten(array, isShallow, callback, thisArg) {\n\
      // juggle arguments\n\
      if (typeof isShallow != 'boolean' && isShallow != null) {\n\
        thisArg = callback;\n\
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;\n\
        isShallow = false;\n\
      }\n\
      if (callback != null) {\n\
        array = map(array, callback, thisArg);\n\
      }\n\
      return baseFlatten(array, isShallow);\n\
    }\n\
\n\
    /**\n\
     * Gets the index at which the first occurrence of `value` is found using\n\
     * strict equality for comparisons, i.e. `===`. If the array is already sorted\n\
     * providing `true` for `fromIndex` will run a faster binary search.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`\n\
     *  to perform a binary search on a sorted array.\n\
     * @returns {number} Returns the index of the matched value or `-1`.\n\
     * @example\n\
     *\n\
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);\n\
     * // => 1\n\
     *\n\
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);\n\
     * // => 4\n\
     *\n\
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);\n\
     * // => 2\n\
     */\n\
    function indexOf(array, value, fromIndex) {\n\
      if (typeof fromIndex == 'number') {\n\
        var length = array ? array.length : 0;\n\
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);\n\
      } else if (fromIndex) {\n\
        var index = sortedIndex(array, value);\n\
        return array[index] === value ? index : -1;\n\
      }\n\
      return baseIndexOf(array, value, fromIndex);\n\
    }\n\
\n\
    /**\n\
     * Gets all but the last element or last `n` elements of an array. If a\n\
     * callback is provided elements at the end of the array are excluded from\n\
     * the result as long as the callback returns truey. The callback is bound\n\
     * to `thisArg` and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback=1] The function called\n\
     *  per element or the number of elements to exclude. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a slice of `array`.\n\
     * @example\n\
     *\n\
     * _.initial([1, 2, 3]);\n\
     * // => [1, 2]\n\
     *\n\
     * _.initial([1, 2, 3], 2);\n\
     * // => [1]\n\
     *\n\
     * _.initial([1, 2, 3], function(num) {\n\
     *   return num > 1;\n\
     * });\n\
     * // => [1]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.initial(characters, 'blocked');\n\
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function initial(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = length;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (index-- && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = (callback == null || thisArg) ? 1 : callback || n;\n\
      }\n\
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values present in all provided arrays using\n\
     * strict equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of shared values.\n\
     * @example\n\
     *\n\
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);\n\
     * // => [1, 2]\n\
     */\n\
    function intersection() {\n\
      var args = [],\n\
          argsIndex = -1,\n\
          argsLength = arguments.length,\n\
          caches = getArray(),\n\
          indexOf = getIndexOf(),\n\
          trustIndexOf = indexOf === baseIndexOf,\n\
          seen = getArray();\n\
\n\
      while (++argsIndex < argsLength) {\n\
        var value = arguments[argsIndex];\n\
        if (isArray(value) || isArguments(value)) {\n\
          args.push(value);\n\
          caches.push(trustIndexOf && value.length >= largeArraySize &&\n\
            createCache(argsIndex ? args[argsIndex] : seen));\n\
        }\n\
      }\n\
      var array = args[0],\n\
          index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      outer:\n\
      while (++index < length) {\n\
        var cache = caches[0];\n\
        value = array[index];\n\
\n\
        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {\n\
          argsIndex = argsLength;\n\
          (cache || seen).push(value);\n\
          while (--argsIndex) {\n\
            cache = caches[argsIndex];\n\
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {\n\
              continue outer;\n\
            }\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      while (argsLength--) {\n\
        cache = caches[argsLength];\n\
        if (cache) {\n\
          releaseObject(cache);\n\
        }\n\
      }\n\
      releaseArray(caches);\n\
      releaseArray(seen);\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the last element or last `n` elements of an array. If a callback is\n\
     * provided elements at the end of the array are returned as long as the\n\
     * callback returns truey. The callback is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback] The function called\n\
     *  per element or the number of elements to return. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the last element(s) of `array`.\n\
     * @example\n\
     *\n\
     * _.last([1, 2, 3]);\n\
     * // => 3\n\
     *\n\
     * _.last([1, 2, 3], 2);\n\
     * // => [2, 3]\n\
     *\n\
     * _.last([1, 2, 3], function(num) {\n\
     *   return num > 1;\n\
     * });\n\
     * // => [2, 3]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.last(characters, 'blocked'), 'name');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.last(characters, { 'employer': 'na' });\n\
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]\n\
     */\n\
    function last(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = length;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (index-- && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = callback;\n\
        if (n == null || thisArg) {\n\
          return array ? array[length - 1] : undefined;\n\
        }\n\
      }\n\
      return slice(array, nativeMax(0, length - n));\n\
    }\n\
\n\
    /**\n\
     * Gets the index at which the last occurrence of `value` is found using strict\n\
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used\n\
     * as the offset from the end of the collection.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {number} [fromIndex=array.length-1] The index to search from.\n\
     * @returns {number} Returns the index of the matched value or `-1`.\n\
     * @example\n\
     *\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);\n\
     * // => 4\n\
     *\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);\n\
     * // => 1\n\
     */\n\
    function lastIndexOf(array, value, fromIndex) {\n\
      var index = array ? array.length : 0;\n\
      if (typeof fromIndex == 'number') {\n\
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;\n\
      }\n\
      while (index--) {\n\
        if (array[index] === value) {\n\
          return index;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * Removes all provided values from the given array using strict equality for\n\
     * comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to modify.\n\
     * @param {...*} [value] The values to remove.\n\
     * @returns {Array} Returns `array`.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 1, 2, 3];\n\
     * _.pull(array, 2, 3);\n\
     * console.log(array);\n\
     * // => [1, 1]\n\
     */\n\
    function pull(array) {\n\
      var args = arguments,\n\
          argsIndex = 0,\n\
          argsLength = args.length,\n\
          length = array ? array.length : 0;\n\
\n\
      while (++argsIndex < argsLength) {\n\
        var index = -1,\n\
            value = args[argsIndex];\n\
        while (++index < length) {\n\
          if (array[index] === value) {\n\
            splice.call(array, index--, 1);\n\
            length--;\n\
          }\n\
        }\n\
      }\n\
      return array;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of numbers (positive and/or negative) progressing from\n\
     * `start` up to but not including `end`. If `start` is less than `stop` a\n\
     * zero-length range is created unless a negative `step` is specified.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {number} [start=0] The start of the range.\n\
     * @param {number} end The end of the range.\n\
     * @param {number} [step=1] The value to increment or decrement by.\n\
     * @returns {Array} Returns a new range array.\n\
     * @example\n\
     *\n\
     * _.range(4);\n\
     * // => [0, 1, 2, 3]\n\
     *\n\
     * _.range(1, 5);\n\
     * // => [1, 2, 3, 4]\n\
     *\n\
     * _.range(0, 20, 5);\n\
     * // => [0, 5, 10, 15]\n\
     *\n\
     * _.range(0, -4, -1);\n\
     * // => [0, -1, -2, -3]\n\
     *\n\
     * _.range(1, 4, 0);\n\
     * // => [1, 1, 1]\n\
     *\n\
     * _.range(0);\n\
     * // => []\n\
     */\n\
    function range(start, end, step) {\n\
      start = +start || 0;\n\
      step = typeof step == 'number' ? step : (+step || 1);\n\
\n\
      if (end == null) {\n\
        end = start;\n\
        start = 0;\n\
      }\n\
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes\n\
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s\n\
      var index = -1,\n\
          length = nativeMax(0, ceil((end - start) / (step || 1))),\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = start;\n\
        start += step;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Removes all elements from an array that the callback returns truey for\n\
     * and returns an array of removed elements. The callback is bound to `thisArg`\n\
     * and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to modify.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of removed elements.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 4, 5, 6];\n\
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });\n\
     *\n\
     * console.log(array);\n\
     * // => [1, 3, 5]\n\
     *\n\
     * console.log(evens);\n\
     * // => [2, 4, 6]\n\
     */\n\
    function remove(array, callback, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (callback(value, index, array)) {\n\
          result.push(value);\n\
          splice.call(array, index--, 1);\n\
          length--;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The opposite of `_.initial` this method gets all but the first element or\n\
     * first `n` elements of an array. If a callback function is provided elements\n\
     * at the beginning of the array are excluded from the result as long as the\n\
     * callback returns truey. The callback is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias drop, tail\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback=1] The function called\n\
     *  per element or the number of elements to exclude. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a slice of `array`.\n\
     * @example\n\
     *\n\
     * _.rest([1, 2, 3]);\n\
     * // => [2, 3]\n\
     *\n\
     * _.rest([1, 2, 3], 2);\n\
     * // => [3]\n\
     *\n\
     * _.rest([1, 2, 3], function(num) {\n\
     *   return num < 3;\n\
     * });\n\
     * // => [3]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.rest(characters, 'blocked'), 'name');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.rest(characters, { 'employer': 'slate' });\n\
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]\n\
     */\n\
    function rest(array, callback, thisArg) {\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var n = 0,\n\
            index = -1,\n\
            length = array ? array.length : 0;\n\
\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (++index < length && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);\n\
      }\n\
      return slice(array, n);\n\
    }\n\
\n\
    /**\n\
     * Uses a binary search to determine the smallest index at which a value\n\
     * should be inserted into a given sorted array in order to maintain the sort\n\
     * order of the array. If a callback is provided it will be executed for\n\
     * `value` and each element of `array` to compute their sort ranking. The\n\
     * callback is bound to `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to inspect.\n\
     * @param {*} value The value to evaluate.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index at which `value` should be inserted\n\
     *  into `array`.\n\
     * @example\n\
     *\n\
     * _.sortedIndex([20, 30, 50], 40);\n\
     * // => 2\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');\n\
     * // => 2\n\
     *\n\
     * var dict = {\n\
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }\n\
     * };\n\
     *\n\
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {\n\
     *   return dict.wordToNumber[word];\n\
     * });\n\
     * // => 2\n\
     *\n\
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {\n\
     *   return this.wordToNumber[word];\n\
     * }, dict);\n\
     * // => 2\n\
     */\n\
    function sortedIndex(array, value, callback, thisArg) {\n\
      var low = 0,\n\
          high = array ? array.length : low;\n\
\n\
      // explicitly reference `identity` for better inlining in Firefox\n\
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;\n\
      value = callback(value);\n\
\n\
      while (low < high) {\n\
        var mid = (low + high) >>> 1;\n\
        (callback(array[mid]) < value)\n\
          ? low = mid + 1\n\
          : high = mid;\n\
      }\n\
      return low;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values, in order, of the provided arrays using\n\
     * strict equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of combined values.\n\
     * @example\n\
     *\n\
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);\n\
     * // => [1, 2, 3, 5, 4]\n\
     */\n\
    function union() {\n\
      return baseUniq(baseFlatten(arguments, true, true));\n\
    }\n\
\n\
    /**\n\
     * Creates a duplicate-value-free version of an array using strict equality\n\
     * for comparisons, i.e. `===`. If the array is sorted, providing\n\
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided\n\
     * each element of `array` is passed through the callback before uniqueness\n\
     * is computed. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias unique\n\
     * @category Arrays\n\
     * @param {Array} array The array to process.\n\
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a duplicate-value-free array.\n\
     * @example\n\
     *\n\
     * _.uniq([1, 2, 1, 3, 1]);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * _.uniq([1, 1, 2, 2, 3], true);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });\n\
     * // => ['A', 'b', 'C']\n\
     *\n\
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);\n\
     * // => [1, 2.5, 3]\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');\n\
     * // => [{ 'x': 1 }, { 'x': 2 }]\n\
     */\n\
    function uniq(array, isSorted, callback, thisArg) {\n\
      // juggle arguments\n\
      if (typeof isSorted != 'boolean' && isSorted != null) {\n\
        thisArg = callback;\n\
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;\n\
        isSorted = false;\n\
      }\n\
      if (callback != null) {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
      }\n\
      return baseUniq(array, isSorted, callback);\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all provided values using strict equality for\n\
     * comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to filter.\n\
     * @param {...*} [value] The values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);\n\
     * // => [2, 3, 4]\n\
     */\n\
    function without(array) {\n\
      return baseDifference(array, slice(arguments, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates an array that is the symmetric difference of the provided arrays.\n\
     * See http://en.wikipedia.org/wiki/Symmetric_difference.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of values.\n\
     * @example\n\
     *\n\
     * _.xor([1, 2, 3], [5, 2, 1, 4]);\n\
     * // => [3, 5, 4]\n\
     *\n\
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);\n\
     * // => [1, 4, 5]\n\
     */\n\
    function xor() {\n\
      var index = -1,\n\
          length = arguments.length;\n\
\n\
      while (++index < length) {\n\
        var array = arguments[index];\n\
        if (isArray(array) || isArguments(array)) {\n\
          var result = result\n\
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))\n\
            : array;\n\
        }\n\
      }\n\
      return result || [];\n\
    }\n\
\n\
    /**\n\
     * Creates an array of grouped elements, the first of which contains the first\n\
     * elements of the given arrays, the second of which contains the second\n\
     * elements of the given arrays, and so on.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias unzip\n\
     * @category Arrays\n\
     * @param {...Array} [array] Arrays to process.\n\
     * @returns {Array} Returns a new array of grouped elements.\n\
     * @example\n\
     *\n\
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);\n\
     * // => [['fred', 30, true], ['barney', 40, false]]\n\
     */\n\
    function zip() {\n\
      var array = arguments.length > 1 ? arguments : arguments[0],\n\
          index = -1,\n\
          length = array ? max(pluck(array, 'length')) : 0,\n\
          result = Array(length < 0 ? 0 : length);\n\
\n\
      while (++index < length) {\n\
        result[index] = pluck(array, index);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed from arrays of `keys` and `values`. Provide\n\
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`\n\
     * or two arrays, one of `keys` and one of corresponding `values`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias object\n\
     * @category Arrays\n\
     * @param {Array} keys The array of keys.\n\
     * @param {Array} [values=[]] The array of values.\n\
     * @returns {Object} Returns an object composed of the given keys and\n\
     *  corresponding values.\n\
     * @example\n\
     *\n\
     * _.zipObject(['fred', 'barney'], [30, 40]);\n\
     * // => { 'fred': 30, 'barney': 40 }\n\
     */\n\
    function zipObject(keys, values) {\n\
      var index = -1,\n\
          length = keys ? keys.length : 0,\n\
          result = {};\n\
\n\
      if (!values && length && !isArray(keys[0])) {\n\
        values = [];\n\
      }\n\
      while (++index < length) {\n\
        var key = keys[index];\n\
        if (values) {\n\
          result[key] = values[index];\n\
        } else if (key) {\n\
          result[key[0]] = key[1];\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a function that executes `func`, with  the `this` binding and\n\
     * arguments of the created function, only after being called `n` times.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {number} n The number of times the function must be called before\n\
     *  `func` is executed.\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var saves = ['profile', 'settings'];\n\
     *\n\
     * var done = _.after(saves.length, function() {\n\
     *   console.log('Done saving!');\n\
     * });\n\
     *\n\
     * _.forEach(saves, function(type) {\n\
     *   asyncSave({ 'type': type, 'complete': done });\n\
     * });\n\
     * // => logs 'Done saving!', after all saves have completed\n\
     */\n\
    function after(n, func) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      return function() {\n\
        if (--n < 1) {\n\
          return func.apply(this, arguments);\n\
        }\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes `func` with the `this`\n\
     * binding of `thisArg` and prepends any additional `bind` arguments to those\n\
     * provided to the bound function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to bind.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var func = function(greeting) {\n\
     *   return greeting + ' ' + this.name;\n\
     * };\n\
     *\n\
     * func = _.bind(func, { 'name': 'fred' }, 'hi');\n\
     * func();\n\
     * // => 'hi fred'\n\
     */\n\
    function bind(func, thisArg) {\n\
      return arguments.length > 2\n\
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)\n\
        : createWrapper(func, 1, null, null, thisArg);\n\
    }\n\
\n\
    /**\n\
     * Binds methods of an object to the object itself, overwriting the existing\n\
     * method. Method names may be specified as individual arguments or as arrays\n\
     * of method names. If no method names are provided all the function properties\n\
     * of `object` will be bound.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Object} object The object to bind and assign the bound methods to.\n\
     * @param {...string} [methodName] The object method names to\n\
     *  bind, specified as individual method names or arrays of method names.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * var view = {\n\
     *   'label': 'docs',\n\
     *   'onClick': function() { console.log('clicked ' + this.label); }\n\
     * };\n\
     *\n\
     * _.bindAll(view);\n\
     * jQuery('#docs').on('click', view.onClick);\n\
     * // => logs 'clicked docs', when the button is clicked\n\
     */\n\
    function bindAll(object) {\n\
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),\n\
          index = -1,\n\
          length = funcs.length;\n\
\n\
      while (++index < length) {\n\
        var key = funcs[index];\n\
        object[key] = createWrapper(object[key], 1, null, null, object);\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes the method at `object[key]`\n\
     * and prepends any additional `bindKey` arguments to those provided to the bound\n\
     * function. This method differs from `_.bind` by allowing bound functions to\n\
     * reference methods that will be redefined or don't yet exist.\n\
     * See http://michaux.ca/articles/lazy-function-definition-pattern.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Object} object The object the method belongs to.\n\
     * @param {string} key The key of the method.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'name': 'fred',\n\
     *   'greet': function(greeting) {\n\
     *     return greeting + ' ' + this.name;\n\
     *   }\n\
     * };\n\
     *\n\
     * var func = _.bindKey(object, 'greet', 'hi');\n\
     * func();\n\
     * // => 'hi fred'\n\
     *\n\
     * object.greet = function(greeting) {\n\
     *   return greeting + 'ya ' + this.name + '!';\n\
     * };\n\
     *\n\
     * func();\n\
     * // => 'hiya fred!'\n\
     */\n\
    function bindKey(object, key) {\n\
      return arguments.length > 2\n\
        ? createWrapper(key, 19, slice(arguments, 2), null, object)\n\
        : createWrapper(key, 3, null, null, object);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that is the composition of the provided functions,\n\
     * where each function consumes the return value of the function that follows.\n\
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.\n\
     * Each function is executed with the `this` binding of the composed function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {...Function} [func] Functions to compose.\n\
     * @returns {Function} Returns the new composed function.\n\
     * @example\n\
     *\n\
     * var realNameMap = {\n\
     *   'pebbles': 'penelope'\n\
     * };\n\
     *\n\
     * var format = function(name) {\n\
     *   name = realNameMap[name.toLowerCase()] || name;\n\
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();\n\
     * };\n\
     *\n\
     * var greet = function(formatted) {\n\
     *   return 'Hiya ' + formatted + '!';\n\
     * };\n\
     *\n\
     * var welcome = _.compose(greet, format);\n\
     * welcome('pebbles');\n\
     * // => 'Hiya Penelope!'\n\
     */\n\
    function compose() {\n\
      var funcs = arguments,\n\
          length = funcs.length;\n\
\n\
      while (length--) {\n\
        if (!isFunction(funcs[length])) {\n\
          throw new TypeError;\n\
        }\n\
      }\n\
      return function() {\n\
        var args = arguments,\n\
            length = funcs.length;\n\
\n\
        while (length--) {\n\
          args = [funcs[length].apply(this, args)];\n\
        }\n\
        return args[0];\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function which accepts one or more arguments of `func` that when\n\
     * invoked either executes `func` returning its result, if all `func` arguments\n\
     * have been provided, or returns a function that accepts one or more of the\n\
     * remaining `func` arguments, and so on. The arity of `func` can be specified\n\
     * if `func.length` is not sufficient.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to curry.\n\
     * @param {number} [arity=func.length] The arity of `func`.\n\
     * @returns {Function} Returns the new curried function.\n\
     * @example\n\
     *\n\
     * var curried = _.curry(function(a, b, c) {\n\
     *   console.log(a + b + c);\n\
     * });\n\
     *\n\
     * curried(1)(2)(3);\n\
     * // => 6\n\
     *\n\
     * curried(1, 2)(3);\n\
     * // => 6\n\
     *\n\
     * curried(1, 2, 3);\n\
     * // => 6\n\
     */\n\
    function curry(func, arity) {\n\
      arity = typeof arity == 'number' ? arity : (+arity || func.length);\n\
      return createWrapper(func, 4, null, null, null, arity);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that will delay the execution of `func` until after\n\
     * `wait` milliseconds have elapsed since the last time it was invoked.\n\
     * Provide an options object to indicate that `func` should be invoked on\n\
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls\n\
     * to the debounced function will return the result of the last `func` call.\n\
     *\n\
     * Note: If `leading` and `trailing` options are `true` `func` will be called\n\
     * on the trailing edge of the timeout only if the the debounced function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to debounce.\n\
     * @param {number} wait The number of milliseconds to delay.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.\n\
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.\n\
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.\n\
     * @returns {Function} Returns the new debounced function.\n\
     * @example\n\
     *\n\
     * // avoid costly calculations while the window size is in flux\n\
     * var lazyLayout = _.debounce(calculateLayout, 150);\n\
     * jQuery(window).on('resize', lazyLayout);\n\
     *\n\
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls\n\
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {\n\
     *   'leading': true,\n\
     *   'trailing': false\n\
     * });\n\
     *\n\
     * // ensure `batchLog` is executed once after 1 second of debounced calls\n\
     * var source = new EventSource('/stream');\n\
     * source.addEventListener('message', _.debounce(batchLog, 250, {\n\
     *   'maxWait': 1000\n\
     * }, false);\n\
     */\n\
    function debounce(func, wait, options) {\n\
      var args,\n\
          maxTimeoutId,\n\
          result,\n\
          stamp,\n\
          thisArg,\n\
          timeoutId,\n\
          trailingCall,\n\
          lastCalled = 0,\n\
          maxWait = false,\n\
          trailing = true;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      wait = nativeMax(0, wait) || 0;\n\
      if (options === true) {\n\
        var leading = true;\n\
        trailing = false;\n\
      } else if (isObject(options)) {\n\
        leading = options.leading;\n\
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);\n\
        trailing = 'trailing' in options ? options.trailing : trailing;\n\
      }\n\
      var delayed = function() {\n\
        var remaining = wait - (now() - stamp);\n\
        if (remaining <= 0) {\n\
          if (maxTimeoutId) {\n\
            clearTimeout(maxTimeoutId);\n\
          }\n\
          var isCalled = trailingCall;\n\
          maxTimeoutId = timeoutId = trailingCall = undefined;\n\
          if (isCalled) {\n\
            lastCalled = now();\n\
            result = func.apply(thisArg, args);\n\
            if (!timeoutId && !maxTimeoutId) {\n\
              args = thisArg = null;\n\
            }\n\
          }\n\
        } else {\n\
          timeoutId = setTimeout(delayed, remaining);\n\
        }\n\
      };\n\
\n\
      var maxDelayed = function() {\n\
        if (timeoutId) {\n\
          clearTimeout(timeoutId);\n\
        }\n\
        maxTimeoutId = timeoutId = trailingCall = undefined;\n\
        if (trailing || (maxWait !== wait)) {\n\
          lastCalled = now();\n\
          result = func.apply(thisArg, args);\n\
          if (!timeoutId && !maxTimeoutId) {\n\
            args = thisArg = null;\n\
          }\n\
        }\n\
      };\n\
\n\
      return function() {\n\
        args = arguments;\n\
        stamp = now();\n\
        thisArg = this;\n\
        trailingCall = trailing && (timeoutId || !leading);\n\
\n\
        if (maxWait === false) {\n\
          var leadingCall = leading && !timeoutId;\n\
        } else {\n\
          if (!maxTimeoutId && !leading) {\n\
            lastCalled = stamp;\n\
          }\n\
          var remaining = maxWait - (stamp - lastCalled),\n\
              isCalled = remaining <= 0;\n\
\n\
          if (isCalled) {\n\
            if (maxTimeoutId) {\n\
              maxTimeoutId = clearTimeout(maxTimeoutId);\n\
            }\n\
            lastCalled = stamp;\n\
            result = func.apply(thisArg, args);\n\
          }\n\
          else if (!maxTimeoutId) {\n\
            maxTimeoutId = setTimeout(maxDelayed, remaining);\n\
          }\n\
        }\n\
        if (isCalled && timeoutId) {\n\
          timeoutId = clearTimeout(timeoutId);\n\
        }\n\
        else if (!timeoutId && wait !== maxWait) {\n\
          timeoutId = setTimeout(delayed, wait);\n\
        }\n\
        if (leadingCall) {\n\
          isCalled = true;\n\
          result = func.apply(thisArg, args);\n\
        }\n\
        if (isCalled && !timeoutId && !maxTimeoutId) {\n\
          args = thisArg = null;\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Defers executing the `func` function until the current call stack has cleared.\n\
     * Additional arguments will be provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to defer.\n\
     * @param {...*} [arg] Arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * _.defer(function(text) { console.log(text); }, 'deferred');\n\
     * // logs 'deferred' after one or more milliseconds\n\
     */\n\
    function defer(func) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var args = slice(arguments, 1);\n\
      return setTimeout(function() { func.apply(undefined, args); }, 1);\n\
    }\n\
\n\
    /**\n\
     * Executes the `func` function after `wait` milliseconds. Additional arguments\n\
     * will be provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to delay.\n\
     * @param {number} wait The number of milliseconds to delay execution.\n\
     * @param {...*} [arg] Arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * _.delay(function(text) { console.log(text); }, 1000, 'later');\n\
     * // => logs 'later' after one second\n\
     */\n\
    function delay(func, wait) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var args = slice(arguments, 2);\n\
      return setTimeout(function() { func.apply(undefined, args); }, wait);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that memoizes the result of `func`. If `resolver` is\n\
     * provided it will be used to determine the cache key for storing the result\n\
     * based on the arguments provided to the memoized function. By default, the\n\
     * first argument provided to the memoized function is used as the cache key.\n\
     * The `func` is executed with the `this` binding of the memoized function.\n\
     * The result cache is exposed as the `cache` property on the memoized function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to have its output memoized.\n\
     * @param {Function} [resolver] A function used to resolve the cache key.\n\
     * @returns {Function} Returns the new memoizing function.\n\
     * @example\n\
     *\n\
     * var fibonacci = _.memoize(function(n) {\n\
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);\n\
     * });\n\
     *\n\
     * fibonacci(9)\n\
     * // => 34\n\
     *\n\
     * var data = {\n\
     *   'fred': { 'name': 'fred', 'age': 40 },\n\
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }\n\
     * };\n\
     *\n\
     * // modifying the result cache\n\
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);\n\
     * get('pebbles');\n\
     * // => { 'name': 'pebbles', 'age': 1 }\n\
     *\n\
     * get.cache.pebbles.name = 'penelope';\n\
     * get('pebbles');\n\
     * // => { 'name': 'penelope', 'age': 1 }\n\
     */\n\
    function memoize(func, resolver) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var memoized = function() {\n\
        var cache = memoized.cache,\n\
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];\n\
\n\
        return hasOwnProperty.call(cache, key)\n\
          ? cache[key]\n\
          : (cache[key] = func.apply(this, arguments));\n\
      }\n\
      memoized.cache = {};\n\
      return memoized;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that is restricted to execute `func` once. Repeat calls to\n\
     * the function will return the value of the first call. The `func` is executed\n\
     * with the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var initialize = _.once(createApplication);\n\
     * initialize();\n\
     * initialize();\n\
     * // `initialize` executes `createApplication` once\n\
     */\n\
    function once(func) {\n\
      var ran,\n\
          result;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      return function() {\n\
        if (ran) {\n\
          return result;\n\
        }\n\
        ran = true;\n\
        result = func.apply(this, arguments);\n\
\n\
        // clear the `func` variable so the function may be garbage collected\n\
        func = null;\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes `func` with any additional\n\
     * `partial` arguments prepended to those provided to the new function. This\n\
     * method is similar to `_.bind` except it does **not** alter the `this` binding.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var greet = function(greeting, name) { return greeting + ' ' + name; };\n\
     * var hi = _.partial(greet, 'hi');\n\
     * hi('fred');\n\
     * // => 'hi fred'\n\
     */\n\
    function partial(func) {\n\
      return createWrapper(func, 16, slice(arguments, 1));\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.partial` except that `partial` arguments are\n\
     * appended to those provided to the new function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);\n\
     *\n\
     * var options = {\n\
     *   'variable': 'data',\n\
     *   'imports': { 'jq': $ }\n\
     * };\n\
     *\n\
     * defaultsDeep(options, _.templateSettings);\n\
     *\n\
     * options.variable\n\
     * // => 'data'\n\
     *\n\
     * options.imports\n\
     * // => { '_': _, 'jq': $ }\n\
     */\n\
    function partialRight(func) {\n\
      return createWrapper(func, 32, null, slice(arguments, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when executed, will only call the `func` function\n\
     * at most once per every `wait` milliseconds. Provide an options object to\n\
     * indicate that `func` should be invoked on the leading and/or trailing edge\n\
     * of the `wait` timeout. Subsequent calls to the throttled function will\n\
     * return the result of the last `func` call.\n\
     *\n\
     * Note: If `leading` and `trailing` options are `true` `func` will be called\n\
     * on the trailing edge of the timeout only if the the throttled function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to throttle.\n\
     * @param {number} wait The number of milliseconds to throttle executions to.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.\n\
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.\n\
     * @returns {Function} Returns the new throttled function.\n\
     * @example\n\
     *\n\
     * // avoid excessively updating the position while scrolling\n\
     * var throttled = _.throttle(updatePosition, 100);\n\
     * jQuery(window).on('scroll', throttled);\n\
     *\n\
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes\n\
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {\n\
     *   'trailing': false\n\
     * }));\n\
     */\n\
    function throttle(func, wait, options) {\n\
      var leading = true,\n\
          trailing = true;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      if (options === false) {\n\
        leading = false;\n\
      } else if (isObject(options)) {\n\
        leading = 'leading' in options ? options.leading : leading;\n\
        trailing = 'trailing' in options ? options.trailing : trailing;\n\
      }\n\
      debounceOptions.leading = leading;\n\
      debounceOptions.maxWait = wait;\n\
      debounceOptions.trailing = trailing;\n\
\n\
      return debounce(func, wait, debounceOptions);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that provides `value` to the wrapper function as its\n\
     * first argument. Additional arguments provided to the function are appended\n\
     * to those provided to the wrapper function. The wrapper is executed with\n\
     * the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {*} value The value to wrap.\n\
     * @param {Function} wrapper The wrapper function.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var p = _.wrap(_.escape, function(func, text) {\n\
     *   return '<p>' + func(text) + '</p>';\n\
     * });\n\
     *\n\
     * p('Fred, Wilma, & Pebbles');\n\
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'\n\
     */\n\
    function wrap(value, wrapper) {\n\
      return createWrapper(wrapper, 16, [value]);\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a function that returns `value`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {*} value The value to return from the new function.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * var getter = _.constant(object);\n\
     * getter() === object;\n\
     * // => true\n\
     */\n\
    function constant(value) {\n\
      return function() {\n\
        return value;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Produces a callback bound to an optional `thisArg`. If `func` is a property\n\
     * name the created callback will return the property value for a given element.\n\
     * If `func` is an object the created callback will return `true` for elements\n\
     * that contain the equivalent object properties, otherwise it will return `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {*} [func=identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param {number} [argCount] The number of arguments the callback accepts.\n\
     * @returns {Function} Returns a callback function.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // wrap to create custom callback shorthands\n\
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {\n\
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);\n\
     *   return !match ? func(callback, thisArg) : function(object) {\n\
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];\n\
     *   };\n\
     * });\n\
     *\n\
     * _.filter(characters, 'age__gt38');\n\
     * // => [{ 'name': 'fred', 'age': 40 }]\n\
     */\n\
    function createCallback(func, thisArg, argCount) {\n\
      var type = typeof func;\n\
      if (func == null || type == 'function') {\n\
        return baseCreateCallback(func, thisArg, argCount);\n\
      }\n\
      // handle \"_.pluck\" style callback shorthands\n\
      if (type != 'object') {\n\
        return property(func);\n\
      }\n\
      var props = keys(func),\n\
          key = props[0],\n\
          a = func[key];\n\
\n\
      // handle \"_.where\" style callback shorthands\n\
      if (props.length == 1 && a === a && !isObject(a)) {\n\
        // fast path the common case of providing an object with a single\n\
        // property containing a primitive value\n\
        return function(object) {\n\
          var b = object[key];\n\
          return a === b && (a !== 0 || (1 / a == 1 / b));\n\
        };\n\
      }\n\
      return function(object) {\n\
        var length = props.length,\n\
            result = false;\n\
\n\
        while (length--) {\n\
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {\n\
            break;\n\
          }\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Converts the characters `&`, `<`, `>`, `\"`, and `'` in `string` to their\n\
     * corresponding HTML entities.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} string The string to escape.\n\
     * @returns {string} Returns the escaped string.\n\
     * @example\n\
     *\n\
     * _.escape('Fred, Wilma, & Pebbles');\n\
     * // => 'Fred, Wilma, &amp; Pebbles'\n\
     */\n\
    function escape(string) {\n\
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);\n\
    }\n\
\n\
    /**\n\
     * This method returns the first argument provided to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {*} value Any value.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * _.identity(object) === object;\n\
     * // => true\n\
     */\n\
    function identity(value) {\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Adds function properties of a source object to the destination object.\n\
     * If `object` is a function methods will be added to its prototype as well.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {Function|Object} [object=lodash] object The destination object.\n\
     * @param {Object} source The object of functions to add.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.\n\
     * @example\n\
     *\n\
     * function capitalize(string) {\n\
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();\n\
     * }\n\
     *\n\
     * _.mixin({ 'capitalize': capitalize });\n\
     * _.capitalize('fred');\n\
     * // => 'Fred'\n\
     *\n\
     * _('fred').capitalize().value();\n\
     * // => 'Fred'\n\
     *\n\
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });\n\
     * _('fred').capitalize();\n\
     * // => 'Fred'\n\
     */\n\
    function mixin(object, source, options) {\n\
      var chain = true,\n\
          methodNames = source && functions(source);\n\
\n\
      if (!source || (!options && !methodNames.length)) {\n\
        if (options == null) {\n\
          options = source;\n\
        }\n\
        ctor = lodashWrapper;\n\
        source = object;\n\
        object = lodash;\n\
        methodNames = functions(source);\n\
      }\n\
      if (options === false) {\n\
        chain = false;\n\
      } else if (isObject(options) && 'chain' in options) {\n\
        chain = options.chain;\n\
      }\n\
      var ctor = object,\n\
          isFunc = isFunction(ctor);\n\
\n\
      forEach(methodNames, function(methodName) {\n\
        var func = object[methodName] = source[methodName];\n\
        if (isFunc) {\n\
          ctor.prototype[methodName] = function() {\n\
            var chainAll = this.__chain__,\n\
                value = this.__wrapped__,\n\
                args = [value];\n\
\n\
            push.apply(args, arguments);\n\
            var result = func.apply(object, args);\n\
            if (chain || chainAll) {\n\
              if (value === result && isObject(result)) {\n\
                return this;\n\
              }\n\
              result = new ctor(result);\n\
              result.__chain__ = chainAll;\n\
            }\n\
            return result;\n\
          };\n\
        }\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Reverts the '_' variable to its previous value and returns a reference to\n\
     * the `lodash` function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @returns {Function} Returns the `lodash` function.\n\
     * @example\n\
     *\n\
     * var lodash = _.noConflict();\n\
     */\n\
    function noConflict() {\n\
      context._ = oldDash;\n\
      return this;\n\
    }\n\
\n\
    /**\n\
     * A no-operation function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * _.noop(object) === undefined;\n\
     * // => true\n\
     */\n\
    function noop() {\n\
      // no operation performed\n\
    }\n\
\n\
    /**\n\
     * Gets the number of milliseconds that have elapsed since the Unix epoch\n\
     * (1 January 1970 00:00:00 UTC).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @example\n\
     *\n\
     * var stamp = _.now();\n\
     * _.defer(function() { console.log(_.now() - stamp); });\n\
     * // => logs the number of milliseconds it took for the deferred function to be called\n\
     */\n\
    var now = isNative(now = Date.now) && now || function() {\n\
      return new Date().getTime();\n\
    };\n\
\n\
    /**\n\
     * Converts the given value into an integer of the specified radix.\n\
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the\n\
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.\n\
     *\n\
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`\n\
     * implementations. See http://es5.github.io/#E.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} value The value to parse.\n\
     * @param {number} [radix] The radix used to interpret the value to parse.\n\
     * @returns {number} Returns the new integer value.\n\
     * @example\n\
     *\n\
     * _.parseInt('08');\n\
     * // => 8\n\
     */\n\
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {\n\
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`\n\
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);\n\
    };\n\
\n\
    /**\n\
     * Creates a \"_.pluck\" style function, which returns the `key` value of a\n\
     * given object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} key The name of the property to retrieve.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'fred',   'age': 40 },\n\
     *   { 'name': 'barney', 'age': 36 }\n\
     * ];\n\
     *\n\
     * var getName = _.property('name');\n\
     *\n\
     * _.map(characters, getName);\n\
     * // => ['barney', 'fred']\n\
     *\n\
     * _.sortBy(characters, getName);\n\
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]\n\
     */\n\
    function property(key) {\n\
      return function(object) {\n\
        return object[key];\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Produces a random number between `min` and `max` (inclusive). If only one\n\
     * argument is provided a number between `0` and the given number will be\n\
     * returned. If `floating` is truey or either `min` or `max` are floats a\n\
     * floating-point number will be returned instead of an integer.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {number} [min=0] The minimum possible value.\n\
     * @param {number} [max=1] The maximum possible value.\n\
     * @param {boolean} [floating=false] Specify returning a floating-point number.\n\
     * @returns {number} Returns a random number.\n\
     * @example\n\
     *\n\
     * _.random(0, 5);\n\
     * // => an integer between 0 and 5\n\
     *\n\
     * _.random(5);\n\
     * // => also an integer between 0 and 5\n\
     *\n\
     * _.random(5, true);\n\
     * // => a floating-point number between 0 and 5\n\
     *\n\
     * _.random(1.2, 5.2);\n\
     * // => a floating-point number between 1.2 and 5.2\n\
     */\n\
    function random(min, max, floating) {\n\
      var noMin = min == null,\n\
          noMax = max == null;\n\
\n\
      if (floating == null) {\n\
        if (typeof min == 'boolean' && noMax) {\n\
          floating = min;\n\
          min = 1;\n\
        }\n\
        else if (!noMax && typeof max == 'boolean') {\n\
          floating = max;\n\
          noMax = true;\n\
        }\n\
      }\n\
      if (noMin && noMax) {\n\
        max = 1;\n\
      }\n\
      min = +min || 0;\n\
      if (noMax) {\n\
        max = min;\n\
        min = 0;\n\
      } else {\n\
        max = +max || 0;\n\
      }\n\
      if (floating || min % 1 || max % 1) {\n\
        var rand = nativeRandom();\n\
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);\n\
      }\n\
      return baseRandom(min, max);\n\
    }\n\
\n\
    /**\n\
     * Resolves the value of property `key` on `object`. If `key` is a function\n\
     * it will be invoked with the `this` binding of `object` and its result returned,\n\
     * else the property value is returned. If `object` is falsey then `undefined`\n\
     * is returned.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {Object} object The object to inspect.\n\
     * @param {string} key The name of the property to resolve.\n\
     * @returns {*} Returns the resolved value.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'cheese': 'crumpets',\n\
     *   'stuff': function() {\n\
     *     return 'nonsense';\n\
     *   }\n\
     * };\n\
     *\n\
     * _.result(object, 'cheese');\n\
     * // => 'crumpets'\n\
     *\n\
     * _.result(object, 'stuff');\n\
     * // => 'nonsense'\n\
     */\n\
    function result(object, key) {\n\
      if (object) {\n\
        var value = object[key];\n\
        return isFunction(value) ? object[key]() : value;\n\
      }\n\
    }\n\
\n\
    /**\n\
     * A micro-templating method that handles arbitrary delimiters, preserves\n\
     * whitespace, and correctly escapes quotes within interpolated code.\n\
     *\n\
     * Note: In the development build, `_.template` utilizes sourceURLs for easier\n\
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl\n\
     *\n\
     * For more information on precompiling templates see:\n\
     * http://lodash.com/custom-builds\n\
     *\n\
     * For more information on Chrome extension sandboxes see:\n\
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} text The template text.\n\
     * @param {Object} data The data object used to populate the text.\n\
     * @param {Object} [options] The options object.\n\
     * @param {RegExp} [options.escape] The \"escape\" delimiter.\n\
     * @param {RegExp} [options.evaluate] The \"evaluate\" delimiter.\n\
     * @param {Object} [options.imports] An object to import into the template as local variables.\n\
     * @param {RegExp} [options.interpolate] The \"interpolate\" delimiter.\n\
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.\n\
     * @param {string} [variable] The data object variable name.\n\
     * @returns {Function|string} Returns a compiled function when no `data` object\n\
     *  is given, else it returns the interpolated text.\n\
     * @example\n\
     *\n\
     * // using the \"interpolate\" delimiter to create a compiled template\n\
     * var compiled = _.template('hello <%= name %>');\n\
     * compiled({ 'name': 'fred' });\n\
     * // => 'hello fred'\n\
     *\n\
     * // using the \"escape\" delimiter to escape HTML in data property values\n\
     * _.template('<b><%- value %></b>', { 'value': '<script>' });\n\
     * // => '<b>&lt;script&gt;</b>'\n\
     *\n\
     * // using the \"evaluate\" delimiter to generate HTML\n\
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';\n\
     * _.template(list, { 'people': ['fred', 'barney'] });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the ES6 delimiter as an alternative to the default \"interpolate\" delimiter\n\
     * _.template('hello ${ name }', { 'name': 'pebbles' });\n\
     * // => 'hello pebbles'\n\
     *\n\
     * // using the internal `print` function in \"evaluate\" delimiters\n\
     * _.template('<% print(\"hello \" + name); %>!', { 'name': 'barney' });\n\
     * // => 'hello barney!'\n\
     *\n\
     * // using a custom template delimiters\n\
     * _.templateSettings = {\n\
     *   'interpolate': /{{([\\s\\S]+?)}}/g\n\
     * };\n\
     *\n\
     * _.template('hello {{ name }}!', { 'name': 'mustache' });\n\
     * // => 'hello mustache!'\n\
     *\n\
     * // using the `imports` option to import jQuery\n\
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';\n\
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the `sourceURL` option to specify a custom sourceURL for the template\n\
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });\n\
     * compiled(data);\n\
     * // => find the source of \"greeting.jst\" under the Sources tab or Resources panel of the web inspector\n\
     *\n\
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template\n\
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });\n\
     * compiled.source;\n\
     * // => function(data) {\n\
     *   var __t, __p = '', __e = _.escape;\n\
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';\n\
     *   return __p;\n\
     * }\n\
     *\n\
     * // using the `source` property to inline compiled templates for meaningful\n\
     * // line numbers in error messages and a stack trace\n\
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\\\n\
     *   var JST = {\\\n\
     *     \"main\": ' + _.template(mainText).source + '\\\n\
     *   };\\\n\
     * ');\n\
     */\n\
    function template(text, data, options) {\n\
      // based on John Resig's `tmpl` implementation\n\
      // http://ejohn.org/blog/javascript-micro-templating/\n\
      // and Laura Doktorova's doT.js\n\
      // https://github.com/olado/doT\n\
      var settings = lodash.templateSettings;\n\
      text = String(text || '');\n\
\n\
      // avoid missing dependencies when `iteratorTemplate` is not defined\n\
      options = defaults({}, options, settings);\n\
\n\
      var imports = defaults({}, options.imports, settings.imports),\n\
          importsKeys = keys(imports),\n\
          importsValues = values(imports);\n\
\n\
      var isEvaluating,\n\
          index = 0,\n\
          interpolate = options.interpolate || reNoMatch,\n\
          source = \"__p += '\";\n\
\n\
      // compile the regexp to match each delimiter\n\
      var reDelimiters = RegExp(\n\
        (options.escape || reNoMatch).source + '|' +\n\
        interpolate.source + '|' +\n\
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +\n\
        (options.evaluate || reNoMatch).source + '|$'\n\
      , 'g');\n\
\n\
      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {\n\
        interpolateValue || (interpolateValue = esTemplateValue);\n\
\n\
        // escape characters that cannot be included in string literals\n\
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);\n\
\n\
        // replace delimiters with snippets\n\
        if (escapeValue) {\n\
          source += \"' +\\n\
__e(\" + escapeValue + \") +\\n\
'\";\n\
        }\n\
        if (evaluateValue) {\n\
          isEvaluating = true;\n\
          source += \"';\\n\
\" + evaluateValue + \";\\n\
__p += '\";\n\
        }\n\
        if (interpolateValue) {\n\
          source += \"' +\\n\
((__t = (\" + interpolateValue + \")) == null ? '' : __t) +\\n\
'\";\n\
        }\n\
        index = offset + match.length;\n\
\n\
        // the JS engine embedded in Adobe products requires returning the `match`\n\
        // string in order to produce the correct `offset` value\n\
        return match;\n\
      });\n\
\n\
      source += \"';\\n\
\";\n\
\n\
      // if `variable` is not specified, wrap a with-statement around the generated\n\
      // code to add the data object to the top of the scope chain\n\
      var variable = options.variable,\n\
          hasVariable = variable;\n\
\n\
      if (!hasVariable) {\n\
        variable = 'obj';\n\
        source = 'with (' + variable + ') {\\n\
' + source + '\\n\
}\\n\
';\n\
      }\n\
      // cleanup code by stripping empty strings\n\
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)\n\
        .replace(reEmptyStringMiddle, '$1')\n\
        .replace(reEmptyStringTrailing, '$1;');\n\
\n\
      // frame code as the function body\n\
      source = 'function(' + variable + ') {\\n\
' +\n\
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\\n\
') +\n\
        \"var __t, __p = '', __e = _.escape\" +\n\
        (isEvaluating\n\
          ? ', __j = Array.prototype.join;\\n\
' +\n\
            \"function print() { __p += __j.call(arguments, '') }\\n\
\"\n\
          : ';\\n\
'\n\
        ) +\n\
        source +\n\
        'return __p\\n\
}';\n\
\n\
      // Use a sourceURL for easier debugging.\n\
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl\n\
      var sourceURL = '\\n\
/*\\n\
//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\\n\
*/';\n\
\n\
      try {\n\
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);\n\
      } catch(e) {\n\
        e.source = source;\n\
        throw e;\n\
      }\n\
      if (data) {\n\
        return result(data);\n\
      }\n\
      // provide the compiled function's source by its `toString` method, in\n\
      // supported environments, or the `source` property as a convenience for\n\
      // inlining compiled templates during the build process\n\
      result.source = source;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Executes the callback `n` times, returning an array of the results\n\
     * of each callback execution. The callback is bound to `thisArg` and invoked\n\
     * with one argument; (index).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {number} n The number of times to execute the callback.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns an array of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));\n\
     * // => [3, 6, 4]\n\
     *\n\
     * _.times(3, function(n) { mage.castSpell(n); });\n\
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively\n\
     *\n\
     * _.times(3, function(n) { this.cast(n); }, mage);\n\
     * // => also calls `mage.castSpell(n)` three times\n\
     */\n\
    function times(n, callback, thisArg) {\n\
      n = (n = +n) > -1 ? n : 0;\n\
      var index = -1,\n\
          result = Array(n);\n\
\n\
      callback = baseCreateCallback(callback, thisArg, 1);\n\
      while (++index < n) {\n\
        result[index] = callback(index);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The inverse of `_.escape` this method converts the HTML entities\n\
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their\n\
     * corresponding characters.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} string The string to unescape.\n\
     * @returns {string} Returns the unescaped string.\n\
     * @example\n\
     *\n\
     * _.unescape('Fred, Barney &amp; Pebbles');\n\
     * // => 'Fred, Barney & Pebbles'\n\
     */\n\
    function unescape(string) {\n\
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);\n\
    }\n\
\n\
    /**\n\
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} [prefix] The value to prefix the ID with.\n\
     * @returns {string} Returns the unique ID.\n\
     * @example\n\
     *\n\
     * _.uniqueId('contact_');\n\
     * // => 'contact_104'\n\
     *\n\
     * _.uniqueId();\n\
     * // => '105'\n\
     */\n\
    function uniqueId(prefix) {\n\
      var id = ++idCounter;\n\
      return String(prefix == null ? '' : prefix) + id;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object that wraps the given value with explicit\n\
     * method chaining enabled.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @param {*} value The value to wrap.\n\
     * @returns {Object} Returns the wrapper object.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40 },\n\
     *   { 'name': 'pebbles', 'age': 1 }\n\
     * ];\n\
     *\n\
     * var youngest = _.chain(characters)\n\
     *     .sortBy('age')\n\
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })\n\
     *     .first()\n\
     *     .value();\n\
     * // => 'pebbles is 1'\n\
     */\n\
    function chain(value) {\n\
      value = new lodashWrapper(value);\n\
      value.__chain__ = true;\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Invokes `interceptor` with the `value` as the first argument and then\n\
     * returns `value`. The purpose of this method is to \"tap into\" a method\n\
     * chain in order to perform operations on intermediate results within\n\
     * the chain.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @param {*} value The value to provide to `interceptor`.\n\
     * @param {Function} interceptor The function to invoke.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3, 4])\n\
     *  .tap(function(array) { array.pop(); })\n\
     *  .reverse()\n\
     *  .value();\n\
     * // => [3, 2, 1]\n\
     */\n\
    function tap(value, interceptor) {\n\
      interceptor(value);\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Enables explicit method chaining on the wrapper object.\n\
     *\n\
     * @name chain\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @returns {*} Returns the wrapper object.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // without explicit chaining\n\
     * _(characters).first();\n\
     * // => { 'name': 'barney', 'age': 36 }\n\
     *\n\
     * // with explicit chaining\n\
     * _(characters).chain()\n\
     *   .first()\n\
     *   .pick('age')\n\
     *   .value();\n\
     * // => { 'age': 36 }\n\
     */\n\
    function wrapperChain() {\n\
      this.__chain__ = true;\n\
      return this;\n\
    }\n\
\n\
    /**\n\
     * Produces the `toString` result of the wrapped value.\n\
     *\n\
     * @name toString\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @returns {string} Returns the string result.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).toString();\n\
     * // => '1,2,3'\n\
     */\n\
    function wrapperToString() {\n\
      return String(this.__wrapped__);\n\
    }\n\
\n\
    /**\n\
     * Extracts the wrapped value.\n\
     *\n\
     * @name valueOf\n\
     * @memberOf _\n\
     * @alias value\n\
     * @category Chaining\n\
     * @returns {*} Returns the wrapped value.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).valueOf();\n\
     * // => [1, 2, 3]\n\
     */\n\
    function wrapperValueOf() {\n\
      return this.__wrapped__;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions that return wrapped values when chaining\n\
    lodash.after = after;\n\
    lodash.assign = assign;\n\
    lodash.at = at;\n\
    lodash.bind = bind;\n\
    lodash.bindAll = bindAll;\n\
    lodash.bindKey = bindKey;\n\
    lodash.chain = chain;\n\
    lodash.compact = compact;\n\
    lodash.compose = compose;\n\
    lodash.constant = constant;\n\
    lodash.countBy = countBy;\n\
    lodash.create = create;\n\
    lodash.createCallback = createCallback;\n\
    lodash.curry = curry;\n\
    lodash.debounce = debounce;\n\
    lodash.defaults = defaults;\n\
    lodash.defer = defer;\n\
    lodash.delay = delay;\n\
    lodash.difference = difference;\n\
    lodash.filter = filter;\n\
    lodash.flatten = flatten;\n\
    lodash.forEach = forEach;\n\
    lodash.forEachRight = forEachRight;\n\
    lodash.forIn = forIn;\n\
    lodash.forInRight = forInRight;\n\
    lodash.forOwn = forOwn;\n\
    lodash.forOwnRight = forOwnRight;\n\
    lodash.functions = functions;\n\
    lodash.groupBy = groupBy;\n\
    lodash.indexBy = indexBy;\n\
    lodash.initial = initial;\n\
    lodash.intersection = intersection;\n\
    lodash.invert = invert;\n\
    lodash.invoke = invoke;\n\
    lodash.keys = keys;\n\
    lodash.map = map;\n\
    lodash.mapValues = mapValues;\n\
    lodash.max = max;\n\
    lodash.memoize = memoize;\n\
    lodash.merge = merge;\n\
    lodash.min = min;\n\
    lodash.omit = omit;\n\
    lodash.once = once;\n\
    lodash.pairs = pairs;\n\
    lodash.partial = partial;\n\
    lodash.partialRight = partialRight;\n\
    lodash.pick = pick;\n\
    lodash.pluck = pluck;\n\
    lodash.property = property;\n\
    lodash.pull = pull;\n\
    lodash.range = range;\n\
    lodash.reject = reject;\n\
    lodash.remove = remove;\n\
    lodash.rest = rest;\n\
    lodash.shuffle = shuffle;\n\
    lodash.sortBy = sortBy;\n\
    lodash.tap = tap;\n\
    lodash.throttle = throttle;\n\
    lodash.times = times;\n\
    lodash.toArray = toArray;\n\
    lodash.transform = transform;\n\
    lodash.union = union;\n\
    lodash.uniq = uniq;\n\
    lodash.values = values;\n\
    lodash.where = where;\n\
    lodash.without = without;\n\
    lodash.wrap = wrap;\n\
    lodash.xor = xor;\n\
    lodash.zip = zip;\n\
    lodash.zipObject = zipObject;\n\
\n\
    // add aliases\n\
    lodash.collect = map;\n\
    lodash.drop = rest;\n\
    lodash.each = forEach;\n\
    lodash.eachRight = forEachRight;\n\
    lodash.extend = assign;\n\
    lodash.methods = functions;\n\
    lodash.object = zipObject;\n\
    lodash.select = filter;\n\
    lodash.tail = rest;\n\
    lodash.unique = uniq;\n\
    lodash.unzip = zip;\n\
\n\
    // add functions to `lodash.prototype`\n\
    mixin(lodash);\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions that return unwrapped values when chaining\n\
    lodash.clone = clone;\n\
    lodash.cloneDeep = cloneDeep;\n\
    lodash.contains = contains;\n\
    lodash.escape = escape;\n\
    lodash.every = every;\n\
    lodash.find = find;\n\
    lodash.findIndex = findIndex;\n\
    lodash.findKey = findKey;\n\
    lodash.findLast = findLast;\n\
    lodash.findLastIndex = findLastIndex;\n\
    lodash.findLastKey = findLastKey;\n\
    lodash.has = has;\n\
    lodash.identity = identity;\n\
    lodash.indexOf = indexOf;\n\
    lodash.isArguments = isArguments;\n\
    lodash.isArray = isArray;\n\
    lodash.isBoolean = isBoolean;\n\
    lodash.isDate = isDate;\n\
    lodash.isElement = isElement;\n\
    lodash.isEmpty = isEmpty;\n\
    lodash.isEqual = isEqual;\n\
    lodash.isFinite = isFinite;\n\
    lodash.isFunction = isFunction;\n\
    lodash.isNaN = isNaN;\n\
    lodash.isNull = isNull;\n\
    lodash.isNumber = isNumber;\n\
    lodash.isObject = isObject;\n\
    lodash.isPlainObject = isPlainObject;\n\
    lodash.isRegExp = isRegExp;\n\
    lodash.isString = isString;\n\
    lodash.isUndefined = isUndefined;\n\
    lodash.lastIndexOf = lastIndexOf;\n\
    lodash.mixin = mixin;\n\
    lodash.noConflict = noConflict;\n\
    lodash.noop = noop;\n\
    lodash.now = now;\n\
    lodash.parseInt = parseInt;\n\
    lodash.random = random;\n\
    lodash.reduce = reduce;\n\
    lodash.reduceRight = reduceRight;\n\
    lodash.result = result;\n\
    lodash.runInContext = runInContext;\n\
    lodash.size = size;\n\
    lodash.some = some;\n\
    lodash.sortedIndex = sortedIndex;\n\
    lodash.template = template;\n\
    lodash.unescape = unescape;\n\
    lodash.uniqueId = uniqueId;\n\
\n\
    // add aliases\n\
    lodash.all = every;\n\
    lodash.any = some;\n\
    lodash.detect = find;\n\
    lodash.findWhere = find;\n\
    lodash.foldl = reduce;\n\
    lodash.foldr = reduceRight;\n\
    lodash.include = contains;\n\
    lodash.inject = reduce;\n\
\n\
    mixin(function() {\n\
      var source = {}\n\
      forOwn(lodash, function(func, methodName) {\n\
        if (!lodash.prototype[methodName]) {\n\
          source[methodName] = func;\n\
        }\n\
      });\n\
      return source;\n\
    }(), false);\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions capable of returning wrapped and unwrapped values when chaining\n\
    lodash.first = first;\n\
    lodash.last = last;\n\
    lodash.sample = sample;\n\
\n\
    // add aliases\n\
    lodash.take = first;\n\
    lodash.head = first;\n\
\n\
    forOwn(lodash, function(func, methodName) {\n\
      var callbackable = methodName !== 'sample';\n\
      if (!lodash.prototype[methodName]) {\n\
        lodash.prototype[methodName]= function(n, guard) {\n\
          var chainAll = this.__chain__,\n\
              result = func(this.__wrapped__, n, guard);\n\
\n\
          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))\n\
            ? result\n\
            : new lodashWrapper(result, chainAll);\n\
        };\n\
      }\n\
    });\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The semantic version number.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type string\n\
     */\n\
    lodash.VERSION = '2.4.1';\n\
\n\
    // add \"Chaining\" functions to the wrapper\n\
    lodash.prototype.chain = wrapperChain;\n\
    lodash.prototype.toString = wrapperToString;\n\
    lodash.prototype.value = wrapperValueOf;\n\
    lodash.prototype.valueOf = wrapperValueOf;\n\
\n\
    // add `Array` functions that return unwrapped values\n\
    forEach(['join', 'pop', 'shift'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        var chainAll = this.__chain__,\n\
            result = func.apply(this.__wrapped__, arguments);\n\
\n\
        return chainAll\n\
          ? new lodashWrapper(result, chainAll)\n\
          : result;\n\
      };\n\
    });\n\
\n\
    // add `Array` functions that return the existing wrapped value\n\
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        func.apply(this.__wrapped__, arguments);\n\
        return this;\n\
      };\n\
    });\n\
\n\
    // add `Array` functions that return new wrapped values\n\
    forEach(['concat', 'slice', 'splice'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);\n\
      };\n\
    });\n\
\n\
    return lodash;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  // expose Lo-Dash\n\
  var _ = runInContext();\n\
\n\
  // some AMD build optimizers like r.js check for condition patterns like the following:\n\
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {\n\
    // Expose Lo-Dash to the global object even when an AMD loader is present in\n\
    // case Lo-Dash is loaded with a RequireJS shim config.\n\
    // See http://requirejs.org/docs/api.html#config-shim\n\
    root._ = _;\n\
\n\
    // define as an anonymous module so, through path mapping, it can be\n\
    // referenced as the \"underscore\" module\n\
    define(function() {\n\
      return _;\n\
    });\n\
  }\n\
  // check for `exports` after `define` in case a build optimizer adds an `exports` object\n\
  else if (freeExports && freeModule) {\n\
    // in Node.js or RingoJS\n\
    if (moduleExports) {\n\
      (freeModule.exports = _)._ = _;\n\
    }\n\
    // in Narwhal or Rhino -require\n\
    else {\n\
      freeExports._ = _;\n\
    }\n\
  }\n\
  else {\n\
    // in a browser or Rhino\n\
    root._ = _;\n\
  }\n\
}.call(this));\n\
\n\
}).call(this,typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {})\n\
},{}]},{},[3])\n\
(3)\n\
});//@ sourceURL=segmentio-hermes/hermes.js"
));

require.register("benatkin-codemirror/codemirror.js", Function("exports, require, module",
"// BROWSER SNIFFING\n\
\n\
// Crude, but necessary to handle a number of hard-to-feature-detect\n\
// bugs and behavior differences.\n\
var gecko = /gecko\\/\\d/i.test(navigator.userAgent);\n\
var ie = /MSIE \\d/.test(navigator.userAgent);\n\
var ie_lt8 = ie && (document.documentMode == null || document.documentMode < 8);\n\
var ie_lt9 = ie && (document.documentMode == null || document.documentMode < 9);\n\
var webkit = /WebKit\\//.test(navigator.userAgent);\n\
var qtwebkit = webkit && /Qt\\/\\d+\\.\\d+/.test(navigator.userAgent);\n\
var chrome = /Chrome\\//.test(navigator.userAgent);\n\
var opera = /Opera\\//.test(navigator.userAgent);\n\
var safari = /Apple Computer/.test(navigator.vendor);\n\
var khtml = /KHTML\\//.test(navigator.userAgent);\n\
var mac_geLion = /Mac OS X 1\\d\\D([7-9]|\\d\\d)\\D/.test(navigator.userAgent);\n\
var mac_geMountainLion = /Mac OS X 1\\d\\D([8-9]|\\d\\d)\\D/.test(navigator.userAgent);\n\
var phantom = /PhantomJS/.test(navigator.userAgent);\n\
\n\
var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\\/\\w+/.test(navigator.userAgent);\n\
// This is woefully incomplete. Suggestions for alternative methods welcome.\n\
var mobile = ios || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(navigator.userAgent);\n\
var mac = ios || /Mac/.test(navigator.platform);\n\
var windows = /windows/i.test(navigator.platform);\n\
\n\
var opera_version = opera && navigator.userAgent.match(/Version\\/(\\d*\\.\\d*)/);\n\
if (opera_version) opera_version = Number(opera_version[1]);\n\
// Some browsers use the wrong event properties to signal cmd/ctrl on OS X\n\
var flipCtrlCmd = mac && (qtwebkit || opera && (opera_version == null || opera_version < 12.11));\n\
\n\
// Optimize some code when these features are not used\n\
var sawReadOnlySpans = false, sawCollapsedSpans = false;\n\
\n\
// CONSTRUCTOR\n\
\n\
function CodeMirror(place, options) {\n\
  if (!(this instanceof CodeMirror)) return new CodeMirror(place, options);\n\
  \n\
  this.options = options = options || {};\n\
  // Determine effective options based on given values and defaults.\n\
  for (var opt in defaults) if (!options.hasOwnProperty(opt) && defaults.hasOwnProperty(opt))\n\
    options[opt] = defaults[opt];\n\
  setGuttersForLineNumbers(options);\n\
\n\
  var docStart = typeof options.value == \"string\" ? 0 : options.value.first;\n\
  var display = this.display = makeDisplay(place, docStart);\n\
  display.wrapper.CodeMirror = this;\n\
  updateGutters(this);\n\
  if (options.autofocus && !mobile) focusInput(this);\n\
\n\
  this.state = {keyMaps: [],\n\
                overlays: [],\n\
                modeGen: 0,\n\
                overwrite: false, focused: false,\n\
                suppressEdits: false, pasteIncoming: false,\n\
                draggingText: false,\n\
                highlight: new Delayed()};\n\
\n\
  this.nextOpId = 0;\n\
  themeChanged(this);\n\
  if (options.lineWrapping)\n\
    this.display.wrapper.className += \" CodeMirror-wrap\";\n\
\n\
  var doc = options.value;\n\
  if (typeof doc == \"string\") doc = new Doc(options.value, options.mode);\n\
  operation(this, attachDoc)(this, doc);\n\
\n\
  // Override magic textarea content restore that IE sometimes does\n\
  // on our hidden textarea on reload\n\
  if (ie) setTimeout(bind(resetInput, this, true), 20);\n\
\n\
  registerEventHandlers(this);\n\
  // IE throws unspecified error in certain cases, when\n\
  // trying to access activeElement before onload\n\
  var hasFocus; try { hasFocus = (document.activeElement == display.input); } catch(e) { }\n\
  if (hasFocus || (options.autofocus && !mobile)) setTimeout(bind(onFocus, this), 20);\n\
  else onBlur(this);\n\
\n\
  operation(this, function() {\n\
    for (var opt in optionHandlers)\n\
      if (optionHandlers.propertyIsEnumerable(opt))\n\
        optionHandlers[opt](this, options[opt], Init);\n\
    for (var i = 0; i < initHooks.length; ++i) initHooks[i](this);\n\
  })();\n\
}\n\
\n\
// DISPLAY CONSTRUCTOR\n\
\n\
function makeDisplay(place, docStart) {\n\
  var d = {};\n\
  var input = d.input = elt(\"textarea\", null, null, \"position: absolute; padding: 0; width: 1px; height: 1em; outline: none;\");\n\
  if (webkit) input.style.width = \"1000px\";\n\
  else input.setAttribute(\"wrap\", \"off\");\n\
  input.setAttribute(\"autocorrect\", \"off\"); input.setAttribute(\"autocapitalize\", \"off\");\n\
  // Wraps and hides input textarea\n\
  d.inputDiv = elt(\"div\", [input], null, \"overflow: hidden; position: relative; width: 3px; height: 0px;\");\n\
  // The actual fake scrollbars.\n\
  d.scrollbarH = elt(\"div\", [elt(\"div\", null, null, \"height: 1px\")], \"CodeMirror-hscrollbar\");\n\
  d.scrollbarV = elt(\"div\", [elt(\"div\", null, null, \"width: 1px\")], \"CodeMirror-vscrollbar\");\n\
  d.scrollbarFiller = elt(\"div\", null, \"CodeMirror-scrollbar-filler\");\n\
  // DIVs containing the selection and the actual code\n\
  d.lineDiv = elt(\"div\");\n\
  d.selectionDiv = elt(\"div\", null, null, \"position: relative; z-index: 1\");\n\
  // Blinky cursor, and element used to ensure cursor fits at the end of a line\n\
  d.cursor = elt(\"div\", \"\\u00a0\", \"CodeMirror-cursor\");\n\
  // Secondary cursor, shown when on a 'jump' in bi-directional text\n\
  d.otherCursor = elt(\"div\", \"\\u00a0\", \"CodeMirror-cursor CodeMirror-secondarycursor\");\n\
  // Used to measure text size\n\
  d.measure = elt(\"div\", null, \"CodeMirror-measure\");\n\
  // Wraps everything that needs to exist inside the vertically-padded coordinate system\n\
  d.lineSpace = elt(\"div\", [d.measure, d.selectionDiv, d.lineDiv, d.cursor, d.otherCursor],\n\
                       null, \"position: relative; outline: none\");\n\
  // Moved around its parent to cover visible view\n\
  d.mover = elt(\"div\", [elt(\"div\", [d.lineSpace], \"CodeMirror-lines\")], null, \"position: relative\");\n\
  // Set to the height of the text, causes scrolling\n\
  d.sizer = elt(\"div\", [d.mover], \"CodeMirror-sizer\");\n\
  // D is needed because behavior of elts with overflow: auto and padding is inconsistent across browsers\n\
  d.heightForcer = elt(\"div\", \"\\u00a0\", null, \"position: absolute; height: \" + scrollerCutOff + \"px\");\n\
  // Will contain the gutters, if any\n\
  d.gutters = elt(\"div\", null, \"CodeMirror-gutters\");\n\
  d.lineGutter = null;\n\
  // Helper element to properly size the gutter backgrounds\n\
  var scrollerInner = elt(\"div\", [d.sizer, d.heightForcer, d.gutters], null, \"position: relative; min-height: 100%\");\n\
  // Provides scrolling\n\
  d.scroller = elt(\"div\", [scrollerInner], \"CodeMirror-scroll\");\n\
  d.scroller.setAttribute(\"tabIndex\", \"-1\");\n\
  // The element in which the editor lives.\n\
  d.wrapper = elt(\"div\", [d.inputDiv, d.scrollbarH, d.scrollbarV,\n\
                          d.scrollbarFiller, d.scroller], \"CodeMirror\");\n\
  // Work around IE7 z-index bug\n\
  if (ie_lt8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0; }\n\
  if (place.appendChild) place.appendChild(d.wrapper); else place(d.wrapper);\n\
\n\
  // Needed to hide big blue blinking cursor on Mobile Safari\n\
  if (ios) input.style.width = \"0px\";\n\
  if (!webkit) d.scroller.draggable = true;\n\
  // Needed to handle Tab key in KHTML\n\
  if (khtml) { d.inputDiv.style.height = \"1px\"; d.inputDiv.style.position = \"absolute\"; }\n\
  // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).\n\
  else if (ie_lt8) d.scrollbarH.style.minWidth = d.scrollbarV.style.minWidth = \"18px\";\n\
\n\
  // Current visible range (may be bigger than the view window).\n\
  d.viewOffset = d.lastSizeC = 0;\n\
  d.showingFrom = d.showingTo = docStart;\n\
\n\
  // Used to only resize the line number gutter when necessary (when\n\
  // the amount of lines crosses a boundary that makes its width change)\n\
  d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;\n\
  // See readInput and resetInput\n\
  d.prevInput = \"\";\n\
  // Set to true when a non-horizontal-scrolling widget is added. As\n\
  // an optimization, widget aligning is skipped when d is false.\n\
  d.alignWidgets = false;\n\
  // Flag that indicates whether we currently expect input to appear\n\
  // (after some event like 'keypress' or 'input') and are polling\n\
  // intensively.\n\
  d.pollingFast = false;\n\
  // Self-resetting timeout for the poller\n\
  d.poll = new Delayed();\n\
  // True when a drag from the editor is active\n\
  d.draggingText = false;\n\
\n\
  d.cachedCharWidth = d.cachedTextHeight = null;\n\
  d.measureLineCache = [];\n\
  d.measureLineCachePos = 0;\n\
\n\
  // Tracks when resetInput has punted to just putting a short\n\
  // string instead of the (large) selection.\n\
  d.inaccurateSelection = false;\n\
\n\
  // Tracks the maximum line length so that the horizontal scrollbar\n\
  // can be kept static when scrolling.\n\
  d.maxLine = null;\n\
  d.maxLineLength = 0;\n\
  d.maxLineChanged = false;\n\
\n\
  // Used for measuring wheel scrolling granularity\n\
  d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;\n\
  \n\
  return d;\n\
}\n\
\n\
// STATE UPDATES\n\
\n\
// Used to get the editor into a consistent state again when options change.\n\
\n\
function loadMode(cm) {\n\
  cm.doc.mode = CodeMirror.getMode(cm.options, cm.doc.modeOption);\n\
  cm.doc.iter(function(line) {\n\
    if (line.stateAfter) line.stateAfter = null;\n\
    if (line.styles) line.styles = null;\n\
  });\n\
  cm.doc.frontier = cm.doc.first;\n\
  startWorker(cm, 100);\n\
  cm.state.modeGen++;\n\
  if (cm.curOp) regChange(cm);\n\
}\n\
\n\
function wrappingChanged(cm) {\n\
  if (cm.options.lineWrapping) {\n\
    cm.display.wrapper.className += \" CodeMirror-wrap\";\n\
    cm.display.sizer.style.minWidth = \"\";\n\
  } else {\n\
    cm.display.wrapper.className = cm.display.wrapper.className.replace(\" CodeMirror-wrap\", \"\");\n\
    computeMaxLength(cm);\n\
  }\n\
  estimateLineHeights(cm);\n\
  regChange(cm);\n\
  clearCaches(cm);\n\
  setTimeout(function(){updateScrollbars(cm.display, cm.doc.height);}, 100);\n\
}\n\
\n\
function estimateHeight(cm) {\n\
  var th = textHeight(cm.display), wrapping = cm.options.lineWrapping;\n\
  var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);\n\
  return function(line) {\n\
    if (lineIsHidden(line))\n\
      return 0;\n\
    else if (wrapping)\n\
      return (Math.ceil(line.text.length / perLine) || 1) * th;\n\
    else\n\
      return th;\n\
  };\n\
}\n\
\n\
function estimateLineHeights(cm) {\n\
  var doc = cm.doc, est = estimateHeight(cm);\n\
  doc.iter(function(line) {\n\
    var estHeight = est(line);\n\
    if (estHeight != line.height) updateLineHeight(line, estHeight);\n\
  });\n\
}\n\
\n\
function keyMapChanged(cm) {\n\
  var style = keyMap[cm.options.keyMap].style;\n\
  cm.display.wrapper.className = cm.display.wrapper.className.replace(/\\s*cm-keymap-\\S+/g, \"\") +\n\
    (style ? \" cm-keymap-\" + style : \"\");\n\
}\n\
\n\
function themeChanged(cm) {\n\
  cm.display.wrapper.className = cm.display.wrapper.className.replace(/\\s*cm-s-\\S+/g, \"\") +\n\
    cm.options.theme.replace(/(^|\\s)\\s*/g, \" cm-s-\");\n\
  clearCaches(cm);\n\
}\n\
\n\
function guttersChanged(cm) {\n\
  updateGutters(cm);\n\
  regChange(cm);\n\
}\n\
\n\
function updateGutters(cm) {\n\
  var gutters = cm.display.gutters, specs = cm.options.gutters;\n\
  removeChildren(gutters);\n\
  for (var i = 0; i < specs.length; ++i) {\n\
    var gutterClass = specs[i];\n\
    var gElt = gutters.appendChild(elt(\"div\", null, \"CodeMirror-gutter \" + gutterClass));\n\
    if (gutterClass == \"CodeMirror-linenumbers\") {\n\
      cm.display.lineGutter = gElt;\n\
      gElt.style.width = (cm.display.lineNumWidth || 1) + \"px\";\n\
    }\n\
  }\n\
  gutters.style.display = i ? \"\" : \"none\";\n\
}\n\
\n\
function lineLength(doc, line) {\n\
  if (line.height == 0) return 0;\n\
  var len = line.text.length, merged, cur = line;\n\
  while (merged = collapsedSpanAtStart(cur)) {\n\
    var found = merged.find();\n\
    cur = getLine(doc, found.from.line);\n\
    len += found.from.ch - found.to.ch;\n\
  }\n\
  cur = line;\n\
  while (merged = collapsedSpanAtEnd(cur)) {\n\
    var found = merged.find();\n\
    len -= cur.text.length - found.from.ch;\n\
    cur = getLine(doc, found.to.line);\n\
    len += cur.text.length - found.to.ch;\n\
  }\n\
  return len;\n\
}\n\
\n\
function computeMaxLength(cm) {\n\
  var d = cm.display, doc = cm.doc;\n\
  d.maxLine = getLine(doc, doc.first);\n\
  d.maxLineLength = lineLength(doc, d.maxLine);\n\
  d.maxLineChanged = true;\n\
  doc.iter(function(line) {\n\
    var len = lineLength(doc, line);\n\
    if (len > d.maxLineLength) {\n\
      d.maxLineLength = len;\n\
      d.maxLine = line;\n\
    }\n\
  });\n\
}\n\
\n\
// Make sure the gutters options contains the element\n\
// \"CodeMirror-linenumbers\" when the lineNumbers option is true.\n\
function setGuttersForLineNumbers(options) {\n\
  var found = false;\n\
  for (var i = 0; i < options.gutters.length; ++i) {\n\
    if (options.gutters[i] == \"CodeMirror-linenumbers\") {\n\
      if (options.lineNumbers) found = true;\n\
      else options.gutters.splice(i--, 1);\n\
    }\n\
  }\n\
  if (!found && options.lineNumbers)\n\
    options.gutters.push(\"CodeMirror-linenumbers\");\n\
}\n\
\n\
// SCROLLBARS\n\
\n\
// Re-synchronize the fake scrollbars with the actual size of the\n\
// content. Optionally force a scrollTop.\n\
function updateScrollbars(d /* display */, docHeight) {\n\
  var totalHeight = docHeight + 2 * paddingTop(d);\n\
  d.sizer.style.minHeight = d.heightForcer.style.top = totalHeight + \"px\";\n\
  var scrollHeight = Math.max(totalHeight, d.scroller.scrollHeight);\n\
  var needsH = d.scroller.scrollWidth > d.scroller.clientWidth;\n\
  var needsV = scrollHeight > d.scroller.clientHeight;\n\
  if (needsV) {\n\
    d.scrollbarV.style.display = \"block\";\n\
    d.scrollbarV.style.bottom = needsH ? scrollbarWidth(d.measure) + \"px\" : \"0\";\n\
    d.scrollbarV.firstChild.style.height = \n\
      (scrollHeight - d.scroller.clientHeight + d.scrollbarV.clientHeight) + \"px\";\n\
  } else d.scrollbarV.style.display = \"\";\n\
  if (needsH) {\n\
    d.scrollbarH.style.display = \"block\";\n\
    d.scrollbarH.style.right = needsV ? scrollbarWidth(d.measure) + \"px\" : \"0\";\n\
    d.scrollbarH.firstChild.style.width =\n\
      (d.scroller.scrollWidth - d.scroller.clientWidth + d.scrollbarH.clientWidth) + \"px\";\n\
  } else d.scrollbarH.style.display = \"\";\n\
  if (needsH && needsV) {\n\
    d.scrollbarFiller.style.display = \"block\";\n\
    d.scrollbarFiller.style.height = d.scrollbarFiller.style.width = scrollbarWidth(d.measure) + \"px\";\n\
  } else d.scrollbarFiller.style.display = \"\";\n\
\n\
  if (mac_geLion && scrollbarWidth(d.measure) === 0)\n\
    d.scrollbarV.style.minWidth = d.scrollbarH.style.minHeight = mac_geMountainLion ? \"18px\" : \"12px\";\n\
}\n\
\n\
function visibleLines(display, doc, viewPort) {\n\
  var top = display.scroller.scrollTop, height = display.wrapper.clientHeight;\n\
  if (typeof viewPort == \"number\") top = viewPort;\n\
  else if (viewPort) {top = viewPort.top; height = viewPort.bottom - viewPort.top;}\n\
  top = Math.floor(top - paddingTop(display));\n\
  var bottom = Math.ceil(top + height);\n\
  return {from: lineAtHeight(doc, top), to: lineAtHeight(doc, bottom)};\n\
}\n\
\n\
// LINE NUMBERS\n\
\n\
function alignHorizontally(cm) {\n\
  var display = cm.display;\n\
  if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) return;\n\
  var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;\n\
  var gutterW = display.gutters.offsetWidth, l = comp + \"px\";\n\
  for (var n = display.lineDiv.firstChild; n; n = n.nextSibling) if (n.alignable) {\n\
    for (var i = 0, a = n.alignable; i < a.length; ++i) a[i].style.left = l;\n\
  }\n\
  if (cm.options.fixedGutter)\n\
    display.gutters.style.left = (comp + gutterW) + \"px\";\n\
}\n\
\n\
function maybeUpdateLineNumberWidth(cm) {\n\
  if (!cm.options.lineNumbers) return false;\n\
  var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;\n\
  if (last.length != display.lineNumChars) {\n\
    var test = display.measure.appendChild(elt(\"div\", [elt(\"div\", last)],\n\
                                               \"CodeMirror-linenumber CodeMirror-gutter-elt\"));\n\
    var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;\n\
    display.lineGutter.style.width = \"\";\n\
    display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding);\n\
    display.lineNumWidth = display.lineNumInnerWidth + padding;\n\
    display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;\n\
    display.lineGutter.style.width = display.lineNumWidth + \"px\";\n\
    return true;\n\
  }\n\
  return false;\n\
}\n\
\n\
function lineNumberFor(options, i) {\n\
  return String(options.lineNumberFormatter(i + options.firstLineNumber));\n\
}\n\
function compensateForHScroll(display) {\n\
  return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;\n\
}\n\
\n\
// DISPLAY DRAWING\n\
\n\
function updateDisplay(cm, changes, viewPort) {\n\
  var oldFrom = cm.display.showingFrom, oldTo = cm.display.showingTo;\n\
  var updated = updateDisplayInner(cm, changes, viewPort);\n\
  if (updated) {\n\
    signalLater(cm, \"update\", cm);\n\
    if (cm.display.showingFrom != oldFrom || cm.display.showingTo != oldTo)\n\
      signalLater(cm, \"viewportChange\", cm, cm.display.showingFrom, cm.display.showingTo);\n\
  }\n\
  updateSelection(cm);\n\
  updateScrollbars(cm.display, cm.doc.height);\n\
\n\
  return updated;\n\
}\n\
\n\
// Uses a set of changes plus the current scroll position to\n\
// determine which DOM updates have to be made, and makes the\n\
// updates.\n\
function updateDisplayInner(cm, changes, viewPort) {\n\
  var display = cm.display, doc = cm.doc;\n\
  if (!display.wrapper.clientWidth) {\n\
    display.showingFrom = display.showingTo = doc.first;\n\
    display.viewOffset = 0;\n\
    return;\n\
  }\n\
\n\
  // Compute the new visible window\n\
  // If scrollTop is specified, use that to determine which lines\n\
  // to render instead of the current scrollbar position.\n\
  var visible = visibleLines(display, doc, viewPort);\n\
  // Bail out if the visible area is already rendered and nothing changed.\n\
  if (changes.length == 0 &&\n\
      visible.from > display.showingFrom && visible.to < display.showingTo)\n\
    return;\n\
\n\
  if (maybeUpdateLineNumberWidth(cm))\n\
    changes = [{from: doc.first, to: doc.first + doc.size}];\n\
  var gutterW = display.sizer.style.marginLeft = display.gutters.offsetWidth + \"px\";\n\
  display.scrollbarH.style.left = cm.options.fixedGutter ? gutterW : \"0\";\n\
\n\
  // When merged lines are present, the line that needs to be\n\
  // redrawn might not be the one that was changed.\n\
  if (sawCollapsedSpans)\n\
    for (var i = 0; i < changes.length; ++i) {\n\
      var ch = changes[i], merged;\n\
      while (merged = collapsedSpanAtStart(getLine(doc, ch.from))) {\n\
        var from = merged.find().from.line;\n\
        if (ch.diff) ch.diff -= ch.from - from;\n\
        ch.from = from;\n\
      }\n\
    }\n\
\n\
  // Used to determine which lines need their line numbers updated\n\
  var positionsChangedFrom = Infinity;\n\
  if (cm.options.lineNumbers)\n\
    for (var i = 0; i < changes.length; ++i)\n\
      if (changes[i].diff) { positionsChangedFrom = changes[i].from; break; }\n\
\n\
  var end = doc.first + doc.size;\n\
  var from = Math.max(visible.from - cm.options.viewportMargin, doc.first);\n\
  var to = Math.min(end, visible.to + cm.options.viewportMargin);\n\
  if (display.showingFrom < from && from - display.showingFrom < 20) from = Math.max(doc.first, display.showingFrom);\n\
  if (display.showingTo > to && display.showingTo - to < 20) to = Math.min(end, display.showingTo);\n\
  if (sawCollapsedSpans) {\n\
    from = lineNo(visualLine(doc, getLine(doc, from)));\n\
    while (to < end && lineIsHidden(getLine(doc, to))) ++to;\n\
  }\n\
\n\
  // Create a range of theoretically intact lines, and punch holes\n\
  // in that using the change info.\n\
  var intact = computeIntact([{from: display.showingFrom, to: display.showingTo}], changes);\n\
\n\
  // Clip off the parts that won't be visible\n\
  var intactLines = 0;\n\
  for (var i = 0; i < intact.length; ++i) {\n\
    var range = intact[i];\n\
    if (range.from < from) range.from = from;\n\
    if (range.to > to) range.to = to;\n\
    if (range.from >= range.to) intact.splice(i--, 1);\n\
    else intactLines += range.to - range.from;\n\
  }\n\
  if (intactLines == to - from && from == display.showingFrom && to == display.showingTo) {\n\
    updateViewOffset(cm);\n\
    return;\n\
  }\n\
  intact.sort(function(a, b) {return a.from - b.from;});\n\
\n\
  var focused = document.activeElement;\n\
  if (intactLines < (to - from) * .7) display.lineDiv.style.display = \"none\";\n\
  patchDisplay(cm, from, to, intact, positionsChangedFrom);\n\
  display.lineDiv.style.display = \"\";\n\
  if (document.activeElement != focused && focused.offsetHeight) focused.focus();\n\
\n\
  var different = from != display.showingFrom || to != display.showingTo ||\n\
    display.lastSizeC != display.wrapper.clientHeight;\n\
  // This is just a bogus formula that detects when the editor is\n\
  // resized or the font size changes.\n\
  if (different) display.lastSizeC = display.wrapper.clientHeight;\n\
  display.showingFrom = from; display.showingTo = to;\n\
  startWorker(cm, 100);\n\
\n\
  var prevBottom = display.lineDiv.offsetTop;\n\
  for (var node = display.lineDiv.firstChild, height; node; node = node.nextSibling) if (node.lineObj) {\n\
    if (ie_lt8) {\n\
      var bot = node.offsetTop + node.offsetHeight;\n\
      height = bot - prevBottom;\n\
      prevBottom = bot;\n\
    } else {\n\
      var box = node.getBoundingClientRect();\n\
      height = box.bottom - box.top;\n\
    }\n\
    var diff = node.lineObj.height - height;\n\
    if (height < 2) height = textHeight(display);\n\
    if (diff > .001 || diff < -.001) {\n\
      updateLineHeight(node.lineObj, height);\n\
      var widgets = node.lineObj.widgets;\n\
      if (widgets) for (var i = 0; i < widgets.length; ++i)\n\
        widgets[i].height = widgets[i].node.offsetHeight;\n\
    }\n\
  }\n\
  updateViewOffset(cm);\n\
\n\
  if (visibleLines(display, doc, viewPort).to >= to)\n\
    updateDisplayInner(cm, [], viewPort);\n\
  return true;\n\
}\n\
\n\
function updateViewOffset(cm) {\n\
  var off = cm.display.viewOffset = heightAtLine(cm, getLine(cm.doc, cm.display.showingFrom));\n\
  // Position the mover div to align with the current virtual scroll position\n\
  cm.display.mover.style.top = off + \"px\";\n\
}\n\
\n\
function computeIntact(intact, changes) {\n\
  for (var i = 0, l = changes.length || 0; i < l; ++i) {\n\
    var change = changes[i], intact2 = [], diff = change.diff || 0;\n\
    for (var j = 0, l2 = intact.length; j < l2; ++j) {\n\
      var range = intact[j];\n\
      if (change.to <= range.from && change.diff) {\n\
        intact2.push({from: range.from + diff, to: range.to + diff});\n\
      } else if (change.to <= range.from || change.from >= range.to) {\n\
        intact2.push(range);\n\
      } else {\n\
        if (change.from > range.from)\n\
          intact2.push({from: range.from, to: change.from});\n\
        if (change.to < range.to)\n\
          intact2.push({from: change.to + diff, to: range.to + diff});\n\
      }\n\
    }\n\
    intact = intact2;\n\
  }\n\
  return intact;\n\
}\n\
\n\
function getDimensions(cm) {\n\
  var d = cm.display, left = {}, width = {};\n\
  for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {\n\
    left[cm.options.gutters[i]] = n.offsetLeft;\n\
    width[cm.options.gutters[i]] = n.offsetWidth;\n\
  }\n\
  return {fixedPos: compensateForHScroll(d),\n\
          gutterTotalWidth: d.gutters.offsetWidth,\n\
          gutterLeft: left,\n\
          gutterWidth: width,\n\
          wrapperWidth: d.wrapper.clientWidth};\n\
}\n\
\n\
function patchDisplay(cm, from, to, intact, updateNumbersFrom) {\n\
  var dims = getDimensions(cm);\n\
  var display = cm.display, lineNumbers = cm.options.lineNumbers;\n\
  if (!intact.length && (!webkit || !cm.display.currentWheelTarget))\n\
    removeChildren(display.lineDiv);\n\
  var container = display.lineDiv, cur = container.firstChild;\n\
\n\
  function rm(node) {\n\
    var next = node.nextSibling;\n\
    if (webkit && mac && cm.display.currentWheelTarget == node) {\n\
      node.style.display = \"none\";\n\
      node.lineObj = null;\n\
    } else {\n\
      node.parentNode.removeChild(node);\n\
    }\n\
    return next;\n\
  }\n\
\n\
  var nextIntact = intact.shift(), lineN = from;\n\
  cm.doc.iter(from, to, function(line) {\n\
    if (nextIntact && nextIntact.to == lineN) nextIntact = intact.shift();\n\
    if (lineIsHidden(line)) {\n\
      if (line.height != 0) updateLineHeight(line, 0);\n\
      if (line.widgets && cur.previousSibling) for (var i = 0; i < line.widgets.length; ++i)\n\
        if (line.widgets[i].showIfHidden) {\n\
          var prev = cur.previousSibling;\n\
          if (/pre/i.test(prev.nodeName)) {\n\
            var wrap = elt(\"div\", null, null, \"position: relative\");\n\
            prev.parentNode.replaceChild(wrap, prev);\n\
            wrap.appendChild(prev);\n\
            prev = wrap;\n\
          }\n\
          prev.appendChild(buildLineWidget(line.widgets[i], prev, dims));\n\
        }\n\
    } else if (nextIntact && nextIntact.from <= lineN && nextIntact.to > lineN) {\n\
      // This line is intact. Skip to the actual node. Update its\n\
      // line number if needed.\n\
      while (cur.lineObj != line) cur = rm(cur);\n\
      if (lineNumbers && updateNumbersFrom <= lineN && cur.lineNumber)\n\
        setTextContent(cur.lineNumber, lineNumberFor(cm.options, lineN));\n\
      cur = cur.nextSibling;\n\
    } else {\n\
      // For lines with widgets, make an attempt to find and reuse\n\
      // the existing element, so that widgets aren't needlessly\n\
      // removed and re-inserted into the dom\n\
      if (line.widgets) for (var j = 0, search = cur, reuse; search && j < 20; ++j, search = search.nextSibling)\n\
        if (search.lineObj == line && /div/i.test(search.nodeName)) { reuse = search; break; }\n\
      // This line needs to be generated.\n\
      var lineNode = buildLineElement(cm, line, lineN, dims, reuse);\n\
      if (lineNode != reuse) {\n\
        container.insertBefore(lineNode, cur);\n\
      } else {\n\
        while (cur != reuse) cur = rm(cur);\n\
        cur = cur.nextSibling;\n\
      }\n\
\n\
      lineNode.lineObj = line;\n\
    }\n\
    ++lineN;\n\
  });\n\
  while (cur) cur = rm(cur);\n\
}\n\
\n\
function buildLineElement(cm, line, lineNo, dims, reuse) {\n\
  var lineElement = lineContent(cm, line);\n\
  var markers = line.gutterMarkers, display = cm.display, wrap;\n\
\n\
  if (!cm.options.lineNumbers && !markers && !line.bgClass && !line.wrapClass && !line.widgets)\n\
    return lineElement;\n\
\n\
  // Lines with gutter elements, widgets or a background class need\n\
  // to be wrapped again, and have the extra elements added to the\n\
  // wrapper div\n\
  \n\
  if (reuse) {\n\
    var isOk = true, widgetsSeen = 0;\n\
    for (var n = reuse.firstChild, next; n; n = next) {\n\
      next = n.nextSibling;\n\
      if (!/\\bCodeMirror-linewidget\\b/.test(n.className)) {\n\
        reuse.removeChild(n);\n\
      } else {\n\
        for (var i = 0, first = true; i < line.widgets.length; ++i) {\n\
          var widget = line.widgets[i], isFirst = false;\n\
          if (!widget.above) { isFirst = first; first = false; }\n\
          if (widget.node == n.firstChild) {\n\
            widgetsSeen++;\n\
            if (isFirst) reuse.insertBefore(lineElement, n);\n\
            break;\n\
          }\n\
        }\n\
        if (i == line.widgets.length) { isOk = false; break; }\n\
      }\n\
    }\n\
    if (isOk && widgetsSeen == line.widgets.length) {\n\
      wrap = reuse;\n\
      reuse.className = line.wrapClass || \"\";\n\
      reuse.alignable = null;\n\
    }\n\
  }\n\
  if (!wrap) {\n\
    wrap = elt(\"div\", null, line.wrapClass, \"position: relative\");\n\
    wrap.appendChild(lineElement);\n\
  }\n\
  // Kludge to make sure the styled element lies behind the selection (by z-index)\n\
  if (line.bgClass)\n\
    wrap.insertBefore(elt(\"div\", \"\\u00a0\", line.bgClass + \" CodeMirror-linebackground\"), wrap.firstChild);\n\
  if (cm.options.lineNumbers || markers) {\n\
    var gutterWrap = wrap.insertBefore(elt(\"div\", null, null, \"position: absolute; left: \" +\n\
                                           (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + \"px\"),\n\
                                       wrap.firstChild);\n\
    if (cm.options.fixedGutter) wrap.alignable = [gutterWrap];\n\
    if (cm.options.lineNumbers && (!markers || !markers[\"CodeMirror-linenumbers\"]))\n\
      wrap.lineNumber = gutterWrap.appendChild(\n\
        elt(\"div\", lineNumberFor(cm.options, lineNo),\n\
            \"CodeMirror-linenumber CodeMirror-gutter-elt\",\n\
            \"left: \" + dims.gutterLeft[\"CodeMirror-linenumbers\"] + \"px; width: \"\n\
            + display.lineNumInnerWidth + \"px\"));\n\
    if (markers)\n\
      for (var k = 0; k < cm.options.gutters.length; ++k) {\n\
        var id = cm.options.gutters[k], found = markers.hasOwnProperty(id) && markers[id];\n\
        if (found)\n\
          gutterWrap.appendChild(elt(\"div\", [found], \"CodeMirror-gutter-elt\", \"left: \" +\n\
                                     dims.gutterLeft[id] + \"px; width: \" + dims.gutterWidth[id] + \"px\"));\n\
      }\n\
  }\n\
  if (ie_lt8) wrap.style.zIndex = 2;\n\
  if (line.widgets && wrap != reuse) for (var i = 0, ws = line.widgets; i < ws.length; ++i) {\n\
    var widget = ws[i], node = buildLineWidget(widget, wrap, dims);\n\
    if (widget.above)\n\
      wrap.insertBefore(node, cm.options.lineNumbers && line.height != 0 ? gutterWrap : lineElement);\n\
    else\n\
      wrap.appendChild(node);\n\
    signalLater(widget, \"redraw\");\n\
  }\n\
  return wrap;\n\
}\n\
\n\
function buildLineWidget(widget, wrap, dims) {\n\
  var node = elt(\"div\", [widget.node], \"CodeMirror-linewidget\");\n\
  node.widget = widget;\n\
  if (widget.noHScroll) {\n\
    (wrap.alignable || (wrap.alignable = [])).push(node);\n\
    var width = dims.wrapperWidth;\n\
    node.style.left = dims.fixedPos + \"px\";\n\
    if (!widget.coverGutter) {\n\
      width -= dims.gutterTotalWidth;\n\
      node.style.paddingLeft = dims.gutterTotalWidth + \"px\";\n\
    }\n\
    node.style.width = width + \"px\";\n\
  }\n\
  if (widget.coverGutter) {\n\
    node.style.zIndex = 5;\n\
    node.style.position = \"relative\";\n\
    if (!widget.noHScroll) node.style.marginLeft = -dims.gutterTotalWidth + \"px\";\n\
  }\n\
  return node;\n\
}\n\
\n\
// SELECTION / CURSOR\n\
\n\
function updateSelection(cm) {\n\
  var display = cm.display;\n\
  var collapsed = posEq(cm.doc.sel.from, cm.doc.sel.to);\n\
  if (collapsed || cm.options.showCursorWhenSelecting)\n\
    updateSelectionCursor(cm);\n\
  else\n\
    display.cursor.style.display = display.otherCursor.style.display = \"none\";\n\
  if (!collapsed)\n\
    updateSelectionRange(cm);\n\
  else\n\
    display.selectionDiv.style.display = \"none\";\n\
\n\
  // Move the hidden textarea near the cursor to prevent scrolling artifacts\n\
  var headPos = cursorCoords(cm, cm.doc.sel.head, \"div\");\n\
  var wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect();\n\
  display.inputDiv.style.top = Math.max(0, Math.min(display.wrapper.clientHeight - 10,\n\
                                                    headPos.top + lineOff.top - wrapOff.top)) + \"px\";\n\
  display.inputDiv.style.left = Math.max(0, Math.min(display.wrapper.clientWidth - 10,\n\
                                                     headPos.left + lineOff.left - wrapOff.left)) + \"px\";\n\
}\n\
\n\
// No selection, plain cursor\n\
function updateSelectionCursor(cm) {\n\
  var display = cm.display, pos = cursorCoords(cm, cm.doc.sel.head, \"div\");\n\
  display.cursor.style.left = pos.left + \"px\";\n\
  display.cursor.style.top = pos.top + \"px\";\n\
  display.cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + \"px\";\n\
  display.cursor.style.display = \"\";\n\
\n\
  if (pos.other) {\n\
    display.otherCursor.style.display = \"\";\n\
    display.otherCursor.style.left = pos.other.left + \"px\";\n\
    display.otherCursor.style.top = pos.other.top + \"px\";\n\
    display.otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + \"px\";\n\
  } else { display.otherCursor.style.display = \"none\"; }\n\
}\n\
\n\
// Highlight selection\n\
function updateSelectionRange(cm) {\n\
  var display = cm.display, doc = cm.doc, sel = cm.doc.sel;\n\
  var fragment = document.createDocumentFragment();\n\
  var clientWidth = display.lineSpace.offsetWidth, pl = paddingLeft(cm.display);\n\
\n\
  function add(left, top, width, bottom) {\n\
    if (top < 0) top = 0;\n\
    fragment.appendChild(elt(\"div\", null, \"CodeMirror-selected\", \"position: absolute; left: \" + left +\n\
                             \"px; top: \" + top + \"px; width: \" + (width == null ? clientWidth - left : width) +\n\
                             \"px; height: \" + (bottom - top) + \"px\"));\n\
  }\n\
\n\
  function drawForLine(line, fromArg, toArg, retTop) {\n\
    var lineObj = getLine(doc, line);\n\
    var lineLen = lineObj.text.length, rVal = retTop ? Infinity : -Infinity;\n\
    function coords(ch) {\n\
      return charCoords(cm, {line: line, ch: ch}, \"div\", lineObj);\n\
    }\n\
\n\
    iterateBidiSections(getOrder(lineObj), fromArg || 0, toArg == null ? lineLen : toArg, function(from, to, dir) {\n\
      var leftPos = coords(dir == \"rtl\" ? to - 1 : from);\n\
      var rightPos = coords(dir == \"rtl\" ? from : to - 1);\n\
      var left = leftPos.left, right = rightPos.right;\n\
      if (rightPos.top - leftPos.top > 3) { // Different lines, draw top part\n\
        add(left, leftPos.top, null, leftPos.bottom);\n\
        left = pl;\n\
        if (leftPos.bottom < rightPos.top) add(left, leftPos.bottom, null, rightPos.top);\n\
      }\n\
      if (toArg == null && to == lineLen) right = clientWidth;\n\
      if (fromArg == null && from == 0) left = pl;\n\
      rVal = retTop ? Math.min(rightPos.top, rVal) : Math.max(rightPos.bottom, rVal);\n\
      if (left < pl + 1) left = pl;\n\
      add(left, rightPos.top, right - left, rightPos.bottom);\n\
    });\n\
    return rVal;\n\
  }\n\
\n\
  if (sel.from.line == sel.to.line) {\n\
    drawForLine(sel.from.line, sel.from.ch, sel.to.ch);\n\
  } else {\n\
    var fromObj = getLine(doc, sel.from.line);\n\
    var cur = fromObj, merged, path = [sel.from.line, sel.from.ch], singleLine;\n\
    while (merged = collapsedSpanAtEnd(cur)) {\n\
      var found = merged.find();\n\
      path.push(found.from.ch, found.to.line, found.to.ch);\n\
      if (found.to.line == sel.to.line) {\n\
        path.push(sel.to.ch);\n\
        singleLine = true;\n\
        break;\n\
      }\n\
      cur = getLine(doc, found.to.line);\n\
    }\n\
\n\
    // This is a single, merged line\n\
    if (singleLine) {\n\
      for (var i = 0; i < path.length; i += 3)\n\
        drawForLine(path[i], path[i+1], path[i+2]);\n\
    } else {\n\
      var middleTop, middleBot, toObj = getLine(doc, sel.to.line);\n\
      if (sel.from.ch)\n\
        // Draw the first line of selection.\n\
        middleTop = drawForLine(sel.from.line, sel.from.ch, null, false);\n\
      else\n\
        // Simply include it in the middle block.\n\
        middleTop = heightAtLine(cm, fromObj) - display.viewOffset;\n\
\n\
      if (!sel.to.ch)\n\
        middleBot = heightAtLine(cm, toObj) - display.viewOffset;\n\
      else\n\
        middleBot = drawForLine(sel.to.line, collapsedSpanAtStart(toObj) ? null : 0, sel.to.ch, true);\n\
\n\
      if (middleTop < middleBot) add(pl, middleTop, null, middleBot);\n\
    }\n\
  }\n\
\n\
  removeChildrenAndAdd(display.selectionDiv, fragment);\n\
  display.selectionDiv.style.display = \"\";\n\
}\n\
\n\
// Cursor-blinking\n\
function restartBlink(cm) {\n\
  var display = cm.display;\n\
  clearInterval(display.blinker);\n\
  var on = true;\n\
  display.cursor.style.visibility = display.otherCursor.style.visibility = \"\";\n\
  display.blinker = setInterval(function() {\n\
    if (!display.cursor.offsetHeight) return;\n\
    display.cursor.style.visibility = display.otherCursor.style.visibility = (on = !on) ? \"\" : \"hidden\";\n\
  }, cm.options.cursorBlinkRate);\n\
}\n\
\n\
// HIGHLIGHT WORKER\n\
\n\
function startWorker(cm, time) {\n\
  if (cm.doc.mode.startState && cm.doc.frontier < cm.display.showingTo)\n\
    cm.state.highlight.set(time, bind(highlightWorker, cm));\n\
}\n\
\n\
function highlightWorker(cm) {\n\
  var doc = cm.doc;\n\
  if (doc.frontier < doc.first) doc.frontier = doc.first;\n\
  if (doc.frontier >= cm.display.showingTo) return;\n\
  var end = +new Date + cm.options.workTime;\n\
  var state = copyState(doc.mode, getStateBefore(cm, doc.frontier));\n\
  var changed = [], prevChange;\n\
  doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.showingTo + 500), function(line) {\n\
    if (doc.frontier >= cm.display.showingFrom) { // Visible\n\
      var oldStyles = line.styles;\n\
      line.styles = highlightLine(cm, line, state);\n\
      var ischange = !oldStyles || oldStyles.length != line.styles.length;\n\
      for (var i = 0; !ischange && i < oldStyles.length; ++i) ischange = oldStyles[i] != line.styles[i];\n\
      if (ischange) {\n\
        if (prevChange && prevChange.end == doc.frontier) prevChange.end++;\n\
        else changed.push(prevChange = {start: doc.frontier, end: doc.frontier + 1});\n\
      }\n\
      line.stateAfter = copyState(doc.mode, state);\n\
    } else {\n\
      processLine(cm, line, state);\n\
      line.stateAfter = doc.frontier % 5 == 0 ? copyState(doc.mode, state) : null;\n\
    }\n\
    ++doc.frontier;\n\
    if (+new Date > end) {\n\
      startWorker(cm, cm.options.workDelay);\n\
      return true;\n\
    }\n\
  });\n\
  if (changed.length)\n\
    operation(cm, function() {\n\
      for (var i = 0; i < changed.length; ++i)\n\
        regChange(this, changed[i].start, changed[i].end);\n\
    })();\n\
}\n\
\n\
// Finds the line to start with when starting a parse. Tries to\n\
// find a line with a stateAfter, so that it can start with a\n\
// valid state. If that fails, it returns the line with the\n\
// smallest indentation, which tends to need the least context to\n\
// parse correctly.\n\
function findStartLine(cm, n) {\n\
  var minindent, minline, doc = cm.doc;\n\
  for (var search = n, lim = n - 100; search > lim; --search) {\n\
    if (search <= doc.first) return doc.first;\n\
    var line = getLine(doc, search - 1);\n\
    if (line.stateAfter) return search;\n\
    var indented = countColumn(line.text, null, cm.options.tabSize);\n\
    if (minline == null || minindent > indented) {\n\
      minline = search - 1;\n\
      minindent = indented;\n\
    }\n\
  }\n\
  return minline;\n\
}\n\
\n\
function getStateBefore(cm, n) {\n\
  var doc = cm.doc, display = cm.display;\n\
    if (!doc.mode.startState) return true;\n\
  var pos = findStartLine(cm, n), state = pos > doc.first && getLine(doc, pos-1).stateAfter;\n\
  if (!state) state = startState(doc.mode);\n\
  else state = copyState(doc.mode, state);\n\
  doc.iter(pos, n, function(line) {\n\
    processLine(cm, line, state);\n\
    var save = pos == n - 1 || pos % 5 == 0 || pos >= display.showingFrom && pos < display.showingTo;\n\
    line.stateAfter = save ? copyState(doc.mode, state) : null;\n\
    ++pos;\n\
  });\n\
  return state;\n\
}\n\
\n\
// POSITION MEASUREMENT\n\
\n\
function paddingTop(display) {return display.lineSpace.offsetTop;}\n\
function paddingLeft(display) {\n\
  var e = removeChildrenAndAdd(display.measure, elt(\"pre\")).appendChild(elt(\"span\", \"x\"));\n\
  return e.offsetLeft;\n\
}\n\
\n\
function measureChar(cm, line, ch, data) {\n\
  var dir = -1;\n\
  data = data || measureLine(cm, line);\n\
  \n\
  for (var pos = ch;; pos += dir) {\n\
    var r = data[pos];\n\
    if (r) break;\n\
    if (dir < 0 && pos == 0) dir = 1;\n\
  }\n\
  return {left: pos < ch ? r.right : r.left,\n\
          right: pos > ch ? r.left : r.right,\n\
          top: r.top, bottom: r.bottom};\n\
}\n\
\n\
function measureLine(cm, line) {\n\
  // First look in the cache\n\
  var display = cm.display, cache = cm.display.measureLineCache;\n\
  for (var i = 0; i < cache.length; ++i) {\n\
    var memo = cache[i];\n\
    if (memo.text == line.text && memo.markedSpans == line.markedSpans &&\n\
        display.scroller.clientWidth == memo.width)\n\
      return memo.measure;\n\
  }\n\
  \n\
  var measure = measureLineInner(cm, line);\n\
  // Store result in the cache\n\
  var memo = {text: line.text, width: display.scroller.clientWidth,\n\
              markedSpans: line.markedSpans, measure: measure};\n\
  if (cache.length == 16) cache[++display.measureLineCachePos % 16] = memo;\n\
  else cache.push(memo);\n\
  return measure;\n\
}\n\
\n\
function measureLineInner(cm, line) {\n\
  var display = cm.display, measure = emptyArray(line.text.length);\n\
  var pre = lineContent(cm, line, measure);\n\
\n\
  // IE does not cache element positions of inline elements between\n\
  // calls to getBoundingClientRect. This makes the loop below,\n\
  // which gathers the positions of all the characters on the line,\n\
  // do an amount of layout work quadratic to the number of\n\
  // characters. When line wrapping is off, we try to improve things\n\
  // by first subdividing the line into a bunch of inline blocks, so\n\
  // that IE can reuse most of the layout information from caches\n\
  // for those blocks. This does interfere with line wrapping, so it\n\
  // doesn't work when wrapping is on, but in that case the\n\
  // situation is slightly better, since IE does cache line-wrapping\n\
  // information and only recomputes per-line.\n\
  if (ie && !ie_lt8 && !cm.options.lineWrapping && pre.childNodes.length > 100) {\n\
    var fragment = document.createDocumentFragment();\n\
    var chunk = 10, n = pre.childNodes.length;\n\
    for (var i = 0, chunks = Math.ceil(n / chunk); i < chunks; ++i) {\n\
      var wrap = elt(\"div\", null, null, \"display: inline-block\");\n\
      for (var j = 0; j < chunk && n; ++j) {\n\
        wrap.appendChild(pre.firstChild);\n\
        --n;\n\
      }\n\
      fragment.appendChild(wrap);\n\
    }\n\
    pre.appendChild(fragment);\n\
  }\n\
\n\
  removeChildrenAndAdd(display.measure, pre);\n\
\n\
  var outer = display.lineDiv.getBoundingClientRect();\n\
  var vranges = [], data = emptyArray(line.text.length), maxBot = pre.offsetHeight;\n\
  for (var i = 0, cur; i < measure.length; ++i) if (cur = measure[i]) {\n\
    var size = cur.getBoundingClientRect();\n\
    var top = Math.max(0, size.top - outer.top), bot = Math.min(size.bottom - outer.top, maxBot);\n\
    for (var j = 0; j < vranges.length; j += 2) {\n\
      var rtop = vranges[j], rbot = vranges[j+1];\n\
      if (rtop > bot || rbot < top) continue;\n\
      if (rtop <= top && rbot >= bot ||\n\
          top <= rtop && bot >= rbot ||\n\
          Math.min(bot, rbot) - Math.max(top, rtop) >= (bot - top) >> 1) {\n\
        vranges[j] = Math.min(top, rtop);\n\
        vranges[j+1] = Math.max(bot, rbot);\n\
        break;\n\
      }\n\
    }\n\
    if (j == vranges.length) vranges.push(top, bot);\n\
    data[i] = {left: size.left - outer.left, right: size.right - outer.left, top: j};\n\
  }\n\
  for (var i = 0, cur; i < data.length; ++i) if (cur = data[i]) {\n\
    var vr = cur.top;\n\
    cur.top = vranges[vr]; cur.bottom = vranges[vr+1];\n\
  }\n\
  return data;\n\
}\n\
\n\
function clearCaches(cm) {\n\
  cm.display.measureLineCache.length = cm.display.measureLineCachePos = 0;\n\
  cm.display.cachedCharWidth = cm.display.cachedTextHeight = null;\n\
  cm.display.maxLineChanged = true;\n\
}\n\
\n\
// Context is one of \"line\", \"div\" (display.lineDiv), \"local\"/null (editor), or \"page\"\n\
function intoCoordSystem(cm, lineObj, rect, context) {\n\
  if (lineObj.widgets) for (var i = 0; i < lineObj.widgets.length; ++i) if (lineObj.widgets[i].above) {\n\
    var size = widgetHeight(lineObj.widgets[i]);\n\
    rect.top += size; rect.bottom += size;\n\
  }\n\
  if (context == \"line\") return rect;\n\
  if (!context) context = \"local\";\n\
  var yOff = heightAtLine(cm, lineObj);\n\
  if (context != \"local\") yOff -= cm.display.viewOffset;\n\
  if (context == \"page\") {\n\
    var lOff = cm.display.lineSpace.getBoundingClientRect();\n\
    yOff += lOff.top + (window.pageYOffset || (document.documentElement || document.body).scrollTop);\n\
    var xOff = lOff.left + (window.pageXOffset || (document.documentElement || document.body).scrollLeft);\n\
    rect.left += xOff; rect.right += xOff;\n\
  }\n\
  rect.top += yOff; rect.bottom += yOff;\n\
  return rect;\n\
}\n\
\n\
function charCoords(cm, pos, context, lineObj) {\n\
  if (!lineObj) lineObj = getLine(cm.doc, pos.line);\n\
  return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch), context);\n\
}\n\
\n\
function cursorCoords(cm, pos, context, lineObj, measurement) {\n\
  lineObj = lineObj || getLine(cm.doc, pos.line);\n\
  if (!measurement) measurement = measureLine(cm, lineObj);\n\
  function get(ch, right) {\n\
    var m = measureChar(cm, lineObj, ch, measurement);\n\
    if (right) m.left = m.right; else m.right = m.left;\n\
    return intoCoordSystem(cm, lineObj, m, context);\n\
  }\n\
  var order = getOrder(lineObj), ch = pos.ch;\n\
  if (!order) return get(ch);\n\
  var main, other, linedir = order[0].level;\n\
  for (var i = 0; i < order.length; ++i) {\n\
    var part = order[i], rtl = part.level % 2, nb, here;\n\
    if (part.from < ch && part.to > ch) return get(ch, rtl);\n\
    var left = rtl ? part.to : part.from, right = rtl ? part.from : part.to;\n\
    if (left == ch) {\n\
      // Opera and IE return bogus offsets and widths for edges\n\
      // where the direction flips, but only for the side with the\n\
      // lower level. So we try to use the side with the higher\n\
      // level.\n\
      if (i && part.level < (nb = order[i-1]).level) here = get(nb.level % 2 ? nb.from : nb.to - 1, true);\n\
      else here = get(rtl && part.from != part.to ? ch - 1 : ch);\n\
      if (rtl == linedir) main = here; else other = here;\n\
    } else if (right == ch) {\n\
      var nb = i < order.length - 1 && order[i+1];\n\
      if (!rtl && nb && nb.from == nb.to) continue;\n\
      if (nb && part.level < nb.level) here = get(nb.level % 2 ? nb.to - 1 : nb.from);\n\
      else here = get(rtl ? ch : ch - 1, true);\n\
      if (rtl == linedir) main = here; else other = here;\n\
    }\n\
  }\n\
  if (linedir && !ch) other = get(order[0].to - 1);\n\
  if (!main) return other;\n\
  if (other) main.other = other;\n\
  return main;\n\
}\n\
\n\
// Coords must be lineSpace-local\n\
function coordsChar(cm, x, y) {\n\
  var doc = cm.doc;\n\
  y += cm.display.viewOffset;\n\
  if (y < 0) return {line: doc.first, ch: 0, outside: true};\n\
  var lineNo = lineAtHeight(doc, y), last = doc.first + doc.size - 1;\n\
  if (lineNo > last)\n\
    return {line: doc.size - 1, ch: getLine(doc, last).text.length};\n\
  if (x < 0) x = 0;\n\
\n\
  for (;;) {\n\
    var lineObj = getLine(doc, lineNo);\n\
    var found = coordsCharInner(cm, lineObj, lineNo, x, y);\n\
    var merged = collapsedSpanAtEnd(lineObj);\n\
    var mergedPos = merged && merged.find();\n\
    if (merged && found.ch >= mergedPos.from.ch)\n\
      lineNo = mergedPos.to.line;\n\
    else\n\
      return found;\n\
  }\n\
}\n\
\n\
function coordsCharInner(cm, lineObj, lineNo, x, y) {\n\
  var innerOff = y - heightAtLine(cm, lineObj);\n\
  var wrongLine = false, cWidth = cm.display.wrapper.clientWidth;\n\
  var measurement = measureLine(cm, lineObj);\n\
\n\
  function getX(ch) {\n\
    var sp = cursorCoords(cm, {line: lineNo, ch: ch}, \"line\",\n\
                          lineObj, measurement);\n\
    wrongLine = true;\n\
    if (innerOff > sp.bottom) return Math.max(0, sp.left - cWidth);\n\
    else if (innerOff < sp.top) return sp.left + cWidth;\n\
    else wrongLine = false;\n\
    return sp.left;\n\
  }\n\
\n\
  var bidi = getOrder(lineObj), dist = lineObj.text.length;\n\
  var from = lineLeft(lineObj), to = lineRight(lineObj);\n\
  var fromX = paddingLeft(cm.display), toX = getX(to);\n\
\n\
  if (x > toX) return {line: lineNo, ch: to, outside: wrongLine};\n\
  // Do a binary search between these bounds.\n\
  for (;;) {\n\
    if (bidi ? to == from || to == moveVisually(lineObj, from, 1) : to - from <= 1) {\n\
      var after = x - fromX < toX - x, ch = after ? from : to;\n\
      while (isExtendingChar.test(lineObj.text.charAt(ch))) ++ch;\n\
      return {line: lineNo, ch: ch, after: after, outside: wrongLine};\n\
    }\n\
    var step = Math.ceil(dist / 2), middle = from + step;\n\
    if (bidi) {\n\
      middle = from;\n\
      for (var i = 0; i < step; ++i) middle = moveVisually(lineObj, middle, 1);\n\
    }\n\
    var middleX = getX(middle);\n\
    if (middleX > x) {to = middle; toX = middleX; if (wrongLine) toX += 1000; dist -= step;}\n\
    else {from = middle; fromX = middleX; dist = step;}\n\
  }\n\
}\n\
\n\
var measureText;\n\
function textHeight(display) {\n\
  if (display.cachedTextHeight != null) return display.cachedTextHeight;\n\
  if (measureText == null) {\n\
    measureText = elt(\"pre\");\n\
    // Measure a bunch of lines, for browsers that compute\n\
    // fractional heights.\n\
    for (var i = 0; i < 49; ++i) {\n\
      measureText.appendChild(document.createTextNode(\"x\"));\n\
      measureText.appendChild(elt(\"br\"));\n\
    }\n\
    measureText.appendChild(document.createTextNode(\"x\"));\n\
  }\n\
  removeChildrenAndAdd(display.measure, measureText);\n\
  var height = measureText.offsetHeight / 50;\n\
  if (height > 3) display.cachedTextHeight = height;\n\
  removeChildren(display.measure);\n\
  return height || 1;\n\
}\n\
\n\
function charWidth(display) {\n\
  if (display.cachedCharWidth != null) return display.cachedCharWidth;\n\
  var anchor = elt(\"span\", \"x\");\n\
  var pre = elt(\"pre\", [anchor]);\n\
  removeChildrenAndAdd(display.measure, pre);\n\
  var width = anchor.offsetWidth;\n\
  if (width > 2) display.cachedCharWidth = width;\n\
  return width || 10;\n\
}\n\
\n\
// OPERATIONS\n\
\n\
// Operations are used to wrap changes in such a way that each\n\
// change won't have to update the cursor and display (which would\n\
// be awkward, slow, and error-prone), but instead updates are\n\
// batched and then all combined and executed at once.\n\
\n\
function startOperation(cm) {\n\
  cm.curOp = {\n\
    // An array of ranges of lines that have to be updated. See\n\
    // updateDisplay.\n\
    changes: [],\n\
    updateInput: null,\n\
    userSelChange: null,\n\
    textChanged: null,\n\
    selectionChanged: false,\n\
    updateMaxLine: false,\n\
    updateScrollPos: false,\n\
    id: ++cm.nextOpId\n\
  };\n\
  if (!delayedCallbackDepth++) delayedCallbacks = [];\n\
}\n\
\n\
function endOperation(cm) {\n\
  var op = cm.curOp, doc = cm.doc, delayed;\n\
  if (!--delayedCallbackDepth) {\n\
    delayed = delayedCallbacks;\n\
    delayedCallbacks = null;\n\
  }\n\
  cm.curOp = null;\n\
  var display = cm.display;\n\
  if (op.updateMaxLine) computeMaxLength(cm);\n\
  if (cm.display.maxLineChanged && !cm.options.lineWrapping) {\n\
    var width = measureChar(cm, cm.display.maxLine, cm.display.maxLine.text.length).right;\n\
    display.sizer.style.minWidth = (width + 3 + scrollerCutOff) + \"px\";\n\
    cm.display.maxLineChanged = false;\n\
    var maxScrollLeft = Math.max(0, display.sizer.offsetLeft + display.sizer.offsetWidth - display.scroller.clientWidth);\n\
    if (maxScrollLeft < doc.scrollLeft && !op.updateScrollPos)\n\
      setScrollLeft(cm, Math.min(display.scroller.scrollLeft, maxScrollLeft), true);\n\
  }\n\
  var newScrollPos, updated;\n\
  if (op.updateScrollPos) {\n\
    newScrollPos = op.updateScrollPos;\n\
  } else if (op.selectionChanged) {\n\
    var coords = cursorCoords(cm, doc.sel.head);\n\
    newScrollPos = calculateScrollPos(cm, coords.left, coords.top, coords.left, coords.bottom);\n\
  }\n\
  if (op.changes.length || newScrollPos && newScrollPos.scrollTop != null)\n\
    updated = updateDisplay(cm, op.changes, newScrollPos && newScrollPos.scrollTop);\n\
  if (!updated && op.selectionChanged) updateSelection(cm);\n\
  if (op.updateScrollPos) {\n\
    cm.display.scroller.scrollTop = cm.display.scrollbarV.scrollTop = doc.scrollTop = newScrollPos.scrollTop;\n\
    cm.display.scroller.scrollLeft = cm.display.scrollbarH.scrollLeft = doc.scrollLeft = newScrollPos.scrollLeft;\n\
    alignHorizontally(cm);\n\
  } else if (newScrollPos) {\n\
    scrollCursorIntoView(cm);\n\
  }\n\
  if (op.selectionChanged) restartBlink(cm);\n\
\n\
  if (cm.state.focused && op.updateInput)\n\
    resetInput(cm, op.userSelChange);\n\
\n\
  var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;\n\
  if (hidden) for (var i = 0; i < hidden.length; ++i)\n\
    if (!hidden[i].lines.length) signal(hidden[i], \"hide\");\n\
  if (unhidden) for (var i = 0; i < unhidden.length; ++i)\n\
    if (unhidden[i].lines.length) signal(unhidden[i], \"unhide\");\n\
\n\
  if (op.textChanged)\n\
    signal(cm, \"change\", cm, op.textChanged);\n\
  if (op.selectionChanged) signal(cm, \"cursorActivity\", cm);\n\
  if (delayed) for (var i = 0; i < delayed.length; ++i) delayed[i](cm);\n\
}\n\
\n\
// Wraps a function in an operation. Returns the wrapped function.\n\
function operation(cm1, f) {\n\
  return function() {\n\
    var cm = cm1 || this, withOp = !cm.curOp;\n\
    if (withOp) startOperation(cm);\n\
    try { var result = f.apply(cm, arguments); }\n\
    finally { if (withOp) endOperation(cm); }\n\
    return result;\n\
  };\n\
}\n\
function docOperation(f) {\n\
  return function() {\n\
    var withOp = this.cm && !this.cm.curOp, result;\n\
    if (withOp) startOperation(this.cm);\n\
    try { result = f.apply(this, arguments); }\n\
    finally { if (withOp) endOperation(this.cm); }\n\
    return result;\n\
  };\n\
}\n\
function runInOp(cm, f) {\n\
  var withOp = !cm.curOp, result;\n\
  if (withOp) startOperation(cm);\n\
  try { result = f(); }\n\
  finally { if (withOp) endOperation(cm); }\n\
  return result;\n\
}\n\
\n\
function regChange(cm, from, to, lendiff) {\n\
  if (from == null) from = cm.doc.first;\n\
  if (to == null) to = cm.doc.first + cm.doc.size;\n\
  cm.curOp.changes.push({from: from, to: to, diff: lendiff});\n\
}\n\
\n\
// INPUT HANDLING\n\
\n\
function slowPoll(cm) {\n\
  if (cm.display.pollingFast) return;\n\
  cm.display.poll.set(cm.options.pollInterval, function() {\n\
    readInput(cm);\n\
    if (cm.state.focused) slowPoll(cm);\n\
  });\n\
}\n\
\n\
function fastPoll(cm) {\n\
  var missed = false;\n\
  cm.display.pollingFast = true;\n\
  function p() {\n\
    var changed = readInput(cm);\n\
    if (!changed && !missed) {missed = true; cm.display.poll.set(60, p);}\n\
    else {cm.display.pollingFast = false; slowPoll(cm);}\n\
  }\n\
  cm.display.poll.set(20, p);\n\
}\n\
\n\
// prevInput is a hack to work with IME. If we reset the textarea\n\
// on every change, that breaks IME. So we look for changes\n\
// compared to the previous content instead. (Modern browsers have\n\
// events that indicate IME taking place, but these are not widely\n\
// supported or compatible enough yet to rely on.)\n\
function readInput(cm) {\n\
  var input = cm.display.input, prevInput = cm.display.prevInput, doc = cm.doc, sel = doc.sel;\n\
  if (!cm.state.focused || hasSelection(input) || isReadOnly(cm)) return false;\n\
  var text = input.value;\n\
  if (text == prevInput && posEq(sel.from, sel.to)) return false;\n\
  var withOp = !cm.curOp;\n\
  if (withOp) startOperation(cm);\n\
  sel.shift = false;\n\
  var same = 0, l = Math.min(prevInput.length, text.length);\n\
  while (same < l && prevInput[same] == text[same]) ++same;\n\
  var from = sel.from, to = sel.to;\n\
  if (same < prevInput.length)\n\
    from = {line: from.line, ch: from.ch - (prevInput.length - same)};\n\
  else if (cm.state.overwrite && posEq(from, to) && !cm.state.pasteIncoming)\n\
    to = {line: to.line, ch: Math.min(getLine(doc, to.line).text.length, to.ch + (text.length - same))};\n\
  var updateInput = cm.curOp.updateInput;\n\
  makeChange(cm.doc, {from: from, to: to, text: splitLines(text.slice(same)),\n\
                      origin: cm.state.pasteIncoming ? \"paste\" : \"input\"}, \"end\");\n\
             \n\
  cm.curOp.updateInput = updateInput;\n\
  if (text.length > 1000) input.value = cm.display.prevInput = \"\";\n\
  else cm.display.prevInput = text;\n\
  if (withOp) endOperation(cm);\n\
  cm.state.pasteIncoming = false;\n\
  return true;\n\
}\n\
\n\
function resetInput(cm, user) {\n\
  var minimal, selected, doc = cm.doc;\n\
  if (!posEq(doc.sel.from, doc.sel.to)) {\n\
    cm.display.prevInput = \"\";\n\
    minimal = hasCopyEvent &&\n\
      (doc.sel.to.line - doc.sel.from.line > 100 || (selected = cm.getSelection()).length > 1000);\n\
    if (minimal) cm.display.input.value = \"-\";\n\
    else cm.display.input.value = selected || cm.getSelection();\n\
    if (cm.state.focused) selectInput(cm.display.input);\n\
  } else if (user) cm.display.prevInput = cm.display.input.value = \"\";\n\
  cm.display.inaccurateSelection = minimal;\n\
}\n\
\n\
function focusInput(cm) {\n\
  if (cm.options.readOnly != \"nocursor\" && (ie || document.activeElement != cm.display.input))\n\
    cm.display.input.focus();\n\
}\n\
\n\
function isReadOnly(cm) {\n\
  return cm.options.readOnly || cm.doc.cantEdit;\n\
}\n\
\n\
// EVENT HANDLERS\n\
\n\
function registerEventHandlers(cm) {\n\
  var d = cm.display;\n\
  on(d.scroller, \"mousedown\", operation(cm, onMouseDown));\n\
  on(d.scroller, \"dblclick\", operation(cm, e_preventDefault));\n\
  on(d.lineSpace, \"selectstart\", function(e) {\n\
    if (!eventInWidget(d, e)) e_preventDefault(e);\n\
  });\n\
  // Gecko browsers fire contextmenu *after* opening the menu, at\n\
  // which point we can't mess with it anymore. Context menu is\n\
  // handled in onMouseDown for Gecko.\n\
  if (!gecko) on(d.scroller, \"contextmenu\", function(e) {onContextMenu(cm, e);});\n\
\n\
  on(d.scroller, \"scroll\", function() {\n\
    setScrollTop(cm, d.scroller.scrollTop);\n\
    setScrollLeft(cm, d.scroller.scrollLeft, true);\n\
    signal(cm, \"scroll\", cm);\n\
  });\n\
  on(d.scrollbarV, \"scroll\", function() {\n\
    setScrollTop(cm, d.scrollbarV.scrollTop);\n\
  });\n\
  on(d.scrollbarH, \"scroll\", function() {\n\
    setScrollLeft(cm, d.scrollbarH.scrollLeft);\n\
  });\n\
\n\
  on(d.scroller, \"mousewheel\", function(e){onScrollWheel(cm, e);});\n\
  on(d.scroller, \"DOMMouseScroll\", function(e){onScrollWheel(cm, e);});\n\
\n\
  function reFocus() { if (cm.state.focused) setTimeout(bind(focusInput, cm), 0); }\n\
  on(d.scrollbarH, \"mousedown\", reFocus);\n\
  on(d.scrollbarV, \"mousedown\", reFocus);\n\
  // Prevent wrapper from ever scrolling\n\
  on(d.wrapper, \"scroll\", function() { d.wrapper.scrollTop = d.wrapper.scrollLeft = 0; });\n\
\n\
  function onResize() {\n\
    // Might be a text scaling operation, clear size caches.\n\
    d.cachedCharWidth = d.cachedTextHeight = null;\n\
    clearCaches(cm);\n\
    runInOp(cm, bind(regChange, cm));\n\
  }\n\
  on(window, \"resize\", onResize);\n\
  // Above handler holds on to the editor and its data structures.\n\
  // Here we poll to unregister it when the editor is no longer in\n\
  // the document, so that it can be garbage-collected.\n\
  setTimeout(function unregister() {\n\
    for (var p = d.wrapper.parentNode; p && p != document.body; p = p.parentNode) {}\n\
    if (p) setTimeout(unregister, 5000);\n\
    else off(window, \"resize\", onResize);\n\
  }, 5000);\n\
\n\
  on(d.input, \"keyup\", operation(cm, function(e) {\n\
    if (cm.options.onKeyEvent && cm.options.onKeyEvent(cm, addStop(e))) return;\n\
    if (e_prop(e, \"keyCode\") == 16) cm.doc.sel.shift = false;\n\
  }));\n\
  on(d.input, \"input\", bind(fastPoll, cm));\n\
  on(d.input, \"keydown\", operation(cm, onKeyDown));\n\
  on(d.input, \"keypress\", operation(cm, onKeyPress));\n\
  on(d.input, \"focus\", bind(onFocus, cm));\n\
  on(d.input, \"blur\", bind(onBlur, cm));\n\
\n\
  function drag_(e) {\n\
    if (cm.options.onDragEvent && cm.options.onDragEvent(cm, addStop(e))) return;\n\
    e_stop(e);\n\
  }\n\
  if (cm.options.dragDrop) {\n\
    on(d.scroller, \"dragstart\", function(e){onDragStart(cm, e);});\n\
    on(d.scroller, \"dragenter\", drag_);\n\
    on(d.scroller, \"dragover\", drag_);\n\
    on(d.scroller, \"drop\", operation(cm, onDrop));\n\
  }\n\
  on(d.scroller, \"paste\", function(e){\n\
    if (eventInWidget(d, e)) return;\n\
    focusInput(cm); \n\
    fastPoll(cm);\n\
  });\n\
  on(d.input, \"paste\", function() {\n\
    cm.state.pasteIncoming = true;\n\
    fastPoll(cm);\n\
  });\n\
\n\
  function prepareCopy() {\n\
    if (d.inaccurateSelection) {\n\
      d.prevInput = \"\";\n\
      d.inaccurateSelection = false;\n\
      d.input.value = cm.getSelection();\n\
      selectInput(d.input);\n\
    }\n\
  }\n\
  on(d.input, \"cut\", prepareCopy);\n\
  on(d.input, \"copy\", prepareCopy);\n\
\n\
  // Needed to handle Tab key in KHTML\n\
  if (khtml) on(d.sizer, \"mouseup\", function() {\n\
      if (document.activeElement == d.input) d.input.blur();\n\
      focusInput(cm);\n\
  });\n\
}\n\
\n\
function eventInWidget(display, e) {\n\
  for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {\n\
    if (!n) return true;\n\
    if (/\\bCodeMirror-(?:line)?widget\\b/.test(n.className) ||\n\
        n.parentNode == display.sizer && n != display.mover) return true;\n\
  }\n\
}\n\
\n\
function posFromMouse(cm, e, liberal) {\n\
  var display = cm.display;\n\
  if (!liberal) {\n\
    var target = e_target(e);\n\
    if (target == display.scrollbarH || target == display.scrollbarH.firstChild ||\n\
        target == display.scrollbarV || target == display.scrollbarV.firstChild ||\n\
        target == display.scrollbarFiller) return null;\n\
  }\n\
  var x, y, space = display.lineSpace.getBoundingClientRect();\n\
  // Fails unpredictably on IE[67] when mouse is dragged around quickly.\n\
  try { x = e.clientX; y = e.clientY; } catch (e) { return null; }\n\
  return coordsChar(cm, x - space.left, y - space.top);\n\
}\n\
\n\
var lastClick, lastDoubleClick;\n\
function onMouseDown(e) {\n\
  var cm = this, display = cm.display, doc = cm.doc, sel = doc.sel;\n\
  sel.shift = e_prop(e, \"shiftKey\");\n\
\n\
  if (eventInWidget(display, e)) {\n\
    if (!webkit) {\n\
      display.scroller.draggable = false;\n\
      setTimeout(function(){display.scroller.draggable = true;}, 100);\n\
    }\n\
    return;\n\
  }\n\
  if (clickInGutter(cm, e)) return;\n\
  var start = posFromMouse(cm, e);\n\
\n\
  switch (e_button(e)) {\n\
  case 3:\n\
    if (gecko) onContextMenu.call(cm, cm, e);\n\
    return;\n\
  case 2:\n\
    if (start) extendSelection(cm.doc, start);\n\
    setTimeout(bind(focusInput, cm), 20);\n\
    e_preventDefault(e);\n\
    return;\n\
  }\n\
  // For button 1, if it was clicked inside the editor\n\
  // (posFromMouse returning non-null), we have to adjust the\n\
  // selection.\n\
  if (!start) {if (e_target(e) == display.scroller) e_preventDefault(e); return;}\n\
\n\
  if (!cm.state.focused) onFocus(cm);\n\
\n\
  var now = +new Date, type = \"single\";\n\
  if (lastDoubleClick && lastDoubleClick.time > now - 400 && posEq(lastDoubleClick.pos, start)) {\n\
    type = \"triple\";\n\
    e_preventDefault(e);\n\
    setTimeout(bind(focusInput, cm), 20);\n\
    selectLine(cm, start.line);\n\
  } else if (lastClick && lastClick.time > now - 400 && posEq(lastClick.pos, start)) {\n\
    type = \"double\";\n\
    lastDoubleClick = {time: now, pos: start};\n\
    e_preventDefault(e);\n\
    var word = findWordAt(getLine(doc, start.line).text, start);\n\
    extendSelection(cm.doc, word.from, word.to);\n\
  } else { lastClick = {time: now, pos: start}; }\n\
\n\
  var last = start;\n\
  if (cm.options.dragDrop && dragAndDrop && !isReadOnly(cm) && !posEq(sel.from, sel.to) &&\n\
      !posLess(start, sel.from) && !posLess(sel.to, start) && type == \"single\") {\n\
    var dragEnd = operation(cm, function(e2) {\n\
      if (webkit) display.scroller.draggable = false;\n\
      cm.state.draggingText = false;\n\
      off(document, \"mouseup\", dragEnd);\n\
      off(display.scroller, \"drop\", dragEnd);\n\
      if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10) {\n\
        e_preventDefault(e2);\n\
        extendSelection(cm.doc, start);\n\
        focusInput(cm);\n\
      }\n\
    });\n\
    // Let the drag handler handle this.\n\
    if (webkit) display.scroller.draggable = true;\n\
    cm.state.draggingText = dragEnd;\n\
    // IE's approach to draggable\n\
    if (display.scroller.dragDrop) display.scroller.dragDrop();\n\
    on(document, \"mouseup\", dragEnd);\n\
    on(display.scroller, \"drop\", dragEnd);\n\
    return;\n\
  }\n\
  e_preventDefault(e);\n\
  if (type == \"single\") extendSelection(cm.doc, clipPos(doc, start));\n\
\n\
  var startstart = sel.from, startend = sel.to;\n\
\n\
  function doSelect(cur) {\n\
    if (type == \"single\") {\n\
      extendSelection(cm.doc, clipPos(doc, start), cur);\n\
      return;\n\
    }\n\
\n\
    startstart = clipPos(doc, startstart);\n\
    startend = clipPos(doc, startend);\n\
    if (type == \"double\") {\n\
      var word = findWordAt(getLine(doc, cur.line).text, cur);\n\
      if (posLess(cur, startstart)) extendSelection(cm.doc, word.from, startend);\n\
      else extendSelection(cm.doc, startstart, word.to);\n\
    } else if (type == \"triple\") {\n\
      if (posLess(cur, startstart)) extendSelection(cm.doc, startend, clipPos(doc, {line: cur.line, ch: 0}));\n\
      else extendSelection(cm.doc, startstart, clipPos(doc, {line: cur.line + 1, ch: 0}));\n\
    }\n\
  }\n\
\n\
  var editorSize = display.wrapper.getBoundingClientRect();\n\
  // Used to ensure timeout re-tries don't fire when another extend\n\
  // happened in the meantime (clearTimeout isn't reliable -- at\n\
  // least on Chrome, the timeouts still happen even when cleared,\n\
  // if the clear happens after their scheduled firing time).\n\
  var counter = 0;\n\
\n\
  function extend(e) {\n\
    var curCount = ++counter;\n\
    var cur = posFromMouse(cm, e, true);\n\
    if (!cur) return;\n\
    if (!posEq(cur, last)) {\n\
      if (!cm.state.focused) onFocus(cm);\n\
      last = cur;\n\
      doSelect(cur);\n\
      var visible = visibleLines(display, doc);\n\
      if (cur.line >= visible.to || cur.line < visible.from)\n\
        setTimeout(operation(cm, function(){if (counter == curCount) extend(e);}), 150);\n\
    } else {\n\
      var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;\n\
      if (outside) setTimeout(operation(cm, function() {\n\
        if (counter != curCount) return;\n\
        display.scroller.scrollTop += outside;\n\
        extend(e);\n\
      }), 50);\n\
    }\n\
  }\n\
\n\
  function done(e) {\n\
    counter = Infinity;\n\
    var cur = posFromMouse(cm, e);\n\
    if (cur) doSelect(cur);\n\
    e_preventDefault(e);\n\
    focusInput(cm);\n\
    off(document, \"mousemove\", move);\n\
    off(document, \"mouseup\", up);\n\
  }\n\
\n\
  var move = operation(cm, function(e) {\n\
    if (!ie && !e_button(e)) done(e);\n\
    else extend(e);\n\
  });\n\
  var up = operation(cm, done);\n\
  on(document, \"mousemove\", move);\n\
  on(document, \"mouseup\", up);\n\
}\n\
\n\
function onDrop(e) {\n\
  var cm = this;\n\
  if (eventInWidget(cm.display, e) || (cm.options.onDragEvent && cm.options.onDragEvent(cm, addStop(e))))\n\
    return;\n\
  e_preventDefault(e);\n\
  var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;\n\
  if (!pos || isReadOnly(cm)) return;\n\
  if (files && files.length && window.FileReader && window.File) {\n\
    var n = files.length, text = Array(n), read = 0;\n\
    var loadFile = function(file, i) {\n\
      var reader = new FileReader;\n\
      reader.onload = function() {\n\
        text[i] = reader.result;\n\
        if (++read == n) {\n\
          pos = clipPos(cm.doc, pos);\n\
          replaceRange(cm.doc, text.join(\"\"), pos, \"around\", \"paste\");\n\
        }\n\
      };\n\
      reader.readAsText(file);\n\
    };\n\
    for (var i = 0; i < n; ++i) loadFile(files[i], i);\n\
  } else {\n\
    // Don't do a replace if the drop happened inside of the selected text.\n\
    if (cm.state.draggingText && !(posLess(pos, cm.doc.sel.from) || posLess(cm.doc.sel.to, pos))) {\n\
      cm.state.draggingText(e);\n\
      // Ensure the editor is re-focused\n\
      setTimeout(bind(focusInput, cm), 20);\n\
      return;\n\
    }\n\
    try {\n\
      var text = e.dataTransfer.getData(\"Text\");\n\
      if (text) {\n\
        var curFrom = cm.doc.sel.from, curTo = cm.doc.sel.to;\n\
        setSelection(cm.doc, pos, pos);\n\
        if (cm.state.draggingText) replaceRange(cm.doc, \"\", curFrom, curTo, \"paste\");\n\
        cm.replaceSelection(text, null, \"paste\");\n\
        focusInput(cm);\n\
        onFocus(cm);\n\
      }\n\
    }\n\
    catch(e){}\n\
  }\n\
}\n\
\n\
function clickInGutter(cm, e) {\n\
  var display = cm.display;\n\
  try { var mX = e.clientX, mY = e.clientY; }\n\
  catch(e) { return false; }\n\
\n\
  if (mX >= Math.floor(display.gutters.getBoundingClientRect().right)) return false;\n\
  e_preventDefault(e);\n\
  if (!hasHandler(cm, \"gutterClick\")) return true;\n\
\n\
  var lineBox = display.lineDiv.getBoundingClientRect();\n\
  if (mY > lineBox.bottom) return true;\n\
  mY -= lineBox.top - display.viewOffset;\n\
\n\
  for (var i = 0; i < cm.options.gutters.length; ++i) {\n\
    var g = display.gutters.childNodes[i];\n\
    if (g && g.getBoundingClientRect().right >= mX) {\n\
      var line = lineAtHeight(cm.doc, mY);\n\
      var gutter = cm.options.gutters[i];\n\
      signalLater(cm, \"gutterClick\", cm, line, gutter, e);\n\
      break;\n\
    }\n\
  }\n\
  return true;\n\
}\n\
\n\
function onDragStart(cm, e) {\n\
  if (eventInWidget(cm.display, e)) return;\n\
  \n\
  var txt = cm.getSelection();\n\
  e.dataTransfer.setData(\"Text\", txt);\n\
\n\
  // Use dummy image instead of default browsers image.\n\
  // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.\n\
  if (e.dataTransfer.setDragImage && !safari) {\n\
    var img = elt(\"img\", null, null, \"position: fixed; left: 0; top: 0;\");\n\
    if (opera) {\n\
      img.width = img.height = 1;\n\
      cm.display.wrapper.appendChild(img);\n\
      // Force a relayout, or Opera won't use our image for some obscure reason\n\
      img._top = img.offsetTop;\n\
    }\n\
    e.dataTransfer.setDragImage(img, 0, 0);\n\
    if (opera) img.parentNode.removeChild(img);\n\
  }\n\
}\n\
\n\
function setScrollTop(cm, val) {\n\
  if (Math.abs(cm.doc.scrollTop - val) < 2) return;\n\
  cm.doc.scrollTop = val;\n\
  if (!gecko) updateDisplay(cm, [], val);\n\
  if (cm.display.scroller.scrollTop != val) cm.display.scroller.scrollTop = val;\n\
  if (cm.display.scrollbarV.scrollTop != val) cm.display.scrollbarV.scrollTop = val;\n\
  if (gecko) updateDisplay(cm, []);\n\
}\n\
function setScrollLeft(cm, val, isScroller) {\n\
  if (isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) return;\n\
  val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);\n\
  cm.doc.scrollLeft = val;\n\
  alignHorizontally(cm);\n\
  if (cm.display.scroller.scrollLeft != val) cm.display.scroller.scrollLeft = val;\n\
  if (cm.display.scrollbarH.scrollLeft != val) cm.display.scrollbarH.scrollLeft = val;\n\
}\n\
\n\
// Since the delta values reported on mouse wheel events are\n\
// unstandardized between browsers and even browser versions, and\n\
// generally horribly unpredictable, this code starts by measuring\n\
// the scroll effect that the first few mouse wheel events have,\n\
// and, from that, detects the way it can convert deltas to pixel\n\
// offsets afterwards.\n\
//\n\
// The reason we want to know the amount a wheel event will scroll\n\
// is that it gives us a chance to update the display before the\n\
// actual scrolling happens, reducing flickering.\n\
\n\
var wheelSamples = 0, wheelPixelsPerUnit = null;\n\
// Fill in a browser-detected starting value on browsers where we\n\
// know one. These don't have to be accurate -- the result of them\n\
// being wrong would just be a slight flicker on the first wheel\n\
// scroll (if it is large enough).\n\
if (ie) wheelPixelsPerUnit = -.53;\n\
else if (gecko) wheelPixelsPerUnit = 15;\n\
else if (chrome) wheelPixelsPerUnit = -.7;\n\
else if (safari) wheelPixelsPerUnit = -1/3;\n\
\n\
function onScrollWheel(cm, e) {\n\
  var dx = e.wheelDeltaX, dy = e.wheelDeltaY;\n\
  if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) dx = e.detail;\n\
  if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) dy = e.detail;\n\
  else if (dy == null) dy = e.wheelDelta;\n\
\n\
  // Webkit browsers on OS X abort momentum scrolls when the target\n\
  // of the scroll event is removed from the scrollable element.\n\
  // This hack (see related code in patchDisplay) makes sure the\n\
  // element is kept around.\n\
  if (dy && mac && webkit) {\n\
    for (var cur = e.target; cur != scroll; cur = cur.parentNode) {\n\
      if (cur.lineObj) {\n\
        cm.display.currentWheelTarget = cur;\n\
        break;\n\
      }\n\
    }\n\
  }\n\
\n\
  var display = cm.display, scroll = display.scroller;\n\
  // On some browsers, horizontal scrolling will cause redraws to\n\
  // happen before the gutter has been realigned, causing it to\n\
  // wriggle around in a most unseemly way. When we have an\n\
  // estimated pixels/delta value, we just handle horizontal\n\
  // scrolling entirely here. It'll be slightly off from native, but\n\
  // better than glitching out.\n\
  if (dx && !gecko && !opera && wheelPixelsPerUnit != null) {\n\
    if (dy)\n\
      setScrollTop(cm, Math.max(0, Math.min(scroll.scrollTop + dy * wheelPixelsPerUnit, scroll.scrollHeight - scroll.clientHeight)));\n\
    setScrollLeft(cm, Math.max(0, Math.min(scroll.scrollLeft + dx * wheelPixelsPerUnit, scroll.scrollWidth - scroll.clientWidth)));\n\
    e_preventDefault(e);\n\
    display.wheelStartX = null; // Abort measurement, if in progress\n\
    return;\n\
  }\n\
\n\
  if (dy && wheelPixelsPerUnit != null) {\n\
    var pixels = dy * wheelPixelsPerUnit;\n\
    var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;\n\
    if (pixels < 0) top = Math.max(0, top + pixels - 50);\n\
    else bot = Math.min(cm.doc.height, bot + pixels + 50);\n\
    updateDisplay(cm, [], {top: top, bottom: bot});\n\
  }\n\
\n\
  if (wheelSamples < 20) {\n\
    if (display.wheelStartX == null) {\n\
      display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop;\n\
      display.wheelDX = dx; display.wheelDY = dy;\n\
      setTimeout(function() {\n\
        if (display.wheelStartX == null) return;\n\
        var movedX = scroll.scrollLeft - display.wheelStartX;\n\
        var movedY = scroll.scrollTop - display.wheelStartY;\n\
        var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||\n\
          (movedX && display.wheelDX && movedX / display.wheelDX);\n\
        display.wheelStartX = display.wheelStartY = null;\n\
        if (!sample) return;\n\
        wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);\n\
        ++wheelSamples;\n\
      }, 200);\n\
    } else {\n\
      display.wheelDX += dx; display.wheelDY += dy;\n\
    }\n\
  }\n\
}\n\
\n\
function doHandleBinding(cm, bound, dropShift) {\n\
  if (typeof bound == \"string\") {\n\
    bound = commands[bound];\n\
    if (!bound) return false;\n\
  }\n\
  // Ensure previous input has been read, so that the handler sees a\n\
  // consistent view of the document\n\
  if (cm.display.pollingFast && readInput(cm)) cm.display.pollingFast = false;\n\
  var doc = cm.doc, prevShift = doc.sel.shift;\n\
  try {\n\
    if (isReadOnly(cm)) cm.state.suppressEdits = true;\n\
    if (dropShift) doc.sel.shift = false;\n\
    bound(cm);\n\
  } catch(e) {\n\
    if (e != Pass) throw e;\n\
    return false;\n\
  } finally {\n\
    doc.sel.shift = prevShift;\n\
    cm.state.suppressEdits = false;\n\
  }\n\
  return true;\n\
}\n\
\n\
function allKeyMaps(cm) {\n\
  var maps = cm.state.keyMaps.slice(0);\n\
  maps.push(cm.options.keyMap);\n\
  if (cm.options.extraKeys) maps.unshift(cm.options.extraKeys);\n\
  return maps;\n\
}\n\
\n\
var maybeTransition;\n\
function handleKeyBinding(cm, e) {\n\
  // Handle auto keymap transitions\n\
  var startMap = getKeyMap(cm.options.keyMap), next = startMap.auto;\n\
  clearTimeout(maybeTransition);\n\
  if (next && !isModifierKey(e)) maybeTransition = setTimeout(function() {\n\
    if (getKeyMap(cm.options.keyMap) == startMap)\n\
      cm.options.keyMap = (next.call ? next.call(null, cm) : next);\n\
  }, 50);\n\
\n\
  var name = keyNames[e_prop(e, \"keyCode\")], handled = false;\n\
  if (name == null || e.altGraphKey) return false;\n\
  if (e_prop(e, \"altKey\")) name = \"Alt-\" + name;\n\
  if (e_prop(e, flipCtrlCmd ? \"metaKey\" : \"ctrlKey\")) name = \"Ctrl-\" + name;\n\
  if (e_prop(e, flipCtrlCmd ? \"ctrlKey\" : \"metaKey\")) name = \"Cmd-\" + name;\n\
\n\
  var stopped = false;\n\
  function stop() { stopped = true; }\n\
  var keymaps = allKeyMaps(cm);\n\
\n\
  if (e_prop(e, \"shiftKey\")) {\n\
    handled = lookupKey(\"Shift-\" + name, keymaps,\n\
                        function(b) {return doHandleBinding(cm, b, true);}, stop)\n\
      || lookupKey(name, keymaps, function(b) {\n\
        if (typeof b == \"string\" && /^go[A-Z]/.test(b)) return doHandleBinding(cm, b);\n\
      }, stop);\n\
  } else {\n\
    handled = lookupKey(name, keymaps,\n\
                        function(b) { return doHandleBinding(cm, b); }, stop);\n\
  }\n\
  if (stopped) handled = false;\n\
  if (handled) {\n\
    e_preventDefault(e);\n\
    restartBlink(cm);\n\
    if (ie_lt9) { e.oldKeyCode = e.keyCode; e.keyCode = 0; }\n\
  }\n\
  return handled;\n\
}\n\
\n\
function handleCharBinding(cm, e, ch) {\n\
  var handled = lookupKey(\"'\" + ch + \"'\", allKeyMaps(cm),\n\
                          function(b) { return doHandleBinding(cm, b, true); });\n\
  if (handled) {\n\
    e_preventDefault(e);\n\
    restartBlink(cm);\n\
  }\n\
  return handled;\n\
}\n\
\n\
var lastStoppedKey = null;\n\
function onKeyDown(e) {\n\
  var cm = this;\n\
  if (!cm.state.focused) onFocus(cm);\n\
  if (ie && e.keyCode == 27) { e.returnValue = false; }\n\
  if (cm.options.onKeyEvent && cm.options.onKeyEvent(cm, addStop(e))) return;\n\
  var code = e_prop(e, \"keyCode\");\n\
  // IE does strange things with escape.\n\
  cm.doc.sel.shift = code == 16 || e_prop(e, \"shiftKey\");\n\
  // First give onKeyEvent option a chance to handle this.\n\
  var handled = handleKeyBinding(cm, e);\n\
  if (opera) {\n\
    lastStoppedKey = handled ? code : null;\n\
    // Opera has no cut event... we try to at least catch the key combo\n\
    if (!handled && code == 88 && !hasCopyEvent && e_prop(e, mac ? \"metaKey\" : \"ctrlKey\"))\n\
      cm.replaceSelection(\"\");\n\
  }\n\
}\n\
\n\
function onKeyPress(e) {\n\
  var cm = this;\n\
  if (cm.options.onKeyEvent && cm.options.onKeyEvent(cm, addStop(e))) return;\n\
  var keyCode = e_prop(e, \"keyCode\"), charCode = e_prop(e, \"charCode\");\n\
  if (opera && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return;}\n\
  if (((opera && (!e.which || e.which < 10)) || khtml) && handleKeyBinding(cm, e)) return;\n\
  var ch = String.fromCharCode(charCode == null ? keyCode : charCode);\n\
  if (this.options.electricChars && this.doc.mode.electricChars &&\n\
      this.options.smartIndent && !isReadOnly(this) &&\n\
      this.doc.mode.electricChars.indexOf(ch) > -1)\n\
    setTimeout(operation(cm, function() {indentLine(cm, cm.doc.sel.to.line, \"smart\");}), 75);\n\
  if (handleCharBinding(cm, e, ch)) return;\n\
  fastPoll(cm);\n\
}\n\
\n\
function onFocus(cm) {\n\
  if (cm.options.readOnly == \"nocursor\") return;\n\
  if (!cm.state.focused) {\n\
    signal(cm, \"focus\", cm);\n\
    cm.state.focused = true;\n\
    if (cm.display.wrapper.className.search(/\\bCodeMirror-focused\\b/) == -1)\n\
      cm.display.wrapper.className += \" CodeMirror-focused\";\n\
    resetInput(cm, true);\n\
  }\n\
  slowPoll(cm);\n\
  restartBlink(cm);\n\
}\n\
function onBlur(cm) {\n\
  if (cm.state.focused) {\n\
    signal(cm, \"blur\", cm);\n\
    cm.state.focused = false;\n\
    cm.display.wrapper.className = cm.display.wrapper.className.replace(\" CodeMirror-focused\", \"\");\n\
  }\n\
  clearInterval(cm.display.blinker);\n\
  setTimeout(function() {if (!cm.state.focused) cm.doc.sel.shift = false;}, 150);\n\
}\n\
\n\
var detectingSelectAll;\n\
function onContextMenu(cm, e) {\n\
  var display = cm.display, sel = cm.doc.sel;\n\
  if (eventInWidget(display, e)) return;\n\
\n\
  var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;\n\
  if (!pos || opera) return; // Opera is difficult.\n\
  if (posEq(sel.from, sel.to) || posLess(pos, sel.from) || !posLess(pos, sel.to))\n\
    operation(cm, setSelection)(cm.doc, pos, pos);\n\
\n\
  var oldCSS = display.input.style.cssText;\n\
  display.inputDiv.style.position = \"absolute\";\n\
  display.input.style.cssText = \"position: fixed; width: 30px; height: 30px; top: \" + (e.clientY - 5) +\n\
    \"px; left: \" + (e.clientX - 5) + \"px; z-index: 1000; background: white; outline: none;\" +\n\
    \"border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);\";\n\
  focusInput(cm);\n\
  resetInput(cm, true);\n\
  // Adds \"Select all\" to context menu in FF\n\
  if (posEq(sel.from, sel.to)) display.input.value = display.prevInput = \" \";\n\
\n\
  function rehide() {\n\
    display.inputDiv.style.position = \"relative\";\n\
    display.input.style.cssText = oldCSS;\n\
    if (ie_lt9) display.scrollbarV.scrollTop = display.scroller.scrollTop = scrollPos;\n\
    slowPoll(cm);\n\
\n\
    // Try to detect the user choosing select-all \n\
    if (display.input.selectionStart != null) {\n\
      clearTimeout(detectingSelectAll);\n\
      var extval = display.input.value = \" \" + (posEq(sel.from, sel.to) ? \"\" : display.input.value), i = 0;\n\
      display.prevInput = \" \";\n\
      display.input.selectionStart = 1; display.input.selectionEnd = extval.length;\n\
      detectingSelectAll = setTimeout(function poll(){\n\
        if (display.prevInput == \" \" && display.input.selectionStart == 0)\n\
          operation(cm, commands.selectAll)(cm);\n\
        else if (i++ < 10) detectingSelectAll = setTimeout(poll, 500);\n\
        else resetInput(cm);\n\
      }, 200);\n\
    }\n\
  }\n\
\n\
  if (gecko) {\n\
    e_stop(e);\n\
    on(window, \"mouseup\", function mouseup() {\n\
      off(window, \"mouseup\", mouseup);\n\
      setTimeout(rehide, 20);\n\
    });\n\
  } else {\n\
    setTimeout(rehide, 50);\n\
  }\n\
}\n\
\n\
// UPDATING\n\
\n\
function changeEnd(change) {\n\
  return {line: change.from.line + change.text.length - 1,\n\
          ch: lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0)};\n\
}\n\
\n\
// Hint can be null|\"end\"|\"start\"|\"around\"|{anchor,head}\n\
function computeSelAfterChange(sel, change, hint) {\n\
  if (hint && typeof hint == \"object\") return hint; // Assumed to be {from, to} object\n\
  if (hint == \"start\") return {anchor: change.from, head: change.from};\n\
  \n\
  var end = changeEnd(change);\n\
  if (hint == \"around\") return {anchor: change.from, head: end};\n\
  if (hint == \"end\") return {anchor: end, head: end};\n\
\n\
  // hint is null, leave the selection alone as much as possible\n\
  var adjustPos = function(pos) {\n\
    if (posLess(pos, change.from)) return pos;\n\
    if (!posLess(change.to, pos)) return end;\n\
\n\
    var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;\n\
    if (pos.line == change.to.line) ch += end.ch - change.to.ch;\n\
    return {line: line, ch: ch};\n\
  };\n\
  return {anchor: adjustPos(sel.anchor), head: adjustPos(sel.head)};\n\
}\n\
\n\
// Replace the range from from to to by the strings in replacement.\n\
// change is a {from, to, text [, origin]} object\n\
function makeChange(doc, change, selUpdate, ignoreReadOnly) {\n\
  if (doc.cm) {\n\
    if (!doc.cm.curOp) return operation(doc.cm, makeChange)(doc, change, selUpdate, ignoreReadOnly);\n\
    if (doc.cm.state.suppressEdits) return;\n\
  }\n\
\n\
  // Possibly split or suppress the update based on the presence\n\
  // of read-only spans in its range.\n\
  var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);\n\
  if (split) {\n\
    for (var i = split.length - 1; i >= 1; --i)\n\
      makeChangeNoReadonly(doc, {from: split[i].from, to: split[i].to, text: [\"\"]});\n\
    if (split.length)\n\
      makeChangeNoReadonly(doc, {from: split[0].from, to: split[0].to, text: change.text}, selUpdate);\n\
  } else {\n\
    makeChangeNoReadonly(doc, change, selUpdate);\n\
  }\n\
}\n\
\n\
function makeChangeNoReadonly(doc, change, selUpdate) {\n\
  var selAfter = computeSelAfterChange(doc.sel, change, selUpdate);\n\
  addToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);\n\
\n\
  makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));\n\
  var rebased = [];\n\
\n\
  linkedDocs(doc, function(doc, sharedHist) {\n\
    if (!sharedHist && indexOf(rebased, doc.history) == -1) {\n\
      rebaseHist(doc.history, change);\n\
      rebased.push(doc.history);\n\
    }\n\
    makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));\n\
  });\n\
}\n\
\n\
function makeChangeFromHistory(doc, type) {\n\
  var hist = doc.history;\n\
  var event = (type == \"undo\" ? hist.done : hist.undone).pop();\n\
  if (!event) return;\n\
  hist.dirtyCounter += type == \"undo\" ? -1 : 1;\n\
\n\
  var anti = {changes: [], anchorBefore: event.anchorAfter, headBefore: event.headAfter,\n\
              anchorAfter: event.anchorBefore, headAfter: event.headBefore};\n\
  (type == \"undo\" ? hist.undone : hist.done).push(anti);\n\
\n\
  for (var i = event.changes.length - 1; i >= 0; --i) {\n\
    var change = event.changes[i];\n\
    change.origin = type;\n\
    anti.changes.push(historyChangeFromChange(doc, change));\n\
\n\
    var after = i ? computeSelAfterChange(doc.sel, change, null)\n\
                  : {anchor: event.anchorBefore, head: event.headBefore};\n\
    makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));\n\
    var rebased = [];\n\
\n\
    linkedDocs(doc, function(doc, sharedHist) {\n\
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {\n\
        rebaseHist(doc.history, change);\n\
        rebased.push(doc.history);\n\
      }\n\
      makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));\n\
    });\n\
  }\n\
}\n\
\n\
function shiftDoc(doc, distance) {\n\
  function shiftPos(pos) {return {line: pos.line + distance, ch: pos.ch};}\n\
  doc.first += distance;\n\
  if (doc.cm) regChange(doc.cm, doc.first, doc.first, distance);\n\
  doc.sel.head = shiftPos(doc.sel.head); doc.sel.anchor = shiftPos(doc.sel.anchor);\n\
  doc.sel.from = shiftPos(doc.sel.from); doc.sel.to = shiftPos(doc.sel.to);\n\
}\n\
\n\
function makeChangeSingleDoc(doc, change, selAfter, spans) {\n\
  if (doc.cm && !doc.cm.curOp)\n\
    return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans);\n\
\n\
  if (change.to.line < doc.first) {\n\
    shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));\n\
    return;\n\
  }\n\
  if (change.from.line > doc.lastLine()) return;\n\
\n\
  // Clip the change to the size of this doc\n\
  if (change.from.line < doc.first) {\n\
    var shift = change.text.length - 1 - (doc.first - change.from.line);\n\
    shiftDoc(doc, shift);\n\
    change = {from: {line: doc.first, ch: 0}, to: {line: change.to.line + shift, ch: change.to.ch},\n\
              text: [lst(change.text)], origin: change.origin};\n\
  }\n\
  var last = doc.lastLine();\n\
  if (change.to.line > last) {\n\
    change = {from: change.from, to: {line: last, ch: getLine(doc, last).text.length},\n\
              text: [change.text[0]], origin: change.origin};\n\
  }\n\
\n\
  if (!selAfter) selAfter = computeSelAfterChange(doc.sel, change, null);\n\
  if (doc.cm) makeChangeSingleDocInEditor(doc.cm, change, spans, selAfter);\n\
  else updateDoc(doc, change, spans, selAfter);\n\
}\n\
\n\
function makeChangeSingleDocInEditor(cm, change, spans, selAfter) {\n\
  var doc = cm.doc, display = cm.display, from = change.from, to = change.to;\n\
\n\
  var recomputeMaxLength = false, checkWidthStart = from.line;\n\
  if (!cm.options.lineWrapping) {\n\
    checkWidthStart = lineNo(visualLine(doc, getLine(doc, from.line)));\n\
    doc.iter(checkWidthStart, to.line + 1, function(line) {\n\
      if (line == display.maxLine) {\n\
        recomputeMaxLength = true;\n\
        return true;\n\
      }\n\
    });\n\
  }\n\
\n\
  updateDoc(doc, change, spans, selAfter, estimateHeight(cm));\n\
\n\
  if (!cm.options.lineWrapping) {\n\
    doc.iter(checkWidthStart, from.line + change.text.length, function(line) {\n\
      var len = lineLength(doc, line);\n\
      if (len > display.maxLineLength) {\n\
        display.maxLine = line;\n\
        display.maxLineLength = len;\n\
        display.maxLineChanged = true;\n\
        recomputeMaxLength = false;\n\
      }\n\
    });\n\
    if (recomputeMaxLength) cm.curOp.updateMaxLine = true;\n\
  }\n\
\n\
  // Adjust frontier, schedule worker\n\
  doc.frontier = Math.min(doc.frontier, from.line);\n\
  startWorker(cm, 400);\n\
\n\
  var lendiff = change.text.length - (to.line - from.line) - 1;\n\
  // Remember that these lines changed, for updating the display\n\
  regChange(cm, from.line, to.line + 1, lendiff);\n\
  if (hasHandler(cm, \"change\")) {\n\
    var changeObj = {from: from, to: to, text: change.text, origin: change.origin};\n\
    if (cm.curOp.textChanged) {\n\
      for (var cur = cm.curOp.textChanged; cur.next; cur = cur.next) {}\n\
      cur.next = changeObj;\n\
    } else cm.curOp.textChanged = changeObj;\n\
  }\n\
}\n\
\n\
function replaceRange(doc, code, from, to, origin) {\n\
  if (!to) to = from;\n\
  if (posLess(to, from)) { var tmp = to; to = from; from = tmp; }\n\
  if (typeof code == \"string\") code = splitLines(code);\n\
  makeChange(doc, {from: from, to: to, text: code, origin: origin}, null);\n\
}\n\
\n\
// SELECTION\n\
\n\
function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}\n\
function posLess(a, b) {return a.line < b.line || (a.line == b.line && a.ch < b.ch);}\n\
function copyPos(x) {return {line: x.line, ch: x.ch};}\n\
\n\
function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));}\n\
function clipPos(doc, pos) {\n\
  if (pos.line < doc.first) return {line: doc.first, ch: 0};\n\
  var last = doc.first + doc.size - 1;\n\
  if (pos.line > last) return {line: last, ch: getLine(doc, last).text.length};\n\
  var ch = pos.ch, linelen = getLine(doc, pos.line).text.length;\n\
  if (ch == null || ch > linelen) return {line: pos.line, ch: linelen};\n\
  else if (ch < 0) return {line: pos.line, ch: 0};\n\
  else return pos;\n\
}\n\
function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size;}\n\
\n\
// If shift is held, this will move the selection anchor. Otherwise,\n\
// it'll set the whole selection.\n\
function extendSelection(doc, pos, other, bias) {\n\
  if (doc.sel.shift || doc.sel.extend) {\n\
    var anchor = doc.sel.anchor;\n\
    if (other) {\n\
      var posBefore = posLess(pos, anchor);\n\
      if (posBefore != posLess(other, anchor)) {\n\
        anchor = pos;\n\
        pos = other;\n\
      } else if (posBefore != posLess(pos, other)) {\n\
        pos = other;\n\
      }\n\
    }\n\
    setSelection(doc, anchor, pos, bias);\n\
  } else {\n\
    setSelection(doc, pos, other || pos, bias);\n\
  }\n\
  if (doc.cm) doc.cm.curOp.userSelChange = true;\n\
}\n\
\n\
// Update the selection. Last two args are only used by\n\
// updateDoc, since they have to be expressed in the line\n\
// numbers before the update.\n\
function setSelection(doc, anchor, head, bias, checkAtomic) {\n\
  var sel = doc.sel;\n\
  sel.goalColumn = null;\n\
  // Skip over atomic spans.\n\
  if (checkAtomic || !posEq(anchor, sel.anchor))\n\
    anchor = skipAtomic(doc, anchor, bias, checkAtomic != \"push\");\n\
  if (checkAtomic || !posEq(head, sel.head))\n\
    head = skipAtomic(doc, head, bias, checkAtomic != \"push\");\n\
\n\
  if (posEq(sel.anchor, anchor) && posEq(sel.head, head)) return;\n\
\n\
  sel.anchor = anchor; sel.head = head;\n\
  var inv = posLess(head, anchor);\n\
  sel.from = inv ? head : anchor;\n\
  sel.to = inv ? anchor : head;\n\
\n\
  if (doc.cm)\n\
    doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true;\n\
}\n\
\n\
function reCheckSelection(cm) {\n\
  setSelection(cm.doc, cm.doc.sel.from, cm.doc.sel.to, null, \"push\");\n\
}\n\
\n\
function skipAtomic(doc, pos, bias, mayClear) {\n\
  var flipped = false, curPos = pos;\n\
  var dir = bias || 1;\n\
  doc.cantEdit = false;\n\
  search: for (;;) {\n\
    var line = getLine(doc, curPos.line), toClear;\n\
    if (line.markedSpans) {\n\
      for (var i = 0; i < line.markedSpans.length; ++i) {\n\
        var sp = line.markedSpans[i], m = sp.marker;\n\
        if ((sp.from == null || (m.inclusiveLeft ? sp.from <= curPos.ch : sp.from < curPos.ch)) &&\n\
            (sp.to == null || (m.inclusiveRight ? sp.to >= curPos.ch : sp.to > curPos.ch))) {\n\
          if (mayClear && m.clearOnEnter) {\n\
            (toClear || (toClear = [])).push(m);\n\
            continue;\n\
          } else if (!m.atomic) continue;\n\
          var newPos = m.find()[dir < 0 ? \"from\" : \"to\"];\n\
          if (posEq(newPos, curPos)) {\n\
            newPos.ch += dir;\n\
            if (newPos.ch < 0) {\n\
              if (newPos.line > doc.first) newPos = clipPos(doc, {line: newPos.line - 1});\n\
              else newPos = null;\n\
            } else if (newPos.ch > line.text.length) {\n\
              if (newPos.line < doc.first + doc.size - 1) newPos = {line: newPos.line + 1, ch: 0};\n\
              else newPos = null;\n\
            }\n\
            if (!newPos) {\n\
              if (flipped) {\n\
                // Driven in a corner -- no valid cursor position found at all\n\
                // -- try again *with* clearing, if we didn't already\n\
                if (!mayClear) return skipAtomic(doc, pos, bias, true);\n\
                // Otherwise, turn off editing until further notice, and return the start of the doc\n\
                doc.cantEdit = true;\n\
                return {line: doc.first, ch: 0};\n\
              }\n\
              flipped = true; newPos = pos; dir = -dir;\n\
            }\n\
          }\n\
          curPos = newPos;\n\
          continue search;\n\
        }\n\
      }\n\
      if (toClear) for (var i = 0; i < toClear.length; ++i) toClear[i].clear();\n\
    }\n\
    return curPos;\n\
  }\n\
}\n\
\n\
// SCROLLING\n\
\n\
function scrollCursorIntoView(cm) {\n\
  var coords = scrollPosIntoView(cm, cm.doc.sel.head);\n\
  if (!cm.state.focused) return;\n\
  var display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null;\n\
  if (coords.top + box.top < 0) doScroll = true;\n\
  else if (coords.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) doScroll = false;\n\
  if (doScroll != null && !phantom) {\n\
    var hidden = display.cursor.style.display == \"none\";\n\
    if (hidden) {\n\
      display.cursor.style.display = \"\";\n\
      display.cursor.style.left = coords.left + \"px\";\n\
      display.cursor.style.top = (coords.top - display.viewOffset) + \"px\";\n\
    }\n\
    display.cursor.scrollIntoView(doScroll);\n\
    if (hidden) display.cursor.style.display = \"none\";\n\
  }\n\
}\n\
\n\
function scrollPosIntoView(cm, pos) {\n\
  for (;;) {\n\
    var changed = false, coords = cursorCoords(cm, pos);\n\
    var scrollPos = calculateScrollPos(cm, coords.left, coords.top, coords.left, coords.bottom);\n\
    var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;\n\
    if (scrollPos.scrollTop != null) {\n\
      setScrollTop(cm, scrollPos.scrollTop);\n\
      if (Math.abs(cm.doc.scrollTop - startTop) > 1) changed = true;\n\
    }\n\
    if (scrollPos.scrollLeft != null) {\n\
      setScrollLeft(cm, scrollPos.scrollLeft);\n\
      if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) changed = true;\n\
    }\n\
    if (!changed) return coords;\n\
  }\n\
}\n\
\n\
function scrollIntoView(cm, x1, y1, x2, y2) {\n\
  var scrollPos = calculateScrollPos(cm, x1, y1, x2, y2);\n\
  if (scrollPos.scrollTop != null) setScrollTop(cm, scrollPos.scrollTop);\n\
  if (scrollPos.scrollLeft != null) setScrollLeft(cm, scrollPos.scrollLeft);\n\
}\n\
\n\
function calculateScrollPos(cm, x1, y1, x2, y2) {\n\
  var display = cm.display, pt = paddingTop(display);\n\
  y1 += pt; y2 += pt;\n\
  var screen = display.scroller.clientHeight - scrollerCutOff, screentop = display.scroller.scrollTop, result = {};\n\
  var docBottom = cm.doc.height + 2 * pt;\n\
  var atTop = y1 < pt + 10, atBottom = y2 + pt > docBottom - 10;\n\
  if (y1 < screentop) result.scrollTop = atTop ? 0 : Math.max(0, y1);\n\
  else if (y2 > screentop + screen) result.scrollTop = (atBottom ? docBottom : y2) - screen;\n\
\n\
  var screenw = display.scroller.clientWidth - scrollerCutOff, screenleft = display.scroller.scrollLeft;\n\
  x1 += display.gutters.offsetWidth; x2 += display.gutters.offsetWidth;\n\
  var gutterw = display.gutters.offsetWidth;\n\
  var atLeft = x1 < gutterw + 10;\n\
  if (x1 < screenleft + gutterw || atLeft) {\n\
    if (atLeft) x1 = 0;\n\
    result.scrollLeft = Math.max(0, x1 - 10 - gutterw);\n\
  } else if (x2 > screenw + screenleft - 3) {\n\
    result.scrollLeft = x2 + 10 - screenw;\n\
  }\n\
  return result;\n\
}\n\
\n\
// API UTILITIES\n\
\n\
function indentLine(cm, n, how, aggressive) {\n\
  var doc = cm.doc;\n\
  if (!how) how = \"add\";\n\
  if (how == \"smart\") {\n\
    if (!cm.doc.mode.indent) how = \"prev\";\n\
    else var state = getStateBefore(cm, n);\n\
  }\n\
\n\
  var tabSize = cm.options.tabSize;\n\
  var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize);\n\
  var curSpaceString = line.text.match(/^\\s*/)[0], indentation;\n\
  if (how == \"smart\") {\n\
    indentation = cm.doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);\n\
    if (indentation == Pass) {\n\
      if (!aggressive) return;\n\
      how = \"prev\";\n\
    }\n\
  }\n\
  if (how == \"prev\") {\n\
    if (n > doc.first) indentation = countColumn(getLine(doc, n-1).text, null, tabSize);\n\
    else indentation = 0;\n\
  } else if (how == \"add\") {\n\
    indentation = curSpace + cm.options.indentUnit;\n\
  } else if (how == \"subtract\") {\n\
    indentation = curSpace - cm.options.indentUnit;\n\
  }\n\
  indentation = Math.max(0, indentation);\n\
\n\
  var indentString = \"\", pos = 0;\n\
  if (cm.options.indentWithTabs)\n\
    for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += \"\\t\";}\n\
  if (pos < indentation) indentString += spaceStr(indentation - pos);\n\
\n\
  if (indentString != curSpaceString)\n\
    replaceRange(cm.doc, indentString, {line: n, ch: 0}, {line: n, ch: curSpaceString.length}, \"input\");\n\
  line.stateAfter = null;\n\
}\n\
\n\
function changeLine(cm, handle, op) {\n\
  var no = handle, line = handle, doc = cm.doc;\n\
  if (typeof handle == \"number\") line = getLine(doc, clipLine(doc, handle));\n\
  else no = lineNo(handle);\n\
  if (no == null) return null;\n\
  if (op(line, no)) regChange(cm, no, no + 1);\n\
  else return null;\n\
  return line;\n\
}\n\
\n\
function findPosH(doc, dir, unit, visually) {\n\
  var end = doc.sel.head, line = end.line, ch = end.ch;\n\
  var lineObj = getLine(doc, line);\n\
  function findNextLine() {\n\
    var l = line + dir;\n\
    if (l < doc.first || l >= doc.first + doc.size) return false;\n\
    line = l;\n\
    return lineObj = getLine(doc, l);\n\
  }\n\
  function moveOnce(boundToLine) {\n\
    var next = (visually ? moveVisually : moveLogically)(lineObj, ch, dir, true);\n\
    if (next == null) {\n\
      if (!boundToLine && findNextLine()) {\n\
        if (visually) ch = (dir < 0 ? lineRight : lineLeft)(lineObj);\n\
        else ch = dir < 0 ? lineObj.text.length : 0;\n\
      } else return false;\n\
    } else ch = next;\n\
    return true;\n\
  }\n\
  if (unit == \"char\") moveOnce();\n\
  else if (unit == \"column\") moveOnce(true);\n\
  else if (unit == \"word\") {\n\
    var sawWord = false;\n\
    for (;;) {\n\
      if (dir < 0) if (!moveOnce()) break;\n\
      if (isWordChar(lineObj.text.charAt(ch))) sawWord = true;\n\
      else if (sawWord) {if (dir < 0) {dir = 1; moveOnce();} break;}\n\
      if (dir > 0) if (!moveOnce()) break;\n\
    }\n\
  }\n\
  return skipAtomic(doc, {line: line, ch: ch}, dir, true);\n\
}\n\
\n\
function findWordAt(line, pos) {\n\
  var start = pos.ch, end = pos.ch;\n\
  if (line) {\n\
    if (pos.after === false || end == line.length) --start; else ++end;\n\
    var startChar = line.charAt(start);\n\
    var check = isWordChar(startChar) ? isWordChar :\n\
      /\\s/.test(startChar) ? function(ch) {return /\\s/.test(ch);} :\n\
    function(ch) {return !/\\s/.test(ch) && !isWordChar(ch);};\n\
    while (start > 0 && check(line.charAt(start - 1))) --start;\n\
    while (end < line.length && check(line.charAt(end))) ++end;\n\
  }\n\
  return {from: {line: pos.line, ch: start}, to: {line: pos.line, ch: end}};\n\
}\n\
\n\
function selectLine(cm, line) {\n\
  extendSelection(cm.doc, {line: line, ch: 0}, clipPos(cm.doc, {line: line + 1, ch: 0}));\n\
}\n\
\n\
// PROTOTYPE\n\
\n\
// The publicly visible API. Note that operation(null, f) means\n\
// 'wrap f in an operation, performed on its `this` parameter'\n\
\n\
CodeMirror.prototype = {\n\
  focus: function(){window.focus(); focusInput(this); onFocus(this); fastPoll(this);},\n\
\n\
  setOption: function(option, value) {\n\
    var options = this.options, old = options[option];\n\
    if (options[option] == value && option != \"mode\") return;\n\
    options[option] = value;\n\
    if (optionHandlers.hasOwnProperty(option))\n\
      operation(this, optionHandlers[option])(this, value, old);\n\
  },\n\
\n\
  getOption: function(option) {return this.options[option];},\n\
  getDoc: function() {return this.doc;},\n\
\n\
  addKeyMap: function(map) {\n\
    this.state.keyMaps.push(map);\n\
  },\n\
  removeKeyMap: function(map) {\n\
    var maps = this.state.keyMaps;\n\
    for (var i = 0; i < maps.length; ++i)\n\
      if ((typeof map == \"string\" ? maps[i].name : maps[i]) == map) {\n\
        maps.splice(i, 1);\n\
        return true;\n\
      }\n\
  },\n\
\n\
  addOverlay: operation(null, function(spec, options) {\n\
    var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);\n\
    if (mode.startState) throw new Error(\"Overlays may not be stateful.\");\n\
    this.state.overlays.push({mode: mode, modeSpec: spec, opaque: options && options.opaque});\n\
    this.state.modeGen++;\n\
    regChange(this);\n\
  }),\n\
  removeOverlay: operation(null, function(spec) {\n\
    var overlays = this.state.overlays;\n\
    for (var i = 0; i < overlays.length; ++i) {\n\
      if (overlays[i].modeSpec == spec) {\n\
        overlays.splice(i, 1);\n\
        this.state.modeGen++;\n\
        regChange(this);\n\
        return;\n\
      }\n\
    }\n\
  }),\n\
\n\
  indentLine: operation(null, function(n, dir, aggressive) {\n\
    if (typeof dir != \"string\") {\n\
      if (dir == null) dir = this.options.smartIndent ? \"smart\" : \"prev\";\n\
      else dir = dir ? \"add\" : \"subtract\";\n\
    }\n\
    if (isLine(this.doc, n)) indentLine(this, n, dir, aggressive);\n\
  }),\n\
  indentSelection: operation(null, function(how) {\n\
    var sel = this.doc.sel;\n\
    if (posEq(sel.from, sel.to)) return indentLine(this, sel.from.line, how);\n\
    var e = sel.to.line - (sel.to.ch ? 0 : 1);\n\
    for (var i = sel.from.line; i <= e; ++i) indentLine(this, i, how);\n\
  }),\n\
\n\
  // Fetch the parser token for a given character. Useful for hacks\n\
  // that want to inspect the mode state (say, for completion).\n\
  getTokenAt: function(pos) {\n\
    var doc = this.doc;\n\
    pos = clipPos(doc, pos);\n\
    var state = getStateBefore(this, pos.line), mode = this.doc.mode;\n\
    var line = getLine(doc, pos.line);\n\
    var stream = new StringStream(line.text, this.options.tabSize);\n\
    while (stream.pos < pos.ch && !stream.eol()) {\n\
      stream.start = stream.pos;\n\
      var style = mode.token(stream, state);\n\
    }\n\
    return {start: stream.start,\n\
            end: stream.pos,\n\
            string: stream.current(),\n\
            className: style || null, // Deprecated, use 'type' instead\n\
            type: style || null,\n\
            state: state};\n\
  },\n\
\n\
  getStateAfter: function(line) {\n\
    var doc = this.doc;\n\
    line = clipLine(doc, line == null ? doc.first + doc.size - 1: line);\n\
    return getStateBefore(this, line + 1);\n\
  },\n\
\n\
  cursorCoords: function(start, mode) {\n\
    var pos, sel = this.doc.sel;\n\
    if (start == null) pos = sel.head;\n\
    else if (typeof start == \"object\") pos = clipPos(this.doc, start);\n\
    else pos = start ? sel.from : sel.to;\n\
    return cursorCoords(this, pos, mode || \"page\");\n\
  },\n\
\n\
  charCoords: function(pos, mode) {\n\
    return charCoords(this, clipPos(this.doc, pos), mode || \"page\");\n\
  },\n\
\n\
  coordsChar: function(coords) {\n\
    var off = this.display.lineSpace.getBoundingClientRect();\n\
    return coordsChar(this, coords.left - off.left, coords.top - off.top);\n\
  },\n\
\n\
  defaultTextHeight: function() { return textHeight(this.display); },\n\
\n\
  setGutterMarker: operation(null, function(line, gutterID, value) {\n\
    return changeLine(this, line, function(line) {\n\
      var markers = line.gutterMarkers || (line.gutterMarkers = {});\n\
      markers[gutterID] = value;\n\
      if (!value && isEmpty(markers)) line.gutterMarkers = null;\n\
      return true;\n\
    });\n\
  }),\n\
\n\
  clearGutter: operation(null, function(gutterID) {\n\
    var cm = this, doc = cm.doc, i = doc.first;\n\
    doc.iter(function(line) {\n\
      if (line.gutterMarkers && line.gutterMarkers[gutterID]) {\n\
        line.gutterMarkers[gutterID] = null;\n\
        regChange(cm, i, i + 1);\n\
        if (isEmpty(line.gutterMarkers)) line.gutterMarkers = null;\n\
      }\n\
      ++i;\n\
    });\n\
  }),\n\
\n\
  addLineClass: operation(null, function(handle, where, cls) {\n\
    return changeLine(this, handle, function(line) {\n\
      var prop = where == \"text\" ? \"textClass\" : where == \"background\" ? \"bgClass\" : \"wrapClass\";\n\
      if (!line[prop]) line[prop] = cls;\n\
      else if (new RegExp(\"\\\\b\" + cls + \"\\\\b\").test(line[prop])) return false;\n\
      else line[prop] += \" \" + cls;\n\
      return true;\n\
    });\n\
  }),\n\
\n\
  removeLineClass: operation(null, function(handle, where, cls) {\n\
    return changeLine(this, handle, function(line) {\n\
      var prop = where == \"text\" ? \"textClass\" : where == \"background\" ? \"bgClass\" : \"wrapClass\";\n\
      var cur = line[prop];\n\
      if (!cur) return false;\n\
      else if (cls == null) line[prop] = null;\n\
      else {\n\
        var upd = cur.replace(new RegExp(\"^\" + cls + \"\\\\b\\\\s*|\\\\s*\\\\b\" + cls + \"\\\\b\"), \"\");\n\
        if (upd == cur) return false;\n\
        line[prop] = upd || null;\n\
      }\n\
      return true;\n\
    });\n\
  }),\n\
\n\
  addLineWidget: operation(null, function(handle, node, options) {\n\
    return addLineWidget(this, handle, node, options);\n\
  }),\n\
\n\
  removeLineWidget: function(widget) { widget.clear(); },\n\
\n\
  lineInfo: function(line) {\n\
    if (typeof line == \"number\") {\n\
      if (!isLine(this.doc, line)) return null;\n\
      var n = line;\n\
      line = getLine(this.doc, line);\n\
      if (!line) return null;\n\
    } else {\n\
      var n = lineNo(line);\n\
      if (n == null) return null;\n\
    }\n\
    return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,\n\
            textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,\n\
            widgets: line.widgets};\n\
  },\n\
\n\
  getViewport: function() { return {from: this.display.showingFrom, to: this.display.showingTo};},\n\
\n\
  addWidget: function(pos, node, scroll, vert, horiz) {\n\
    var display = this.display;\n\
    pos = cursorCoords(this, clipPos(this.doc, pos));\n\
    var top = pos.top, left = pos.left;\n\
    node.style.position = \"absolute\";\n\
    display.sizer.appendChild(node);\n\
    if (vert == \"over\") top = pos.top;\n\
    else if (vert == \"near\") {\n\
      var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),\n\
      hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);\n\
      if (pos.bottom + node.offsetHeight > vspace && pos.top > node.offsetHeight)\n\
        top = pos.top - node.offsetHeight;\n\
      if (left + node.offsetWidth > hspace)\n\
        left = hspace - node.offsetWidth;\n\
    }\n\
    node.style.top = (top + paddingTop(display)) + \"px\";\n\
    node.style.left = node.style.right = \"\";\n\
    if (horiz == \"right\") {\n\
      left = display.sizer.clientWidth - node.offsetWidth;\n\
      node.style.right = \"0px\";\n\
    } else {\n\
      if (horiz == \"left\") left = 0;\n\
      else if (horiz == \"middle\") left = (display.sizer.clientWidth - node.offsetWidth) / 2;\n\
      node.style.left = left + \"px\";\n\
    }\n\
    if (scroll)\n\
      scrollIntoView(this, left, top, left + node.offsetWidth, top + node.offsetHeight);\n\
  },\n\
\n\
  triggerOnKeyDown: operation(null, onKeyDown),\n\
\n\
  execCommand: function(cmd) {return commands[cmd](this);},\n\
\n\
  // Stuff used by commands, probably not much use to outside code.\n\
  moveH: operation(null, function(dir, unit) {\n\
    var sel = this.doc.sel, pos = dir < 0 ? sel.from : sel.to;\n\
    if (sel.shift || sel.extend || posEq(sel.from, sel.to))\n\
      pos = findPosH(this.doc, dir, unit, this.options.rtlMoveVisually);\n\
    extendSelection(this.doc, pos, pos, dir);\n\
  }),\n\
\n\
  deleteH: operation(null, function(dir, unit) {\n\
    var sel = this.doc.sel;\n\
    if (!posEq(sel.from, sel.to)) replaceRange(this.doc, \"\", sel.from, sel.to, \"delete\");\n\
    else replaceRange(this.doc, \"\", sel.from, findPosH(this.doc, dir, unit, false), \"delete\");\n\
    this.curOp.userSelChange = true;\n\
  }),\n\
\n\
  moveV: operation(null, function(dir, unit) {\n\
    var doc = this.doc, display = this.display;\n\
    var cur = doc.sel.head, pos = cursorCoords(this, cur, \"div\");\n\
    var x = pos.left, y;\n\
    if (doc.sel.goalColumn != null) x = doc.sel.goalColumn;\n\
    if (unit == \"page\") {\n\
      var pageSize = Math.min(display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);\n\
      y = pos.top + dir * pageSize;\n\
    } else if (unit == \"line\") {\n\
      y = dir > 0 ? pos.bottom + 3 : pos.top - 3;\n\
    }\n\
    do {\n\
      var target = coordsChar(this, x, y);\n\
      y += dir * 5;\n\
    } while (target.outside && (dir < 0 ? y > 0 : y < doc.height));\n\
\n\
    if (unit == \"page\") display.scrollbarV.scrollTop += charCoords(this, target, \"div\").top - pos.top;\n\
    extendSelection(this.doc, target, target, dir);\n\
    doc.sel.goalColumn = x;\n\
  }),\n\
\n\
  toggleOverwrite: function() {\n\
    if (this.state.overwrite = !this.state.overwrite)\n\
      this.display.cursor.className += \" CodeMirror-overwrite\";\n\
    else\n\
      this.display.cursor.className = this.display.cursor.className.replace(\" CodeMirror-overwrite\", \"\");\n\
  },\n\
\n\
  scrollTo: function(x, y) {\n\
    if (x != null) this.display.scrollbarH.scrollLeft = this.display.scroller.scrollLeft = x;\n\
    if (y != null) this.display.scrollbarV.scrollTop = this.display.scroller.scrollTop = y;\n\
    updateDisplay(this, []);\n\
  },\n\
  getScrollInfo: function() {\n\
    var scroller = this.display.scroller, co = scrollerCutOff;\n\
    return {left: scroller.scrollLeft, top: scroller.scrollTop,\n\
            height: scroller.scrollHeight - co, width: scroller.scrollWidth - co,\n\
            clientHeight: scroller.clientHeight - co, clientWidth: scroller.clientWidth - co};\n\
  },\n\
\n\
  scrollIntoView: function(pos) {\n\
    if (typeof pos == \"number\") pos = {line: pos, ch: 0};\n\
    if (!pos || pos.line != null) {\n\
      pos = pos ? clipPos(this.doc, pos) : this.doc.sel.head;\n\
      scrollPosIntoView(this, pos);\n\
    } else {\n\
      scrollIntoView(this, pos.left, pos.top, pos.right, pos.bottom);\n\
    }\n\
  },\n\
\n\
  setSize: function(width, height) {\n\
    function interpret(val) {\n\
      return typeof val == \"number\" || /^\\d+$/.test(String(val)) ? val + \"px\" : val;\n\
    }\n\
    if (width != null) this.display.wrapper.style.width = interpret(width);\n\
    if (height != null) this.display.wrapper.style.height = interpret(height);\n\
    this.refresh();\n\
  },\n\
\n\
  on: function(type, f) {on(this, type, f);},\n\
  off: function(type, f) {off(this, type, f);},\n\
\n\
  operation: function(f){return runInOp(this, f);},\n\
\n\
  refresh: operation(null, function() {\n\
    clearCaches(this);\n\
    this.curOp.updateScrollPos = {scrollTop: this.doc.scrollTop, scrollLeft: this.doc.scrollLeft};\n\
    regChange(this);\n\
  }),\n\
\n\
  swapDoc: operation(null, function(doc) {\n\
    var old = this.doc;\n\
    old.cm = null;\n\
    attachDoc(this, doc);\n\
    clearCaches(this);\n\
    this.curOp.updateScrollPos = {scrollTop: doc.scrollTop, scrollLeft: doc.scrollLeft};\n\
    return old;\n\
  }),\n\
\n\
  getInputField: function(){return this.display.input;},\n\
  getWrapperElement: function(){return this.display.wrapper;},\n\
  getScrollerElement: function(){return this.display.scroller;},\n\
  getGutterElement: function(){return this.display.gutters;}\n\
};\n\
\n\
// OPTION DEFAULTS\n\
\n\
var optionHandlers = CodeMirror.optionHandlers = {};\n\
\n\
// The default configuration options.\n\
var defaults = CodeMirror.defaults = {};\n\
\n\
function option(name, deflt, handle, notOnInit) {\n\
  CodeMirror.defaults[name] = deflt;\n\
  if (handle) optionHandlers[name] =\n\
    notOnInit ? function(cm, val, old) {if (old != Init) handle(cm, val, old);} : handle;\n\
}\n\
\n\
var Init = CodeMirror.Init = {toString: function(){return \"CodeMirror.Init\";}};\n\
\n\
// These two are, on init, called from the constructor because they\n\
// have to be initialized before the editor can start at all.\n\
option(\"value\", \"\", function(cm, val) {\n\
  cm.setValue(val);\n\
}, true);\n\
option(\"mode\", null, function(cm, val) {\n\
  cm.doc.modeOption = val;\n\
  loadMode(cm);\n\
}, true);\n\
\n\
option(\"indentUnit\", 2, loadMode, true);\n\
option(\"indentWithTabs\", false);\n\
option(\"smartIndent\", true);\n\
option(\"tabSize\", 4, function(cm) {\n\
  loadMode(cm);\n\
  clearCaches(cm);\n\
  regChange(cm);\n\
}, true);\n\
option(\"electricChars\", true);\n\
option(\"rtlMoveVisually\", !windows);\n\
\n\
option(\"theme\", \"default\", function(cm) {\n\
  themeChanged(cm);\n\
  guttersChanged(cm);\n\
}, true);\n\
option(\"keyMap\", \"default\", keyMapChanged);\n\
option(\"extraKeys\", null);\n\
\n\
option(\"onKeyEvent\", null);\n\
option(\"onDragEvent\", null);\n\
\n\
option(\"lineWrapping\", false, wrappingChanged, true);\n\
option(\"gutters\", [], function(cm) {\n\
  setGuttersForLineNumbers(cm.options);\n\
  guttersChanged(cm);\n\
}, true);\n\
option(\"fixedGutter\", true, function(cm, val) {\n\
  cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + \"px\" : \"0\";\n\
  cm.refresh();\n\
}, true);\n\
option(\"lineNumbers\", false, function(cm) {\n\
  setGuttersForLineNumbers(cm.options);\n\
  guttersChanged(cm);\n\
}, true);\n\
option(\"firstLineNumber\", 1, guttersChanged, true);\n\
option(\"lineNumberFormatter\", function(integer) {return integer;}, guttersChanged, true);\n\
option(\"showCursorWhenSelecting\", false, updateSelection, true);\n\
\n\
option(\"readOnly\", false, function(cm, val) {\n\
  if (val == \"nocursor\") {onBlur(cm); cm.display.input.blur();}\n\
  else if (!val) resetInput(cm, true);\n\
});\n\
option(\"dragDrop\", true);\n\
\n\
option(\"cursorBlinkRate\", 530);\n\
option(\"cursorHeight\", 1);\n\
option(\"workTime\", 100);\n\
option(\"workDelay\", 100);\n\
option(\"flattenSpans\", true);\n\
option(\"pollInterval\", 100);\n\
option(\"undoDepth\", 40, function(cm, val){cm.doc.history.undoDepth = val;});\n\
option(\"viewportMargin\", 10, function(cm){cm.refresh();}, true);\n\
\n\
option(\"tabindex\", null, function(cm, val) {\n\
  cm.display.input.tabIndex = val || \"\";\n\
});\n\
option(\"autofocus\", null);\n\
\n\
// MODE DEFINITION AND QUERYING\n\
\n\
// Known modes, by name and by MIME\n\
var modes = CodeMirror.modes = {}, mimeModes = CodeMirror.mimeModes = {};\n\
\n\
CodeMirror.defineMode = function(name, mode) {\n\
  if (!CodeMirror.defaults.mode && name != \"null\") CodeMirror.defaults.mode = name;\n\
  if (arguments.length > 2) {\n\
    mode.dependencies = [];\n\
    for (var i = 2; i < arguments.length; ++i) mode.dependencies.push(arguments[i]);\n\
  }\n\
  modes[name] = mode;\n\
};\n\
\n\
CodeMirror.defineMIME = function(mime, spec) {\n\
  mimeModes[mime] = spec;\n\
};\n\
\n\
CodeMirror.resolveMode = function(spec) {\n\
  if (typeof spec == \"string\" && mimeModes.hasOwnProperty(spec))\n\
    spec = mimeModes[spec];\n\
  else if (typeof spec == \"string\" && /^[\\w\\-]+\\/[\\w\\-]+\\+xml$/.test(spec))\n\
    return CodeMirror.resolveMode(\"application/xml\");\n\
  if (typeof spec == \"string\") return {name: spec};\n\
  else return spec || {name: \"null\"};\n\
};\n\
\n\
CodeMirror.getMode = function(options, spec) {\n\
  spec = CodeMirror.resolveMode(spec);\n\
  var mfactory = modes[spec.name];\n\
  if (!mfactory) return CodeMirror.getMode(options, \"text/plain\");\n\
  var modeObj = mfactory(options, spec);\n\
  if (modeExtensions.hasOwnProperty(spec.name)) {\n\
    var exts = modeExtensions[spec.name];\n\
    for (var prop in exts) {\n\
      if (!exts.hasOwnProperty(prop)) continue;\n\
      if (modeObj.hasOwnProperty(prop)) modeObj[\"_\" + prop] = modeObj[prop];\n\
      modeObj[prop] = exts[prop];\n\
    }\n\
  }\n\
  modeObj.name = spec.name;\n\
  return modeObj;\n\
};\n\
\n\
CodeMirror.defineMode(\"null\", function() {\n\
  return {token: function(stream) {stream.skipToEnd();}};\n\
});\n\
CodeMirror.defineMIME(\"text/plain\", \"null\");\n\
\n\
var modeExtensions = CodeMirror.modeExtensions = {};\n\
CodeMirror.extendMode = function(mode, properties) {\n\
  var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});\n\
  copyObj(properties, exts);\n\
};\n\
\n\
// EXTENSIONS\n\
\n\
CodeMirror.defineExtension = function(name, func) {\n\
  CodeMirror.prototype[name] = func;\n\
};\n\
\n\
CodeMirror.defineOption = option;\n\
\n\
var initHooks = [];\n\
CodeMirror.defineInitHook = function(f) {initHooks.push(f);};\n\
\n\
// MODE STATE HANDLING\n\
\n\
// Utility functions for working with state. Exported because modes\n\
// sometimes need to do this.\n\
function copyState(mode, state) {\n\
  if (state === true) return state;\n\
  if (mode.copyState) return mode.copyState(state);\n\
  var nstate = {};\n\
  for (var n in state) {\n\
    var val = state[n];\n\
    if (val instanceof Array) val = val.concat([]);\n\
    nstate[n] = val;\n\
  }\n\
  return nstate;\n\
}\n\
CodeMirror.copyState = copyState;\n\
\n\
function startState(mode, a1, a2) {\n\
  return mode.startState ? mode.startState(a1, a2) : true;\n\
}\n\
CodeMirror.startState = startState;\n\
\n\
CodeMirror.innerMode = function(mode, state) {\n\
  while (mode.innerMode) {\n\
    var info = mode.innerMode(state);\n\
    state = info.state;\n\
    mode = info.mode;\n\
  }\n\
  return info || {mode: mode, state: state};\n\
};\n\
\n\
// STANDARD COMMANDS\n\
\n\
var commands = CodeMirror.commands = {\n\
  selectAll: function(cm) {cm.setSelection({line: cm.firstLine(), ch: 0}, {line: cm.lastLine()});},\n\
  killLine: function(cm) {\n\
    var from = cm.getCursor(true), to = cm.getCursor(false), sel = !posEq(from, to);\n\
    if (!sel && cm.getLine(from.line).length == from.ch)\n\
      cm.replaceRange(\"\", from, {line: from.line + 1, ch: 0}, \"delete\");\n\
    else cm.replaceRange(\"\", from, sel ? to : {line: from.line}, \"delete\");\n\
  },\n\
  deleteLine: function(cm) {\n\
    var l = cm.getCursor().line;\n\
    cm.replaceRange(\"\", {line: l, ch: 0}, {line: l}, \"delete\");\n\
  },\n\
  undo: function(cm) {cm.undo();},\n\
  redo: function(cm) {cm.redo();},\n\
  goDocStart: function(cm) {cm.extendSelection({line: cm.firstLine(), ch: 0});},\n\
  goDocEnd: function(cm) {cm.extendSelection({line: cm.lastLine()});},\n\
  goLineStart: function(cm) {\n\
    cm.extendSelection(lineStart(cm, cm.getCursor().line));\n\
  },\n\
  goLineStartSmart: function(cm) {\n\
    var cur = cm.getCursor(), start = lineStart(cm, cur.line);\n\
    var line = cm.getLineHandle(start.line);\n\
    var order = getOrder(line);\n\
    if (!order || order[0].level == 0) {\n\
      var firstNonWS = Math.max(0, line.text.search(/\\S/));\n\
      var inWS = cur.line == start.line && cur.ch <= firstNonWS && cur.ch;\n\
      cm.extendSelection({line: start.line, ch: inWS ? 0 : firstNonWS});\n\
    } else cm.extendSelection(start);\n\
  },\n\
  goLineEnd: function(cm) {\n\
    cm.extendSelection(lineEnd(cm, cm.getCursor().line));\n\
  },\n\
  goLineUp: function(cm) {cm.moveV(-1, \"line\");},\n\
  goLineDown: function(cm) {cm.moveV(1, \"line\");},\n\
  goPageUp: function(cm) {cm.moveV(-1, \"page\");},\n\
  goPageDown: function(cm) {cm.moveV(1, \"page\");},\n\
  goCharLeft: function(cm) {cm.moveH(-1, \"char\");},\n\
  goCharRight: function(cm) {cm.moveH(1, \"char\");},\n\
  goColumnLeft: function(cm) {cm.moveH(-1, \"column\");},\n\
  goColumnRight: function(cm) {cm.moveH(1, \"column\");},\n\
  goWordLeft: function(cm) {cm.moveH(-1, \"word\");},\n\
  goWordRight: function(cm) {cm.moveH(1, \"word\");},\n\
  delCharBefore: function(cm) {cm.deleteH(-1, \"char\");},\n\
  delCharAfter: function(cm) {cm.deleteH(1, \"char\");},\n\
  delWordBefore: function(cm) {cm.deleteH(-1, \"word\");},\n\
  delWordAfter: function(cm) {cm.deleteH(1, \"word\");},\n\
  indentAuto: function(cm) {cm.indentSelection(\"smart\");},\n\
  indentMore: function(cm) {cm.indentSelection(\"add\");},\n\
  indentLess: function(cm) {cm.indentSelection(\"subtract\");},\n\
  insertTab: function(cm) {cm.replaceSelection(\"\\t\", \"end\", \"input\");},\n\
  defaultTab: function(cm) {\n\
    if (cm.somethingSelected()) cm.indentSelection(\"add\");\n\
    else cm.replaceSelection(\"\\t\", \"end\", \"input\");\n\
  },\n\
  transposeChars: function(cm) {\n\
    var cur = cm.getCursor(), line = cm.getLine(cur.line);\n\
    if (cur.ch > 0 && cur.ch < line.length - 1)\n\
      cm.replaceRange(line.charAt(cur.ch) + line.charAt(cur.ch - 1),\n\
                      {line: cur.line, ch: cur.ch - 1}, {line: cur.line, ch: cur.ch + 1});\n\
  },\n\
  newlineAndIndent: function(cm) {\n\
    operation(cm, function() {\n\
      cm.replaceSelection(\"\\n\
\", \"end\", \"input\");\n\
      cm.indentLine(cm.getCursor().line, null, true);\n\
    })();\n\
  },\n\
  toggleOverwrite: function(cm) {cm.toggleOverwrite();}\n\
};\n\
\n\
// STANDARD KEYMAPS\n\
\n\
var keyMap = CodeMirror.keyMap = {};\n\
keyMap.basic = {\n\
  \"Left\": \"goCharLeft\", \"Right\": \"goCharRight\", \"Up\": \"goLineUp\", \"Down\": \"goLineDown\",\n\
  \"End\": \"goLineEnd\", \"Home\": \"goLineStartSmart\", \"PageUp\": \"goPageUp\", \"PageDown\": \"goPageDown\",\n\
  \"Delete\": \"delCharAfter\", \"Backspace\": \"delCharBefore\", \"Tab\": \"defaultTab\", \"Shift-Tab\": \"indentAuto\",\n\
  \"Enter\": \"newlineAndIndent\", \"Insert\": \"toggleOverwrite\"\n\
};\n\
// Note that the save and find-related commands aren't defined by\n\
// default. Unknown commands are simply ignored.\n\
keyMap.pcDefault = {\n\
  \"Ctrl-A\": \"selectAll\", \"Ctrl-D\": \"deleteLine\", \"Ctrl-Z\": \"undo\", \"Shift-Ctrl-Z\": \"redo\", \"Ctrl-Y\": \"redo\",\n\
  \"Ctrl-Home\": \"goDocStart\", \"Alt-Up\": \"goDocStart\", \"Ctrl-End\": \"goDocEnd\", \"Ctrl-Down\": \"goDocEnd\",\n\
  \"Ctrl-Left\": \"goWordLeft\", \"Ctrl-Right\": \"goWordRight\", \"Alt-Left\": \"goLineStart\", \"Alt-Right\": \"goLineEnd\",\n\
  \"Ctrl-Backspace\": \"delWordBefore\", \"Ctrl-Delete\": \"delWordAfter\", \"Ctrl-S\": \"save\", \"Ctrl-F\": \"find\",\n\
  \"Ctrl-G\": \"findNext\", \"Shift-Ctrl-G\": \"findPrev\", \"Shift-Ctrl-F\": \"replace\", \"Shift-Ctrl-R\": \"replaceAll\",\n\
  \"Ctrl-[\": \"indentLess\", \"Ctrl-]\": \"indentMore\",\n\
  fallthrough: \"basic\"\n\
};\n\
keyMap.macDefault = {\n\
  \"Cmd-A\": \"selectAll\", \"Cmd-D\": \"deleteLine\", \"Cmd-Z\": \"undo\", \"Shift-Cmd-Z\": \"redo\", \"Cmd-Y\": \"redo\",\n\
  \"Cmd-Up\": \"goDocStart\", \"Cmd-End\": \"goDocEnd\", \"Cmd-Down\": \"goDocEnd\", \"Alt-Left\": \"goWordLeft\",\n\
  \"Alt-Right\": \"goWordRight\", \"Cmd-Left\": \"goLineStart\", \"Cmd-Right\": \"goLineEnd\", \"Alt-Backspace\": \"delWordBefore\",\n\
  \"Ctrl-Alt-Backspace\": \"delWordAfter\", \"Alt-Delete\": \"delWordAfter\", \"Cmd-S\": \"save\", \"Cmd-F\": \"find\",\n\
  \"Cmd-G\": \"findNext\", \"Shift-Cmd-G\": \"findPrev\", \"Cmd-Alt-F\": \"replace\", \"Shift-Cmd-Alt-F\": \"replaceAll\",\n\
  \"Cmd-[\": \"indentLess\", \"Cmd-]\": \"indentMore\",\n\
  fallthrough: [\"basic\", \"emacsy\"]\n\
};\n\
keyMap[\"default\"] = mac ? keyMap.macDefault : keyMap.pcDefault;\n\
keyMap.emacsy = {\n\
  \"Ctrl-F\": \"goCharRight\", \"Ctrl-B\": \"goCharLeft\", \"Ctrl-P\": \"goLineUp\", \"Ctrl-N\": \"goLineDown\",\n\
  \"Alt-F\": \"goWordRight\", \"Alt-B\": \"goWordLeft\", \"Ctrl-A\": \"goLineStart\", \"Ctrl-E\": \"goLineEnd\",\n\
  \"Ctrl-V\": \"goPageDown\", \"Shift-Ctrl-V\": \"goPageUp\", \"Ctrl-D\": \"delCharAfter\", \"Ctrl-H\": \"delCharBefore\",\n\
  \"Alt-D\": \"delWordAfter\", \"Alt-Backspace\": \"delWordBefore\", \"Ctrl-K\": \"killLine\", \"Ctrl-T\": \"transposeChars\"\n\
};\n\
\n\
// KEYMAP DISPATCH\n\
\n\
function getKeyMap(val) {\n\
  if (typeof val == \"string\") return keyMap[val];\n\
  else return val;\n\
}\n\
\n\
function lookupKey(name, maps, handle, stop) {\n\
  function lookup(map) {\n\
    map = getKeyMap(map);\n\
    var found = map[name];\n\
    if (found === false) {\n\
      if (stop) stop();\n\
      return true;\n\
    }\n\
    if (found != null && handle(found)) return true;\n\
    if (map.nofallthrough) {\n\
      if (stop) stop();\n\
      return true;\n\
    }\n\
    var fallthrough = map.fallthrough;\n\
    if (fallthrough == null) return false;\n\
    if (Object.prototype.toString.call(fallthrough) != \"[object Array]\")\n\
      return lookup(fallthrough);\n\
    for (var i = 0, e = fallthrough.length; i < e; ++i) {\n\
      if (lookup(fallthrough[i])) return true;\n\
    }\n\
    return false;\n\
  }\n\
\n\
  for (var i = 0; i < maps.length; ++i)\n\
    if (lookup(maps[i])) return true;\n\
}\n\
function isModifierKey(event) {\n\
  var name = keyNames[e_prop(event, \"keyCode\")];\n\
  return name == \"Ctrl\" || name == \"Alt\" || name == \"Shift\" || name == \"Mod\";\n\
}\n\
CodeMirror.isModifierKey = isModifierKey;\n\
\n\
// FROMTEXTAREA\n\
\n\
CodeMirror.fromTextArea = function(textarea, options) {\n\
  if (!options) options = {};\n\
  options.value = textarea.value;\n\
  if (!options.tabindex && textarea.tabindex)\n\
    options.tabindex = textarea.tabindex;\n\
  // Set autofocus to true if this textarea is focused, or if it has\n\
  // autofocus and no other element is focused.\n\
  if (options.autofocus == null) {\n\
    var hasFocus = document.body;\n\
    // doc.activeElement occasionally throws on IE\n\
    try { hasFocus = document.activeElement; } catch(e) {}\n\
    options.autofocus = hasFocus == textarea ||\n\
      textarea.getAttribute(\"autofocus\") != null && hasFocus == document.body;\n\
  }\n\
\n\
  function save() {textarea.value = cm.getValue();}\n\
  if (textarea.form) {\n\
    // Deplorable hack to make the submit method do the right thing.\n\
    on(textarea.form, \"submit\", save);\n\
    var form = textarea.form, realSubmit = form.submit;\n\
    try {\n\
      form.submit = function wrappedSubmit() {\n\
        save();\n\
        form.submit = realSubmit;\n\
        form.submit();\n\
        form.submit = wrappedSubmit;\n\
      };\n\
    } catch(e) {}\n\
  }\n\
\n\
  textarea.style.display = \"none\";\n\
  var cm = CodeMirror(function(node) {\n\
    textarea.parentNode.insertBefore(node, textarea.nextSibling);\n\
  }, options);\n\
  cm.save = save;\n\
  cm.getTextArea = function() { return textarea; };\n\
  cm.toTextArea = function() {\n\
    save();\n\
    textarea.parentNode.removeChild(cm.getWrapperElement());\n\
    textarea.style.display = \"\";\n\
    if (textarea.form) {\n\
      off(textarea.form, \"submit\", save);\n\
      if (typeof textarea.form.submit == \"function\")\n\
        textarea.form.submit = realSubmit;\n\
    }\n\
  };\n\
  return cm;\n\
};\n\
\n\
// STRING STREAM\n\
\n\
// Fed to the mode parsers, provides helper functions to make\n\
// parsers more succinct.\n\
\n\
// The character stream used by a mode's parser.\n\
function StringStream(string, tabSize) {\n\
  this.pos = this.start = 0;\n\
  this.string = string;\n\
  this.tabSize = tabSize || 8;\n\
}\n\
\n\
StringStream.prototype = {\n\
  eol: function() {return this.pos >= this.string.length;},\n\
  sol: function() {return this.pos == 0;},\n\
  peek: function() {return this.string.charAt(this.pos) || undefined;},\n\
  next: function() {\n\
    if (this.pos < this.string.length)\n\
      return this.string.charAt(this.pos++);\n\
  },\n\
  eat: function(match) {\n\
    var ch = this.string.charAt(this.pos);\n\
    if (typeof match == \"string\") var ok = ch == match;\n\
    else var ok = ch && (match.test ? match.test(ch) : match(ch));\n\
    if (ok) {++this.pos; return ch;}\n\
  },\n\
  eatWhile: function(match) {\n\
    var start = this.pos;\n\
    while (this.eat(match)){}\n\
    return this.pos > start;\n\
  },\n\
  eatSpace: function() {\n\
    var start = this.pos;\n\
    while (/[\\s\\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;\n\
    return this.pos > start;\n\
  },\n\
  skipToEnd: function() {this.pos = this.string.length;},\n\
  skipTo: function(ch) {\n\
    var found = this.string.indexOf(ch, this.pos);\n\
    if (found > -1) {this.pos = found; return true;}\n\
  },\n\
  backUp: function(n) {this.pos -= n;},\n\
  column: function() {return countColumn(this.string, this.start, this.tabSize);},\n\
  indentation: function() {return countColumn(this.string, null, this.tabSize);},\n\
  match: function(pattern, consume, caseInsensitive) {\n\
    if (typeof pattern == \"string\") {\n\
      var cased = function(str) {return caseInsensitive ? str.toLowerCase() : str;};\n\
      if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {\n\
        if (consume !== false) this.pos += pattern.length;\n\
        return true;\n\
      }\n\
    } else {\n\
      var match = this.string.slice(this.pos).match(pattern);\n\
      if (match && match.index > 0) return null;\n\
      if (match && consume !== false) this.pos += match[0].length;\n\
      return match;\n\
    }\n\
  },\n\
  current: function(){return this.string.slice(this.start, this.pos);}\n\
};\n\
CodeMirror.StringStream = StringStream;\n\
\n\
// TEXTMARKERS\n\
\n\
function TextMarker(doc, type) {\n\
  this.lines = [];\n\
  this.type = type;\n\
  this.doc = doc;\n\
}\n\
CodeMirror.TextMarker = TextMarker;\n\
\n\
TextMarker.prototype.clear = function() {\n\
  if (this.explicitlyCleared) return;\n\
  var cm = this.doc.cm, withOp = cm && !cm.curOp;\n\
  if (withOp) startOperation(cm);\n\
  var min = null, max = null;\n\
  for (var i = 0; i < this.lines.length; ++i) {\n\
    var line = this.lines[i];\n\
    var span = getMarkedSpanFor(line.markedSpans, this);\n\
    if (span.to != null) max = lineNo(line);\n\
    line.markedSpans = removeMarkedSpan(line.markedSpans, span);\n\
    if (span.from != null)\n\
      min = lineNo(line);\n\
    else if (this.collapsed && !lineIsHidden(line) && cm)\n\
      updateLineHeight(line, textHeight(cm.display));\n\
  }\n\
  if (cm && this.collapsed && !cm.options.lineWrapping) for (var i = 0; i < this.lines.length; ++i) {\n\
    var visual = visualLine(cm.doc, this.lines[i]), len = lineLength(cm.doc, visual);\n\
    if (len > cm.display.maxLineLength) {\n\
      cm.display.maxLine = visual;\n\
      cm.display.maxLineLength = len;\n\
      cm.display.maxLineChanged = true;\n\
    }\n\
  }\n\
\n\
  if (min != null && cm) regChange(cm, min, max + 1);\n\
  this.lines.length = 0;\n\
  this.explicitlyCleared = true;\n\
  if (this.collapsed && this.doc.cantEdit) {\n\
    this.doc.cantEdit = false;\n\
    if (cm) reCheckSelection(cm);\n\
  }\n\
  if (withOp) endOperation(cm);\n\
  signalLater(this, \"clear\");\n\
};\n\
\n\
TextMarker.prototype.find = function() {\n\
  var from, to;\n\
  for (var i = 0; i < this.lines.length; ++i) {\n\
    var line = this.lines[i];\n\
    var span = getMarkedSpanFor(line.markedSpans, this);\n\
    if (span.from != null || span.to != null) {\n\
      var found = lineNo(line);\n\
      if (span.from != null) from = {line: found, ch: span.from};\n\
      if (span.to != null) to = {line: found, ch: span.to};\n\
    }\n\
  }\n\
  if (this.type == \"bookmark\") return from;\n\
  return from && {from: from, to: to};\n\
};\n\
\n\
TextMarker.prototype.getOptions = function(copyWidget) {\n\
  var repl = this.replacedWith;\n\
  return {className: this.className,\n\
          inclusiveLeft: this.inclusiveLeft, inclusiveRight: this.inclusiveRight,\n\
          atomic: this.atomic,\n\
          collapsed: this.collapsed,\n\
          clearOnEnter: this.clearOnEnter,\n\
          replacedWith: copyWidget ? repl && repl.cloneNode(true) : repl,\n\
          readOnly: this.readOnly,\n\
          startStyle: this.startStyle, endStyle: this.endStyle};\n\
};\n\
\n\
TextMarker.prototype.attachLine = function(line) {\n\
  if (!this.lines.length && this.doc.cm) {\n\
    var op = this.doc.cm.curOp;\n\
    if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)\n\
      (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);\n\
  }\n\
  this.lines.push(line);\n\
};\n\
TextMarker.prototype.detachLine = function(line) {\n\
  this.lines.splice(indexOf(this.lines, line), 1);\n\
  if (!this.lines.length && this.doc.cm) {\n\
    var op = this.doc.cm.curOp;\n\
    (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);\n\
  }\n\
};\n\
\n\
function markText(doc, from, to, options, type) {\n\
  if (options && options.shared) return markTextShared(doc, from, to, options, type);\n\
  if (doc.cm && !doc.cm.curOp) return operation(doc.cm, markText)(doc, from, to, options, type);\n\
\n\
  var marker = new TextMarker(doc, type);\n\
  if (type == \"range\" && !posLess(from, to)) return marker;\n\
  if (options) copyObj(options, marker);\n\
  if (marker.replacedWith) {\n\
    marker.collapsed = true;\n\
    marker.replacedWith = elt(\"span\", [marker.replacedWith], \"CodeMirror-widget\");\n\
  }\n\
  if (marker.collapsed) sawCollapsedSpans = true;\n\
\n\
  var curLine = from.line, size = 0, collapsedAtStart, collapsedAtEnd, cm = doc.cm, updateMaxLine;\n\
  doc.iter(curLine, to.line + 1, function(line) {\n\
    if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(doc, line) == cm.display.maxLine)\n\
      updateMaxLine = true;\n\
    var span = {from: null, to: null, marker: marker};\n\
    size += line.text.length;\n\
    if (curLine == from.line) {span.from = from.ch; size -= from.ch;}\n\
    if (curLine == to.line) {span.to = to.ch; size -= line.text.length - to.ch;}\n\
    if (marker.collapsed) {\n\
      if (curLine == to.line) collapsedAtEnd = collapsedSpanAt(line, to.ch);\n\
      if (curLine == from.line) collapsedAtStart = collapsedSpanAt(line, from.ch);\n\
      else updateLineHeight(line, 0);\n\
    }\n\
    addMarkedSpan(line, span);\n\
    ++curLine;\n\
  });\n\
  if (marker.collapsed) doc.iter(from.line, to.line + 1, function(line) {\n\
    if (lineIsHidden(line)) updateLineHeight(line, 0);\n\
  });\n\
\n\
  if (marker.readOnly) {\n\
    sawReadOnlySpans = true;\n\
    if (doc.history.done.length || doc.history.undone.length)\n\
      doc.clearHistory();\n\
  }\n\
  if (marker.collapsed) {\n\
    if (collapsedAtStart != collapsedAtEnd)\n\
      throw new Error(\"Inserting collapsed marker overlapping an existing one\");\n\
    marker.size = size;\n\
    marker.atomic = true;\n\
  }\n\
  if (cm) {\n\
    if (updateMaxLine) cm.curOp.updateMaxLine = true;\n\
    if (marker.className || marker.startStyle || marker.endStyle || marker.collapsed)\n\
      regChange(cm, from.line, to.line + 1);\n\
    if (marker.atomic) reCheckSelection(cm);\n\
  }\n\
  return marker;\n\
}\n\
\n\
// SHARED TEXTMARKERS\n\
\n\
function SharedTextMarker(markers, primary) {\n\
  this.markers = markers;\n\
  this.primary = primary;\n\
  for (var i = 0, me = this; i < markers.length; ++i) {\n\
    markers[i].parent = this;\n\
    on(markers[i], \"clear\", function(){me.clear();});\n\
  }\n\
}\n\
CodeMirror.SharedTextMarker = SharedTextMarker;\n\
\n\
SharedTextMarker.prototype.clear = function() {\n\
  if (this.explicitlyCleared) return;\n\
  this.explicitlyCleared = true;\n\
  for (var i = 0; i < this.markers.length; ++i)\n\
    this.markers[i].clear();\n\
  signalLater(this, \"clear\");\n\
};\n\
SharedTextMarker.prototype.find = function() {\n\
  return this.primary.find();\n\
};\n\
SharedTextMarker.prototype.getOptions = function(copyWidget) {\n\
  var inner = this.primary.getOptions(copyWidget);\n\
  inner.shared = true;\n\
  return inner;\n\
};\n\
\n\
function markTextShared(doc, from, to, options, type) {\n\
  options = copyObj(options);\n\
  options.shared = false;\n\
  var markers = [markText(doc, from, to, options, type)], primary = markers[0];\n\
  linkedDocs(doc, function(doc) {\n\
    markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));\n\
    for (var i = 0; i < doc.linked.length; ++i)\n\
      if (doc.linked[i].isParent) return;\n\
    primary = lst(markers);\n\
  });\n\
  return new SharedTextMarker(markers, primary);\n\
}\n\
\n\
// TEXTMARKER SPANS\n\
\n\
function getMarkedSpanFor(spans, marker) {\n\
  if (spans) for (var i = 0; i < spans.length; ++i) {\n\
    var span = spans[i];\n\
    if (span.marker == marker) return span;\n\
  }\n\
}\n\
function removeMarkedSpan(spans, span) {\n\
  for (var r, i = 0; i < spans.length; ++i)\n\
    if (spans[i] != span) (r || (r = [])).push(spans[i]);\n\
  return r;\n\
}\n\
function addMarkedSpan(line, span) {\n\
  line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];\n\
  span.marker.attachLine(line);\n\
}\n\
\n\
function markedSpansBefore(old, startCh) {\n\
  if (old) for (var i = 0, nw; i < old.length; ++i) {\n\
    var span = old[i], marker = span.marker;\n\
    var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);\n\
    if (startsBefore || marker.type == \"bookmark\" && span.from == startCh) {\n\
      var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);\n\
      (nw || (nw = [])).push({from: span.from,\n\
                              to: endsAfter ? null : span.to,\n\
                              marker: marker});\n\
    }\n\
  }\n\
  return nw;\n\
}\n\
\n\
function markedSpansAfter(old, startCh, endCh) {\n\
  if (old) for (var i = 0, nw; i < old.length; ++i) {\n\
    var span = old[i], marker = span.marker;\n\
    var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);\n\
    if (endsAfter || marker.type == \"bookmark\" && span.from == endCh && span.from != startCh) {\n\
      var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);\n\
      (nw || (nw = [])).push({from: startsBefore ? null : span.from - endCh,\n\
                              to: span.to == null ? null : span.to - endCh,\n\
                              marker: marker});\n\
    }\n\
  }\n\
  return nw;\n\
}\n\
\n\
function stretchSpansOverChange(doc, change) {\n\
  var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;\n\
  var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;\n\
  if (!oldFirst && !oldLast) return null;\n\
\n\
  var startCh = change.from.ch, endCh = change.to.ch;\n\
  // Get the spans that 'stick out' on both sides\n\
  var first = markedSpansBefore(oldFirst, startCh);\n\
  var last = markedSpansAfter(oldLast, change.from.line == change.to.line ? startCh : NaN, endCh);\n\
\n\
  // Next, merge those two ends\n\
  var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0);\n\
  if (first) {\n\
    // Fix up .to properties of first\n\
    for (var i = 0; i < first.length; ++i) {\n\
      var span = first[i];\n\
      if (span.to == null) {\n\
        var found = getMarkedSpanFor(last, span.marker);\n\
        if (!found) span.to = startCh;\n\
        else if (sameLine) span.to = found.to == null ? null : found.to + offset;\n\
      }\n\
    }\n\
  }\n\
  if (last) {\n\
    // Fix up .from in last (or move them into first in case of sameLine)\n\
    for (var i = 0; i < last.length; ++i) {\n\
      var span = last[i];\n\
      if (span.to != null) span.to += offset;\n\
      if (span.from == null) {\n\
        var found = getMarkedSpanFor(first, span.marker);\n\
        if (!found) {\n\
          span.from = offset;\n\
          if (sameLine) (first || (first = [])).push(span);\n\
        }\n\
      } else {\n\
        span.from += offset;\n\
        if (sameLine) (first || (first = [])).push(span);\n\
      }\n\
    }\n\
  }\n\
\n\
  var newMarkers = [first];\n\
  if (!sameLine) {\n\
    // Fill gap with whole-line-spans\n\
    var gap = change.text.length - 2, gapMarkers;\n\
    if (gap > 0 && first)\n\
      for (var i = 0; i < first.length; ++i)\n\
        if (first[i].to == null)\n\
          (gapMarkers || (gapMarkers = [])).push({from: null, to: null, marker: first[i].marker});\n\
    for (var i = 0; i < gap; ++i)\n\
      newMarkers.push(gapMarkers);\n\
    newMarkers.push(last);\n\
  }\n\
  return newMarkers;\n\
}\n\
\n\
function mergeOldSpans(doc, change) {\n\
  var old = getOldSpans(doc, change);\n\
  var stretched = stretchSpansOverChange(doc, change);\n\
  if (!old) return stretched;\n\
  if (!stretched) return old;\n\
\n\
  for (var i = 0; i < old.length; ++i) {\n\
    var oldCur = old[i], stretchCur = stretched[i];\n\
    if (oldCur && stretchCur) {\n\
      spans: for (var j = 0; j < stretchCur.length; ++j) {\n\
        var span = stretchCur[j];\n\
        for (var k = 0; k < oldCur.length; ++k)\n\
          if (oldCur[k].marker == span.marker) continue spans;\n\
        oldCur.push(span);\n\
      }\n\
    } else if (stretchCur) {\n\
      old[i] = stretchCur;\n\
    }\n\
  }\n\
  return old;\n\
}\n\
\n\
function removeReadOnlyRanges(doc, from, to) {\n\
  var markers = null;\n\
  doc.iter(from.line, to.line + 1, function(line) {\n\
    if (line.markedSpans) for (var i = 0; i < line.markedSpans.length; ++i) {\n\
      var mark = line.markedSpans[i].marker;\n\
      if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))\n\
        (markers || (markers = [])).push(mark);\n\
    }\n\
  });\n\
  if (!markers) return null;\n\
  var parts = [{from: from, to: to}];\n\
  for (var i = 0; i < markers.length; ++i) {\n\
    var m = markers[i].find();\n\
    for (var j = 0; j < parts.length; ++j) {\n\
      var p = parts[j];\n\
      if (!posLess(m.from, p.to) || posLess(m.to, p.from)) continue;\n\
      var newParts = [j, 1];\n\
      if (posLess(p.from, m.from)) newParts.push({from: p.from, to: m.from});\n\
      if (posLess(m.to, p.to)) newParts.push({from: m.to, to: p.to});\n\
      parts.splice.apply(parts, newParts);\n\
      j += newParts.length - 1;\n\
    }\n\
  }\n\
  return parts;\n\
}\n\
\n\
function collapsedSpanAt(line, ch) {\n\
  var sps = sawCollapsedSpans && line.markedSpans, found;\n\
  if (sps) for (var sp, i = 0; i < sps.length; ++i) {\n\
    sp = sps[i];\n\
    if (!sp.marker.collapsed) continue;\n\
    if ((sp.from == null || sp.from < ch) &&\n\
        (sp.to == null || sp.to > ch) &&\n\
        (!found || found.width < sp.marker.width))\n\
      found = sp.marker;\n\
  }\n\
  return found;\n\
}\n\
function collapsedSpanAtStart(line) { return collapsedSpanAt(line, -1); }\n\
function collapsedSpanAtEnd(line) { return collapsedSpanAt(line, line.text.length + 1); }\n\
\n\
function visualLine(doc, line) {\n\
  var merged;\n\
  while (merged = collapsedSpanAtStart(line))\n\
    line = getLine(doc, merged.find().from.line);\n\
  return line;\n\
}\n\
\n\
function lineIsHidden(line) {\n\
  var sps = sawCollapsedSpans && line.markedSpans;\n\
  if (sps) for (var sp, i = 0; i < sps.length; ++i) {\n\
    sp = sps[i];\n\
    if (!sp.marker.collapsed) continue;\n\
    if (sp.from == null) return true;\n\
    if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(line, sp))\n\
      return true;\n\
  }\n\
}\n\
function lineIsHiddenInner(line, span) {\n\
  if (span.to == null) {\n\
    var end = span.marker.find().to, endLine = getLine(lineDoc(line), end.line);\n\
    return lineIsHiddenInner(endLine, getMarkedSpanFor(endLine.markedSpans, span.marker));\n\
  }\n\
  if (span.marker.inclusiveRight && span.to == line.text.length)\n\
    return true;\n\
  for (var sp, i = 0; i < line.markedSpans.length; ++i) {\n\
    sp = line.markedSpans[i];\n\
    if (sp.marker.collapsed && sp.from == span.to &&\n\
        (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&\n\
        lineIsHiddenInner(line, sp)) return true;\n\
  }\n\
}\n\
\n\
function detachMarkedSpans(line) {\n\
  var spans = line.markedSpans;\n\
  if (!spans) return;\n\
  for (var i = 0; i < spans.length; ++i)\n\
    spans[i].marker.detachLine(line);\n\
  line.markedSpans = null;\n\
}\n\
\n\
function attachMarkedSpans(line, spans) {\n\
  if (!spans) return;\n\
  for (var i = 0; i < spans.length; ++i)\n\
    spans[i].marker.attachLine(line);\n\
  line.markedSpans = spans;\n\
}\n\
\n\
// LINE WIDGETS\n\
\n\
var LineWidget = CodeMirror.LineWidget = function(cm, node, options) {\n\
  for (var opt in options) if (options.hasOwnProperty(opt))\n\
    this[opt] = options[opt];\n\
  this.cm = cm;\n\
  this.node = node;\n\
};\n\
function widgetOperation(f) {\n\
  return function() {\n\
    var withOp = !this.cm.curOp;\n\
    if (withOp) startOperation(this.cm);\n\
    try {var result = f.apply(this, arguments);}\n\
    finally {if (withOp) endOperation(this.cm);}\n\
    return result;\n\
  };\n\
}\n\
LineWidget.prototype.clear = widgetOperation(function() {\n\
  var ws = this.line.widgets, no = lineNo(this.line);\n\
  if (no == null || !ws) return;\n\
  for (var i = 0; i < ws.length; ++i) if (ws[i] == this) ws.splice(i--, 1);\n\
  if (!ws.length) this.line.widgets = null;\n\
  updateLineHeight(this.line, Math.max(0, this.line.height - widgetHeight(this)));\n\
  regChange(this.cm, no, no + 1);\n\
});\n\
LineWidget.prototype.changed = widgetOperation(function() {\n\
  var oldH = this.height;\n\
  this.height = null;\n\
  var diff = widgetHeight(this) - oldH;\n\
  if (!diff) return;\n\
  updateLineHeight(this.line, this.line.height + diff);\n\
  var no = lineNo(this.line);\n\
  regChange(this.cm, no, no + 1);\n\
});\n\
\n\
function widgetHeight(widget) {\n\
  if (widget.height != null) return widget.height;\n\
  if (!widget.node.parentNode || widget.node.parentNode.nodeType != 1)\n\
    removeChildrenAndAdd(widget.cm.display.measure, elt(\"div\", [widget.node], null, \"position: relative\"));\n\
  return widget.height = widget.node.offsetHeight;\n\
}\n\
\n\
function addLineWidget(cm, handle, node, options) {\n\
  var widget = new LineWidget(cm, node, options);\n\
  if (widget.noHScroll) cm.display.alignWidgets = true;\n\
  changeLine(cm, handle, function(line) {\n\
    (line.widgets || (line.widgets = [])).push(widget);\n\
    widget.line = line;\n\
    if (!lineIsHidden(line) || widget.showIfHidden) {\n\
      var aboveVisible = heightAtLine(cm, line) < cm.display.scroller.scrollTop;\n\
      updateLineHeight(line, line.height + widgetHeight(widget));\n\
      if (aboveVisible)\n\
        cm.curOp.updateScrollPos = {scrollTop: cm.doc.scrollTop + widget.height,\n\
                                    scrollLeft: cm.doc.scrollLeft};\n\
    }\n\
    return true;\n\
  });\n\
  return widget;\n\
}\n\
\n\
// LINE DATA STRUCTURE\n\
\n\
// Line objects. These hold state related to a line, including\n\
// highlighting info (the styles array).\n\
function makeLine(text, markedSpans, estimateHeight) {\n\
  var line = {text: text};\n\
  attachMarkedSpans(line, markedSpans);\n\
  line.height = estimateHeight ? estimateHeight(line) : 1;\n\
  return line;\n\
}\n\
\n\
function updateLine(line, text, markedSpans, estimateHeight) {\n\
  line.text = text;\n\
  if (line.stateAfter) line.stateAfter = null;\n\
  if (line.styles) line.styles = null;\n\
  if (line.order != null) line.order = null;\n\
  detachMarkedSpans(line);\n\
  attachMarkedSpans(line, markedSpans);\n\
  var estHeight = estimateHeight ? estimateHeight(line) : 1;\n\
  if (estHeight != line.height) updateLineHeight(line, estHeight);\n\
  signalLater(line, \"change\");\n\
}\n\
\n\
function cleanUpLine(line) {\n\
  line.parent = null;\n\
  detachMarkedSpans(line);\n\
}\n\
\n\
// Run the given mode's parser over a line, update the styles\n\
// array, which contains alternating fragments of text and CSS\n\
// classes.\n\
function runMode(cm, text, mode, state, f) {\n\
  var flattenSpans = cm.options.flattenSpans;\n\
  var curText = \"\", curStyle = null;\n\
  var stream = new StringStream(text, cm.options.tabSize);\n\
  if (text == \"\" && mode.blankLine) mode.blankLine(state);\n\
  while (!stream.eol()) {\n\
    var style = mode.token(stream, state);\n\
    if (stream.pos > 5000) {\n\
      flattenSpans = false;\n\
      // Webkit seems to refuse to render text nodes longer than 57444 characters\n\
      stream.pos = Math.min(text.length, stream.start + 50000);\n\
      style = null;\n\
    }\n\
    var substr = stream.current();\n\
    stream.start = stream.pos;\n\
    if (!flattenSpans || curStyle != style) {\n\
      if (curText) f(curText, curStyle);\n\
      curText = substr; curStyle = style;\n\
    } else curText = curText + substr;\n\
  }\n\
  if (curText) f(curText, curStyle);\n\
}\n\
\n\
function highlightLine(cm, line, state) {\n\
  // A styles array always starts with a number identifying the\n\
  // mode/overlays that it is based on (for easy invalidation).\n\
  var st = [cm.state.modeGen];\n\
  // Compute the base array of styles\n\
  runMode(cm, line.text, cm.doc.mode, state, function(txt, style) {st.push(txt, style);});\n\
\n\
  // Run overlays, adjust style array.\n\
  for (var o = 0; o < cm.state.overlays.length; ++o) {\n\
    var overlay = cm.state.overlays[o], i = 1;\n\
    runMode(cm, line.text, overlay.mode, true, function(txt, style) {\n\
      var start = i, len = txt.length;\n\
      // Ensure there's a token end at the current position, and that i points at it\n\
      while (len) {\n\
        var cur = st[i], len_ = cur.length;\n\
        if (len_ <= len) {\n\
          len -= len_;\n\
        } else {\n\
          st.splice(i, 1, cur.slice(0, len), st[i+1], cur.slice(len));\n\
          len = 0;\n\
        }\n\
        i += 2;\n\
      }\n\
      if (!style) return;\n\
      if (overlay.opaque) {\n\
        st.splice(start, i - start, txt, style);\n\
        i = start + 2;\n\
      } else {\n\
        for (; start < i; start += 2) {\n\
          var cur = st[start+1];\n\
          st[start+1] = cur ? cur + \" \" + style : style;\n\
        }\n\
      }\n\
    });\n\
  }\n\
\n\
  return st;\n\
}\n\
\n\
function getLineStyles(cm, line) {\n\
  if (!line.styles || line.styles[0] != cm.state.modeGen)\n\
    line.styles = highlightLine(cm, line, line.stateAfter = getStateBefore(cm, lineNo(line)));\n\
  return line.styles;\n\
}\n\
\n\
// Lightweight form of highlight -- proceed over this line and\n\
// update state, but don't save a style array.\n\
function processLine(cm, line, state) {\n\
  var mode = cm.doc.mode;\n\
  var stream = new StringStream(line.text, cm.options.tabSize);\n\
  if (line.text == \"\" && mode.blankLine) mode.blankLine(state);\n\
  while (!stream.eol() && stream.pos <= 5000) {\n\
    mode.token(stream, state);\n\
    stream.start = stream.pos;\n\
  }\n\
}\n\
\n\
var styleToClassCache = {};\n\
function styleToClass(style) {\n\
  if (!style) return null;\n\
  return styleToClassCache[style] ||\n\
    (styleToClassCache[style] = \"cm-\" + style.replace(/ +/g, \" cm-\"));\n\
}\n\
\n\
function lineContent(cm, realLine, measure) {\n\
  var merged, line = realLine, lineBefore, sawBefore, simple = true;\n\
  while (merged = collapsedSpanAtStart(line)) {\n\
    simple = false;\n\
    line = getLine(cm.doc, merged.find().from.line);\n\
    if (!lineBefore) lineBefore = line;\n\
  }\n\
\n\
  var builder = {pre: elt(\"pre\"), col: 0, pos: 0, display: !measure,\n\
                 measure: null, addedOne: false, cm: cm};\n\
  if (line.textClass) builder.pre.className = line.textClass;\n\
\n\
  do {\n\
    builder.measure = line == realLine && measure;\n\
    builder.pos = 0;\n\
    builder.addToken = builder.measure ? buildTokenMeasure : buildToken;\n\
    if (measure && sawBefore && line != realLine && !builder.addedOne) {\n\
      measure[0] = builder.pre.appendChild(zeroWidthElement(cm.display.measure));\n\
      builder.addedOne = true;\n\
    }\n\
    var next = insertLineContent(line, builder, getLineStyles(cm, line));\n\
    sawBefore = line == lineBefore;\n\
    if (next) {\n\
      line = getLine(cm.doc, next.to.line);\n\
      simple = false;\n\
    }\n\
  } while (next);\n\
\n\
  if (measure && !builder.addedOne)\n\
    measure[0] = builder.pre.appendChild(simple ? elt(\"span\", \"\\u00a0\") : zeroWidthElement(cm.display.measure));\n\
  if (!builder.pre.firstChild && !lineIsHidden(realLine))\n\
    builder.pre.appendChild(document.createTextNode(\"\\u00a0\"));\n\
\n\
  return builder.pre;\n\
}\n\
\n\
var tokenSpecialChars = /[\\t\\u0000-\\u0019\\u200b\\u2028\\u2029\\uFEFF]/g;\n\
function buildToken(builder, text, style, startStyle, endStyle) {\n\
  if (!text) return;\n\
  if (!tokenSpecialChars.test(text)) {\n\
    builder.col += text.length;\n\
    var content = document.createTextNode(text);\n\
  } else {\n\
    var content = document.createDocumentFragment(), pos = 0;\n\
    while (true) {\n\
      tokenSpecialChars.lastIndex = pos;\n\
      var m = tokenSpecialChars.exec(text);\n\
      var skipped = m ? m.index - pos : text.length - pos;\n\
      if (skipped) {\n\
        content.appendChild(document.createTextNode(text.slice(pos, pos + skipped)));\n\
        builder.col += skipped;\n\
      }\n\
      if (!m) break;\n\
      pos += skipped + 1;\n\
      if (m[0] == \"\\t\") {\n\
        var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;\n\
        content.appendChild(elt(\"span\", spaceStr(tabWidth), \"cm-tab\"));\n\
        builder.col += tabWidth;\n\
      } else {\n\
        var token = elt(\"span\", \"\\u2022\", \"cm-invalidchar\");\n\
        token.title = \"\\\\u\" + m[0].charCodeAt(0).toString(16);\n\
        content.appendChild(token);\n\
        builder.col += 1;\n\
      }\n\
    }\n\
  }\n\
  if (style || startStyle || endStyle || builder.measure) {\n\
    var fullStyle = style || \"\";\n\
    if (startStyle) fullStyle += startStyle;\n\
    if (endStyle) fullStyle += endStyle;\n\
    return builder.pre.appendChild(elt(\"span\", [content], fullStyle));\n\
  }\n\
  builder.pre.appendChild(content);\n\
}\n\
\n\
function buildTokenMeasure(builder, text, style, startStyle, endStyle) {\n\
  for (var i = 0; i < text.length; ++i) {\n\
    if (i && i < text.length &&\n\
        builder.cm.options.lineWrapping &&\n\
        spanAffectsWrapping.test(text.slice(i - 1, i + 1)))\n\
      builder.pre.appendChild(elt(\"wbr\"));\n\
    builder.measure[builder.pos++] =\n\
      buildToken(builder, text.charAt(i), style,\n\
                 i == 0 && startStyle, i == text.length - 1 && endStyle);\n\
  }\n\
  if (text.length) builder.addedOne = true;\n\
}\n\
\n\
function buildCollapsedSpan(builder, size, widget) {\n\
  if (widget) {\n\
    if (!builder.display) widget = widget.cloneNode(true);\n\
    builder.pre.appendChild(widget);\n\
    if (builder.measure && size) {\n\
      builder.measure[builder.pos] = widget;\n\
      builder.addedOne = true;\n\
    }\n\
  }\n\
  builder.pos += size;\n\
}\n\
\n\
// Outputs a number of spans to make up a line, taking highlighting\n\
// and marked text into account.\n\
function insertLineContent(line, builder, styles) {\n\
  var spans = line.markedSpans;\n\
  if (!spans) {\n\
    for (var i = 1; i < styles.length; i+=2)\n\
      builder.addToken(builder, styles[i], styleToClass(styles[i+1]));\n\
    return;\n\
  }\n\
\n\
  var allText = line.text, len = allText.length;\n\
  var pos = 0, i = 1, text = \"\", style;\n\
  var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, collapsed;\n\
  for (;;) {\n\
    if (nextChange == pos) { // Update current marker set\n\
      spanStyle = spanEndStyle = spanStartStyle = \"\";\n\
      collapsed = null; nextChange = Infinity;\n\
      var foundBookmark = null;\n\
      for (var j = 0; j < spans.length; ++j) {\n\
        var sp = spans[j], m = sp.marker;\n\
        if (sp.from <= pos && (sp.to == null || sp.to > pos)) {\n\
          if (sp.to != null && nextChange > sp.to) { nextChange = sp.to; spanEndStyle = \"\"; }\n\
          if (m.className) spanStyle += \" \" + m.className;\n\
          if (m.startStyle && sp.from == pos) spanStartStyle += \" \" + m.startStyle;\n\
          if (m.endStyle && sp.to == nextChange) spanEndStyle += \" \" + m.endStyle;\n\
          if (m.collapsed && (!collapsed || collapsed.marker.width < m.width))\n\
            collapsed = sp;\n\
        } else if (sp.from > pos && nextChange > sp.from) {\n\
          nextChange = sp.from;\n\
        }\n\
        if (m.type == \"bookmark\" && sp.from == pos && m.replacedWith)\n\
          foundBookmark = m.replacedWith;\n\
      }\n\
      if (collapsed && (collapsed.from || 0) == pos) {\n\
        buildCollapsedSpan(builder, (collapsed.to == null ? len : collapsed.to) - pos,\n\
                           collapsed.from != null && collapsed.marker.replacedWith);\n\
        if (collapsed.to == null) return collapsed.marker.find();\n\
      }\n\
      if (foundBookmark && !collapsed) buildCollapsedSpan(builder, 0, foundBookmark);\n\
    }\n\
    if (pos >= len) break;\n\
\n\
    var upto = Math.min(len, nextChange);\n\
    while (true) {\n\
      if (text) {\n\
        var end = pos + text.length;\n\
        if (!collapsed) {\n\
          var tokenText = end > upto ? text.slice(0, upto - pos) : text;\n\
          builder.addToken(builder, tokenText, style + spanStyle,\n\
                           spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : \"\");\n\
        }\n\
        if (end >= upto) {text = text.slice(upto - pos); pos = upto; break;}\n\
        pos = end;\n\
        spanStartStyle = \"\";\n\
      }\n\
      text = styles[i++]; style = styleToClass(styles[i++]);\n\
    }\n\
  }\n\
}\n\
\n\
// DOCUMENT DATA STRUCTURE\n\
\n\
function updateDoc(doc, change, markedSpans, selAfter, estimateHeight) {\n\
  function spansFor(n) {return markedSpans ? markedSpans[n] : null;}\n\
\n\
  var from = change.from, to = change.to, text = change.text;\n\
  var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line);\n\
  var lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;\n\
\n\
  // First adjust the line structure\n\
  if (from.ch == 0 && to.ch == 0 && lastText == \"\") {\n\
    // This is a whole-line replace. Treated specially to make\n\
    // sure line objects move the way they are supposed to.\n\
    for (var i = 0, e = text.length - 1, added = []; i < e; ++i)\n\
      added.push(makeLine(text[i], spansFor(i), estimateHeight));\n\
    updateLine(lastLine, lastLine.text, lastSpans, estimateHeight);\n\
    if (nlines) doc.remove(from.line, nlines);\n\
    if (added.length) doc.insert(from.line, added);\n\
  } else if (firstLine == lastLine) {\n\
    if (text.length == 1) {\n\
      updateLine(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch),\n\
                 lastSpans, estimateHeight);\n\
    } else {\n\
      for (var added = [], i = 1, e = text.length - 1; i < e; ++i)\n\
        added.push(makeLine(text[i], spansFor(i), estimateHeight));\n\
      added.push(makeLine(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight));\n\
      updateLine(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0), estimateHeight);\n\
      doc.insert(from.line + 1, added);\n\
    }\n\
  } else if (text.length == 1) {\n\
    updateLine(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch),\n\
               spansFor(0), estimateHeight);\n\
    doc.remove(from.line + 1, nlines);\n\
  } else {\n\
    updateLine(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0), estimateHeight);\n\
    updateLine(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans, estimateHeight);\n\
    for (var i = 1, e = text.length - 1, added = []; i < e; ++i)\n\
      added.push(makeLine(text[i], spansFor(i), estimateHeight));\n\
    if (nlines > 1) doc.remove(from.line + 1, nlines - 1);\n\
    doc.insert(from.line + 1, added);\n\
  }\n\
\n\
  setSelection(doc, selAfter.anchor, selAfter.head, null, true);\n\
}\n\
\n\
function LeafChunk(lines) {\n\
  this.lines = lines;\n\
  this.parent = null;\n\
  for (var i = 0, e = lines.length, height = 0; i < e; ++i) {\n\
    lines[i].parent = this;\n\
    height += lines[i].height;\n\
  }\n\
  this.height = height;\n\
}\n\
\n\
LeafChunk.prototype = {\n\
  chunkSize: function() { return this.lines.length; },\n\
  removeInner: function(at, n) {\n\
    for (var i = at, e = at + n; i < e; ++i) {\n\
      var line = this.lines[i];\n\
      this.height -= line.height;\n\
      cleanUpLine(line);\n\
      signalLater(line, \"delete\");\n\
    }\n\
    this.lines.splice(at, n);\n\
  },\n\
  collapse: function(lines) {\n\
    lines.splice.apply(lines, [lines.length, 0].concat(this.lines));\n\
  },\n\
  insertInner: function(at, lines, height) {\n\
    this.height += height;\n\
    this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));\n\
    for (var i = 0, e = lines.length; i < e; ++i) lines[i].parent = this;\n\
  },\n\
  iterN: function(at, n, op) {\n\
    for (var e = at + n; at < e; ++at)\n\
      if (op(this.lines[at])) return true;\n\
  }\n\
};\n\
\n\
function BranchChunk(children) {\n\
  this.children = children;\n\
  var size = 0, height = 0;\n\
  for (var i = 0, e = children.length; i < e; ++i) {\n\
    var ch = children[i];\n\
    size += ch.chunkSize(); height += ch.height;\n\
    ch.parent = this;\n\
  }\n\
  this.size = size;\n\
  this.height = height;\n\
  this.parent = null;\n\
}\n\
\n\
BranchChunk.prototype = {\n\
  chunkSize: function() { return this.size; },\n\
  removeInner: function(at, n) {\n\
    this.size -= n;\n\
    for (var i = 0; i < this.children.length; ++i) {\n\
      var child = this.children[i], sz = child.chunkSize();\n\
      if (at < sz) {\n\
        var rm = Math.min(n, sz - at), oldHeight = child.height;\n\
        child.removeInner(at, rm);\n\
        this.height -= oldHeight - child.height;\n\
        if (sz == rm) { this.children.splice(i--, 1); child.parent = null; }\n\
        if ((n -= rm) == 0) break;\n\
        at = 0;\n\
      } else at -= sz;\n\
    }\n\
    if (this.size - n < 25) {\n\
      var lines = [];\n\
      this.collapse(lines);\n\
      this.children = [new LeafChunk(lines)];\n\
      this.children[0].parent = this;\n\
    }\n\
  },\n\
  collapse: function(lines) {\n\
    for (var i = 0, e = this.children.length; i < e; ++i) this.children[i].collapse(lines);\n\
  },\n\
  insertInner: function(at, lines, height) {\n\
    this.size += lines.length;\n\
    this.height += height;\n\
    for (var i = 0, e = this.children.length; i < e; ++i) {\n\
      var child = this.children[i], sz = child.chunkSize();\n\
      if (at <= sz) {\n\
        child.insertInner(at, lines, height);\n\
        if (child.lines && child.lines.length > 50) {\n\
          while (child.lines.length > 50) {\n\
            var spilled = child.lines.splice(child.lines.length - 25, 25);\n\
            var newleaf = new LeafChunk(spilled);\n\
            child.height -= newleaf.height;\n\
            this.children.splice(i + 1, 0, newleaf);\n\
            newleaf.parent = this;\n\
          }\n\
          this.maybeSpill();\n\
        }\n\
        break;\n\
      }\n\
      at -= sz;\n\
    }\n\
  },\n\
  maybeSpill: function() {\n\
    if (this.children.length <= 10) return;\n\
    var me = this;\n\
    do {\n\
      var spilled = me.children.splice(me.children.length - 5, 5);\n\
      var sibling = new BranchChunk(spilled);\n\
      if (!me.parent) { // Become the parent node\n\
        var copy = new BranchChunk(me.children);\n\
        copy.parent = me;\n\
        me.children = [copy, sibling];\n\
        me = copy;\n\
      } else {\n\
        me.size -= sibling.size;\n\
        me.height -= sibling.height;\n\
        var myIndex = indexOf(me.parent.children, me);\n\
        me.parent.children.splice(myIndex + 1, 0, sibling);\n\
      }\n\
      sibling.parent = me.parent;\n\
    } while (me.children.length > 10);\n\
    me.parent.maybeSpill();\n\
  },\n\
  iterN: function(at, n, op) {\n\
    for (var i = 0, e = this.children.length; i < e; ++i) {\n\
      var child = this.children[i], sz = child.chunkSize();\n\
      if (at < sz) {\n\
        var used = Math.min(n, sz - at);\n\
        if (child.iterN(at, used, op)) return true;\n\
        if ((n -= used) == 0) break;\n\
        at = 0;\n\
      } else at -= sz;\n\
    }\n\
  }\n\
};\n\
\n\
var nextDocId = 0;\n\
var Doc = CodeMirror.Doc = function Doc(text, mode, firstLine) {\n\
  if (!(this instanceof Doc)) return new Doc(text, mode, firstLine);\n\
  if (firstLine == null) firstLine = 0;\n\
  \n\
  BranchChunk.call(this, [new LeafChunk([makeLine(\"\", null)])]);\n\
  this.first = firstLine;\n\
  this.scrollTop = this.scrollLeft = 0;\n\
  this.cantEdit = false;\n\
  this.history = makeHistory();\n\
  this.frontier = firstLine;\n\
  var start = {line: firstLine, ch: 0};\n\
  this.sel = {from: start, to: start, head: start, anchor: start, shift: false, extend: false, goalColumn: null};\n\
  this.id = ++nextDocId;\n\
  this.modeOption = mode;\n\
\n\
  if (typeof text == \"string\") text = splitLines(text);\n\
  updateDoc(this, {from: start, to: start, text: text}, null, {head: start, anchor: start});\n\
};\n\
\n\
Doc.prototype = createObj(BranchChunk.prototype, {\n\
  iter: function(from, to, op) {\n\
    if (op) this.iterN(from - this.first, to - (from - this.first), op);\n\
    else this.iterN(this.first, this.first + this.size, from);\n\
  },\n\
\n\
  insert: function(at, lines) {\n\
    var height = 0;\n\
    for (var i = 0, e = lines.length; i < e; ++i) height += lines[i].height;\n\
    this.insertInner(at - this.first, lines, height);\n\
  },\n\
  remove: function(at, n) { this.removeInner(at - this.first, n); },\n\
\n\
  getValue: function(lineSep) {\n\
    var lines = getLines(this, this.first, this.first + this.size);\n\
    if (lineSep === false) return lines;\n\
    return lines.join(lineSep || \"\\n\
\");\n\
  },\n\
  setValue: function(code) {\n\
    var top = {line: this.first, ch: 0}, last = this.first + this.size - 1;\n\
    makeChange(this, {from: top, to: {line: last, ch: getLine(this, last).text.length},\n\
                      text: splitLines(code), origin: \"setValue\"},\n\
               {head: top, anchor: top}, true);\n\
  },\n\
  replaceRange: function(code, from, to) {\n\
    from = clipPos(this, from);\n\
    to = to ? clipPos(this, to) : from;\n\
    replaceRange(this, code, from, to);\n\
  },\n\
  getRange: function(from, to, lineSep) {\n\
    var lines = getBetween(this, clipPos(this, from), clipPos(this, to));\n\
    if (lineSep === false) return lines;\n\
    return lines.join(lineSep || \"\\n\
\");\n\
  },\n\
\n\
  getLine: function(line) {var l = this.getLineHandle(line); return l && l.text;},\n\
  setLine: function(line, text) {\n\
    if (isLine(this, line))\n\
      replaceRange(this, text, {line: line, ch: 0}, {line: line, ch: getLine(this, line).text.length});\n\
  },\n\
  removeLine: function(line) {\n\
    if (isLine(this, line))\n\
      replaceRange(this, \"\", {line: line, ch: 0}, clipPos(this, {line: line+1, ch: 0}));\n\
  },\n\
\n\
  getLineHandle: function(line) {if (isLine(this, line)) return getLine(this, line);},\n\
  getLineNumber: function(line) {return lineNo(line);},\n\
\n\
  lineCount: function() {return this.size;},\n\
  firstLine: function() {return this.first;},\n\
  lastLine: function() {return this.first + this.size - 1;},\n\
\n\
  clipPos: function(pos) {return clipPos(this, pos);},\n\
\n\
  getCursor: function(start) {\n\
    var sel = this.sel, pos;\n\
    if (start == null || start == \"head\") pos = sel.head;\n\
    else if (start == \"anchor\") pos = sel.anchor;\n\
    else if (start == \"end\" || start === false) pos = sel.to;\n\
    else pos = sel.from;\n\
    return copyPos(pos);\n\
  },\n\
  somethingSelected: function() {return !posEq(this.sel.head, this.sel.anchor);},\n\
\n\
  setCursor: docOperation(function(line, ch, extend) {\n\
    var pos = clipPos(this, typeof line == \"number\" ? {line: line, ch: ch || 0} : line);\n\
    if (extend) extendSelection(this, pos);\n\
    else setSelection(this, pos, pos);\n\
  }),\n\
  setSelection: docOperation(function(anchor, head) {\n\
    setSelection(this, clipPos(this, anchor), clipPos(this, head || anchor));\n\
  }),\n\
  extendSelection: docOperation(function(from, to) {\n\
    extendSelection(this, clipPos(this, from), to && clipPos(this, to));\n\
  }),\n\
\n\
  getSelection: function(lineSep) {return this.getRange(this.sel.from, this.sel.to, lineSep);},\n\
  replaceSelection: function(code, collapse, origin) {\n\
    makeChange(this, {from: this.sel.from, to: this.sel.to, text: splitLines(code), origin: origin}, collapse || \"around\");\n\
  },\n\
  undo: function() {makeChangeFromHistory(this, \"undo\");},\n\
  redo: function() {makeChangeFromHistory(this, \"redo\");},\n\
\n\
  setExtending: function(val) {this.sel.extend = val;},\n\
\n\
  historySize: function() {\n\
    var hist = this.history;\n\
    return {undo: hist.done.length, redo: hist.undone.length};\n\
  },\n\
  clearHistory: function() {this.history = makeHistory();},\n\
\n\
  markClean: function() {\n\
    this.history.dirtyCounter = 0;\n\
    this.history.lastOp = this.history.lastOrigin = null;\n\
  },\n\
  isClean: function () {return this.history.dirtyCounter == 0;},\n\
    \n\
  getHistory: function() {\n\
    return {done: copyHistoryArray(this.history.done),\n\
            undone: copyHistoryArray(this.history.undone)};\n\
  },\n\
  setHistory: function(histData) {\n\
    var hist = this.history = makeHistory();\n\
    hist.done = histData.done.slice(0);\n\
    hist.undone = histData.undone.slice(0);\n\
  },\n\
\n\
  markText: function(from, to, options) {\n\
    return markText(this, clipPos(this, from), clipPos(this, to), options, \"range\");\n\
  },\n\
  setBookmark: function(pos, widget) {\n\
    pos = clipPos(this, pos);\n\
    return markText(this, pos, pos, widget ? {replacedWith: widget} : {}, \"bookmark\");\n\
  },\n\
  findMarksAt: function(pos) {\n\
    pos = clipPos(this, pos);\n\
    var markers = [], spans = getLine(this, pos.line).markedSpans;\n\
    if (spans) for (var i = 0; i < spans.length; ++i) {\n\
      var span = spans[i];\n\
      if ((span.from == null || span.from <= pos.ch) &&\n\
          (span.to == null || span.to >= pos.ch))\n\
        markers.push(span.marker.parent || span.marker);\n\
    }\n\
    return markers;\n\
  },\n\
\n\
  posFromIndex: function(off) {\n\
    var ch, lineNo = this.first;\n\
    this.iter(function(line) {\n\
      var sz = line.text.length + 1;\n\
      if (sz > off) { ch = off; return true; }\n\
      off -= sz;\n\
      ++lineNo;\n\
    });\n\
    return clipPos(this, {line: lineNo, ch: ch});\n\
  },\n\
  indexFromPos: function (coords) {\n\
    coords = clipPos(this, coords);\n\
    var index = coords.ch;\n\
    if (coords.line < this.first || coords.ch < 0) return 0;\n\
    this.iter(this.first, coords.line, function (line) {\n\
      index += line.text.length + 1;\n\
    });\n\
    return index;\n\
  },\n\
\n\
  copy: function(copyHistory) {\n\
    var doc = new Doc(getLines(this, this.first, this.first + this.size), this.modeOption, this.first);\n\
    doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft;\n\
    doc.sel = {from: this.sel.from, to: this.sel.to, head: this.sel.head, anchor: this.sel.anchor,\n\
               shift: this.sel.shift, extend: false, goalColumn: this.sel.goalColumn};\n\
    if (copyHistory) {\n\
      doc.history.undoDepth = this.history.undoDepth;\n\
      doc.setHistory(this.getHistory());\n\
    }\n\
    return doc;\n\
  },\n\
\n\
  linkedDoc: function(options) {\n\
    if (!options) options = {};\n\
    var from = this.first, to = this.first + this.size;\n\
    if (options.from != null && options.from > from) from = options.from;\n\
    if (options.to != null && options.to < to) to = options.to;\n\
    var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from);\n\
    if (options.sharedHist) copy.history = this.history;\n\
    (this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist});\n\
    copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}];\n\
    return copy;\n\
  },\n\
  unlinkDoc: function(other) {\n\
    if (other instanceof CodeMirror) other = other.doc;\n\
    if (this.linked) for (var i = 0; i < this.linked.length; ++i) {\n\
      var link = this.linked[i];\n\
      if (link.doc != other) continue;\n\
      this.linked.splice(i, 1);\n\
      other.unlinkDoc(this);\n\
      break;\n\
    }\n\
    // If the histories were shared, split them again\n\
    if (other.history == this.history) {\n\
      var splitIds = [other.id];\n\
      linkedDocs(other, function(doc) {splitIds.push(doc.id);}, true);\n\
      other.history = makeHistory();\n\
      other.history.done = copyHistoryArray(this.history.done, splitIds);\n\
      other.history.undone = copyHistoryArray(this.history.undone, splitIds);\n\
    }\n\
  },\n\
  iterLinkedDocs: function(f) {linkedDocs(this, f);},\n\
\n\
  getMode: function() {return this.mode;},\n\
  getEditor: function() {return this.cm;}\n\
});\n\
\n\
// The Doc methods that should be available on CodeMirror instances\n\
var toDelegate = (\"setValue getValue getSelection replaceSelection undo redo historySize clearHistory markClean isClean \" +\n\
                  \"getHistory setHistory markText setBookmark findMarksAt lineCount firstLine lastLine clipPos getCursor \" +\n\
                  \"somethingSelected setCursor setSelection extendSelection setExtending getLine setLine removeLine getMode \" +\n\
                  \"replaceRange getRange getLineHandle getLineNumber posFromIndex indexFromPos linkedDoc unlinkDoc iterLinkedDocs\").split(\" \");\n\
for (var i = 0; i < toDelegate.length; ++i) (function(method) {\n\
  var target = Doc.prototype[method];\n\
  CodeMirror.prototype[method] = function() {return target.apply(this.doc, arguments);};\n\
})(toDelegate[i]);\n\
\n\
function linkedDocs(doc, f, sharedHistOnly) {\n\
  function propagate(doc, skip, sharedHist) {\n\
    if (doc.linked) for (var i = 0; i < doc.linked.length; ++i) {\n\
      var rel = doc.linked[i];\n\
      if (rel.doc == skip) continue;\n\
      var shared = sharedHist && rel.sharedHist;\n\
      if (sharedHistOnly && !shared) continue;\n\
      f(rel.doc, shared);\n\
      propagate(rel.doc, doc, shared);\n\
    }\n\
  }\n\
  propagate(doc, null, true);\n\
}\n\
\n\
function attachDoc(cm, doc) {\n\
  if (doc.cm) throw new Error(\"This document is already in use.\");\n\
  cm.doc = doc;\n\
  doc.cm = cm;\n\
  estimateLineHeights(cm);\n\
  loadMode(cm);\n\
  if (!cm.options.lineWrapping) computeMaxLength(cm);\n\
  cm.options.mode = doc.modeOption;\n\
  regChange(cm);\n\
}\n\
\n\
// LINE UTILITIES\n\
\n\
function getLine(chunk, n) {\n\
  n -= chunk.first;\n\
  while (!chunk.lines) {\n\
    for (var i = 0;; ++i) {\n\
      var child = chunk.children[i], sz = child.chunkSize();\n\
      if (n < sz) { chunk = child; break; }\n\
      n -= sz;\n\
    }\n\
  }\n\
  return chunk.lines[n];\n\
}\n\
\n\
function getBetween(doc, start, end) {\n\
  var out = [], n = start.line;\n\
  doc.iter(start.line, end.line + 1, function(line) {\n\
    var text = line.text;\n\
    if (n == end.line) text = text.slice(0, end.ch);\n\
    if (n == start.line) text = text.slice(start.ch);\n\
    out.push(text);\n\
    ++n;\n\
  });\n\
  return out;\n\
}\n\
function getLines(doc, from, to) {\n\
  var out = [];\n\
  doc.iter(from, to, function(line) { out.push(line.text); });\n\
  return out;\n\
}\n\
\n\
function updateLineHeight(line, height) {\n\
  var diff = height - line.height;\n\
  for (var n = line; n; n = n.parent) n.height += diff;\n\
}\n\
\n\
function lineNo(line) {\n\
  if (line.parent == null) return null;\n\
  var cur = line.parent, no = indexOf(cur.lines, line);\n\
  for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {\n\
    for (var i = 0;; ++i) {\n\
      if (chunk.children[i] == cur) break;\n\
      no += chunk.children[i].chunkSize();\n\
    }\n\
  }\n\
  return no + cur.first;\n\
}\n\
\n\
function lineDoc(line) {\n\
  for (var d = line.parent; d.parent; d = d.parent) {}\n\
  return d;\n\
}\n\
\n\
function lineAtHeight(chunk, h) {\n\
  var n = chunk.first;\n\
  outer: do {\n\
    for (var i = 0, e = chunk.children.length; i < e; ++i) {\n\
      var child = chunk.children[i], ch = child.height;\n\
      if (h < ch) { chunk = child; continue outer; }\n\
      h -= ch;\n\
      n += child.chunkSize();\n\
    }\n\
    return n;\n\
  } while (!chunk.lines);\n\
  for (var i = 0, e = chunk.lines.length; i < e; ++i) {\n\
    var line = chunk.lines[i], lh = line.height;\n\
    if (h < lh) break;\n\
    h -= lh;\n\
  }\n\
  return n + i;\n\
}\n\
\n\
function heightAtLine(cm, lineObj) {\n\
  lineObj = visualLine(cm.doc, lineObj);\n\
\n\
  var h = 0, chunk = lineObj.parent;\n\
  for (var i = 0; i < chunk.lines.length; ++i) {\n\
    var line = chunk.lines[i];\n\
    if (line == lineObj) break;\n\
    else h += line.height;\n\
  }\n\
  for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {\n\
    for (var i = 0; i < p.children.length; ++i) {\n\
      var cur = p.children[i];\n\
      if (cur == chunk) break;\n\
      else h += cur.height;\n\
    }\n\
  }\n\
  return h;\n\
}\n\
\n\
function getOrder(line) {\n\
  var order = line.order;\n\
  if (order == null) order = line.order = bidiOrdering(line.text);\n\
  return order;\n\
}\n\
\n\
// HISTORY\n\
\n\
function makeHistory() {\n\
  return {\n\
    // Arrays of history events. Doing something adds an event to\n\
    // done and clears undo. Undoing moves events from done to\n\
    // undone, redoing moves them in the other direction.\n\
    done: [], undone: [], undoDepth: Infinity,\n\
    // Used to track when changes can be merged into a single undo\n\
    // event\n\
    lastTime: 0, lastOp: null, lastOrigin: null,\n\
    // Used by the isClean() method\n\
    dirtyCounter: 0\n\
  };\n\
}\n\
\n\
function attachLocalSpans(doc, change, from, to) {\n\
  var existing = change[\"spans_\" + doc.id], n = 0;\n\
  doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function(line) {\n\
    if (line.markedSpans)\n\
      (existing || (existing = change[\"spans_\" + doc.id] = {}))[n] = line.markedSpans;\n\
    ++n;\n\
  });\n\
}\n\
\n\
function historyChangeFromChange(doc, change) {\n\
  var histChange = {from: change.from, to: changeEnd(change), text: getBetween(doc, change.from, change.to)};\n\
  attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);\n\
  linkedDocs(doc, function(doc) {attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);}, true);\n\
  return histChange;\n\
}\n\
\n\
function addToHistory(doc, change, selAfter, opId) {\n\
  var hist = doc.history;\n\
  hist.undone.length = 0;\n\
  var time = +new Date, cur = lst(hist.done);\n\
\n\
  if (cur &&\n\
      (hist.lastOp == opId ||\n\
       hist.lastOrigin == change.origin && (change.origin == \"input\" || change.origin == \"delete\") &&\n\
       hist.lastTime > time - 600)) {\n\
    // Merge this change into the last event\n\
    var last = lst(cur.changes);\n\
    if (posEq(change.from, change.to) && posEq(change.from, last.to)) {\n\
      // Optimized case for simple insertion -- don't want to add\n\
      // new changesets for every character typed\n\
      last.to = changeEnd(change);\n\
    } else {\n\
      // Add new sub-event\n\
      cur.changes.push(historyChangeFromChange(doc, change));\n\
    }\n\
    cur.anchorAfter = selAfter.anchor; cur.headAfter = selAfter.head;\n\
  } else {\n\
    // Can not be merged, start a new event.\n\
    cur = {changes: [historyChangeFromChange(doc, change)],\n\
           anchorBefore: doc.sel.anchor, headBefore: doc.sel.head,\n\
           anchorAfter: selAfter.anchor, headAfter: selAfter.head};\n\
    hist.done.push(cur);\n\
    while (hist.done.length > hist.undoDepth)\n\
      hist.done.shift();\n\
    if (hist.dirtyCounter < 0)\n\
      // The user has made a change after undoing past the last clean state. \n\
      // We can never get back to a clean state now until markClean() is called.\n\
      hist.dirtyCounter = NaN;\n\
    else\n\
      hist.dirtyCounter++;\n\
  }\n\
  hist.lastTime = time;\n\
  hist.lastOp = opId;\n\
  hist.lastOrigin = change.origin;\n\
}\n\
\n\
function removeClearedSpans(spans) {\n\
  if (!spans) return null;\n\
  for (var i = 0, out; i < spans.length; ++i) {\n\
    if (spans[i].marker.explicitlyCleared) { if (!out) out = spans.slice(0, i); }\n\
    else if (out) out.push(spans[i]);\n\
  }\n\
  return !out ? spans : out.length ? out : null;\n\
}\n\
\n\
function getOldSpans(doc, change) {\n\
  var found = change[\"spans_\" + doc.id];\n\
  if (!found) return null;\n\
  for (var i = 0, nw = []; i < change.text.length; ++i)\n\
    nw.push(removeClearedSpans(found[i]));\n\
  return nw;\n\
}\n\
\n\
// Used both to provide a JSON-safe object in .getHistory, and, when\n\
// detaching a document, to split the history in two\n\
function copyHistoryArray(events, newGroup) {\n\
  for (var i = 0, copy = []; i < events.length; ++i) {\n\
    var event = events[i], changes = event.changes, newChanges = [];\n\
    copy.push({changes: newChanges, anchorBefore: event.anchorBefore, headBefore: event.headBefore,\n\
               anchorAfter: event.anchorAfter, headAfter: event.headAfter});\n\
    for (var j = 0; j < changes.length; ++j) {\n\
      var change = changes[j], m;\n\
      newChanges.push({from: change.from, to: change.to, text: change.text});\n\
      if (newGroup) for (var prop in change) if (m = prop.match(/^spans_(\\d+)$/)) {\n\
        if (indexOf(newGroup, Number(m[1])) > -1) {\n\
          lst(newChanges)[prop] = change[prop];\n\
          delete change[prop];\n\
        }\n\
      }\n\
    }\n\
  }\n\
  return copy;\n\
}\n\
\n\
// Rebasing/resetting history to deal with externally-sourced changes\n\
\n\
function rebaseHistSel(pos, from, to, diff) {\n\
  if (to < pos.line) {\n\
    pos.line += diff;\n\
  } else if (from < pos.line) {\n\
    pos.line = from;\n\
    pos.ch = 0;\n\
  }\n\
}\n\
\n\
// Tries to rebase an array of history events given a change in the\n\
// document. If the change touches the same lines as the event, the\n\
// event, and everything 'behind' it, is discarded. If the change is\n\
// before the event, the event's positions are updated. Uses a\n\
// copy-on-write scheme for the positions, to avoid having to\n\
// reallocate them all on every rebase, but also avoid problems with\n\
// shared position objects being unsafely updated.\n\
function rebaseHistArray(array, from, to, diff) {\n\
  for (var i = 0; i < array.length; ++i) {\n\
    var sub = array[i], ok = true;\n\
    for (var j = 0; j < sub.changes.length; ++j) {\n\
      var cur = sub.changes[j];\n\
      if (!sub.copied) { cur.from = copyPos(cur.from); cur.to = copyPos(cur.to); }\n\
      if (to < cur.from.line) {\n\
        cur.from.line += diff;\n\
        cur.to.line += diff;\n\
      } else if (from <= cur.to.line) {\n\
        ok = false;\n\
        break;\n\
      }\n\
    }\n\
    if (!sub.copied) {\n\
      sub.anchorBefore = copyPos(sub.anchorBefore); sub.headBefore = copyPos(sub.headBefore);\n\
      sub.anchorAfter = copyPos(sub.anchorAfter); sub.readAfter = copyPos(sub.headAfter);\n\
      sub.copied = true;\n\
    }\n\
    if (!ok) {\n\
      array.splice(0, i + 1);\n\
      i = 0;\n\
    } else {\n\
      rebaseHistSel(sub.anchorBefore); rebaseHistSel(sub.headBefore);\n\
      rebaseHistSel(sub.anchorAfter); rebaseHistSel(sub.headAfter);\n\
    }\n\
  }\n\
}\n\
\n\
function rebaseHist(hist, change) {\n\
  var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;\n\
  rebaseHistArray(hist.done, from, to, diff);\n\
  rebaseHistArray(hist.undone, from, to, diff);\n\
}\n\
\n\
// EVENT OPERATORS\n\
\n\
function stopMethod() {e_stop(this);}\n\
// Ensure an event has a stop method.\n\
function addStop(event) {\n\
  if (!event.stop) event.stop = stopMethod;\n\
  return event;\n\
}\n\
\n\
function e_preventDefault(e) {\n\
  if (e.preventDefault) e.preventDefault();\n\
  else e.returnValue = false;\n\
}\n\
function e_stopPropagation(e) {\n\
  if (e.stopPropagation) e.stopPropagation();\n\
  else e.cancelBubble = true;\n\
}\n\
function e_stop(e) {e_preventDefault(e); e_stopPropagation(e);}\n\
CodeMirror.e_stop = e_stop;\n\
CodeMirror.e_preventDefault = e_preventDefault;\n\
CodeMirror.e_stopPropagation = e_stopPropagation;\n\
\n\
function e_target(e) {return e.target || e.srcElement;}\n\
function e_button(e) {\n\
  var b = e.which;\n\
  if (b == null) {\n\
    if (e.button & 1) b = 1;\n\
    else if (e.button & 2) b = 3;\n\
    else if (e.button & 4) b = 2;\n\
  }\n\
  if (mac && e.ctrlKey && b == 1) b = 3;\n\
  return b;\n\
}\n\
\n\
// Allow 3rd-party code to override event properties by adding an override\n\
// object to an event object.\n\
function e_prop(e, prop) {\n\
  var overridden = e.override && e.override.hasOwnProperty(prop);\n\
  return overridden ? e.override[prop] : e[prop];\n\
}\n\
\n\
// EVENT HANDLING\n\
\n\
function on(emitter, type, f) {\n\
  if (emitter.addEventListener)\n\
    emitter.addEventListener(type, f, false);\n\
  else if (emitter.attachEvent)\n\
    emitter.attachEvent(\"on\" + type, f);\n\
  else {\n\
    var map = emitter._handlers || (emitter._handlers = {});\n\
    var arr = map[type] || (map[type] = []);\n\
    arr.push(f);\n\
  }\n\
}\n\
\n\
function off(emitter, type, f) {\n\
  if (emitter.removeEventListener)\n\
    emitter.removeEventListener(type, f, false);\n\
  else if (emitter.detachEvent)\n\
    emitter.detachEvent(\"on\" + type, f);\n\
  else {\n\
    var arr = emitter._handlers && emitter._handlers[type];\n\
    if (!arr) return;\n\
    for (var i = 0; i < arr.length; ++i)\n\
      if (arr[i] == f) { arr.splice(i, 1); break; }\n\
  }\n\
}\n\
\n\
function signal(emitter, type /*, values...*/) {\n\
  var arr = emitter._handlers && emitter._handlers[type];\n\
  if (!arr) return;\n\
  var args = Array.prototype.slice.call(arguments, 2);\n\
  for (var i = 0; i < arr.length; ++i) arr[i].apply(null, args);\n\
}\n\
\n\
var delayedCallbacks, delayedCallbackDepth = 0;\n\
function signalLater(emitter, type /*, values...*/) {\n\
  var arr = emitter._handlers && emitter._handlers[type];\n\
  if (!arr) return;\n\
  var args = Array.prototype.slice.call(arguments, 2);\n\
  function bnd(f) {return function(){f.apply(null, args);};};\n\
  for (var i = 0; i < arr.length; ++i)\n\
    if (delayedCallbacks) delayedCallbacks.push(bnd(arr[i]));\n\
    else arr[i].apply(null, args);\n\
}\n\
\n\
function hasHandler(emitter, type) {\n\
  var arr = emitter._handlers && emitter._handlers[type];\n\
  return arr && arr.length > 0;\n\
}\n\
\n\
CodeMirror.on = on; CodeMirror.off = off; CodeMirror.signal = signal;\n\
\n\
// MISC UTILITIES\n\
\n\
// Number of pixels added to scroller and sizer to hide scrollbar\n\
var scrollerCutOff = 30;\n\
\n\
// Returned or thrown by various protocols to signal 'I'm not\n\
// handling this'.\n\
var Pass = CodeMirror.Pass = {toString: function(){return \"CodeMirror.Pass\";}};\n\
\n\
function Delayed() {this.id = null;}\n\
Delayed.prototype = {set: function(ms, f) {clearTimeout(this.id); this.id = setTimeout(f, ms);}};\n\
\n\
// Counts the column offset in a string, taking tabs into account.\n\
// Used mostly to find indentation.\n\
function countColumn(string, end, tabSize) {\n\
  if (end == null) {\n\
    end = string.search(/[^\\s\\u00a0]/);\n\
    if (end == -1) end = string.length;\n\
  }\n\
  for (var i = 0, n = 0; i < end; ++i) {\n\
    if (string.charAt(i) == \"\\t\") n += tabSize - (n % tabSize);\n\
    else ++n;\n\
  }\n\
  return n;\n\
}\n\
CodeMirror.countColumn = countColumn;\n\
\n\
var spaceStrs = [\"\"];\n\
function spaceStr(n) {\n\
  while (spaceStrs.length <= n)\n\
    spaceStrs.push(lst(spaceStrs) + \" \");\n\
  return spaceStrs[n];\n\
}\n\
\n\
function lst(arr) { return arr[arr.length-1]; }\n\
\n\
function selectInput(node) {\n\
  if (ios) { // Mobile Safari apparently has a bug where select() is broken.\n\
    node.selectionStart = 0;\n\
    node.selectionEnd = node.value.length;\n\
  } else node.select();\n\
}\n\
\n\
function indexOf(collection, elt) {\n\
  if (collection.indexOf) return collection.indexOf(elt);\n\
  for (var i = 0, e = collection.length; i < e; ++i)\n\
    if (collection[i] == elt) return i;\n\
  return -1;\n\
}\n\
\n\
function createObj(base, props) {\n\
  if (!base) return;\n\
  createObj.prototype = base;\n\
  var inst = new createObj();\n\
  if (props) copyObj(props, inst);\n\
  return inst;\n\
}\n\
\n\
function copyObj(obj, target) {\n\
  if (!target) target = {};\n\
  for (var prop in obj) if (obj.hasOwnProperty(prop)) target[prop] = obj[prop];\n\
  return target;\n\
}\n\
\n\
function emptyArray(size) {\n\
  for (var a = [], i = 0; i < size; ++i) a.push(undefined);\n\
  return a;\n\
}\n\
\n\
function bind(f) {\n\
  var args = Array.prototype.slice.call(arguments, 1);\n\
  return function(){return f.apply(null, args);};\n\
}\n\
\n\
var nonASCIISingleCaseWordChar = /[\\u3040-\\u309f\\u30a0-\\u30ff\\u3400-\\u4db5\\u4e00-\\u9fcc]/;\n\
function isWordChar(ch) {\n\
  return /\\w/.test(ch) || ch > \"\\x80\" &&\n\
    (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));\n\
}\n\
\n\
function isEmpty(obj) {\n\
  for (var n in obj) if (obj.hasOwnProperty(n) && obj[n]) return false;\n\
  return true;\n\
}\n\
\n\
var isExtendingChar = /[\\u0300-\\u036F\\u0483-\\u0487\\u0488-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1-\\u05C2\\u05C4-\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7-\\u06E8\\u06EA-\\u06ED\\uA66F\\uA670-\\uA672\\uA674-\\uA67D\\uA69F]/;\n\
\n\
// DOM UTILITIES\n\
\n\
function elt(tag, content, className, style) {\n\
  var e = document.createElement(tag);\n\
  if (className) e.className = className;\n\
  if (style) e.style.cssText = style;\n\
  if (typeof content == \"string\") setTextContent(e, content);\n\
  else if (content) for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);\n\
  return e;\n\
}\n\
\n\
function removeChildren(e) {\n\
  // IE will break all parent-child relations in subnodes when setting innerHTML\n\
  if (!ie) e.innerHTML = \"\";\n\
  else while (e.firstChild) e.removeChild(e.firstChild);\n\
  return e;\n\
}\n\
\n\
function removeChildrenAndAdd(parent, e) {\n\
  return removeChildren(parent).appendChild(e);\n\
}\n\
\n\
function setTextContent(e, str) {\n\
  if (ie_lt9) {\n\
    e.innerHTML = \"\";\n\
    e.appendChild(document.createTextNode(str));\n\
  } else e.textContent = str;\n\
}\n\
\n\
// FEATURE DETECTION\n\
\n\
// Detect drag-and-drop\n\
var dragAndDrop = function() {\n\
  // There is *some* kind of drag-and-drop support in IE6-8, but I\n\
  // couldn't get it to work yet.\n\
  if (ie_lt9) return false;\n\
  var div = elt('div');\n\
  return \"draggable\" in div || \"dragDrop\" in div;\n\
}();\n\
\n\
// For a reason I have yet to figure out, some browsers disallow\n\
// word wrapping between certain characters *only* if a new inline\n\
// element is started between them. This makes it hard to reliably\n\
// measure the position of things, since that requires inserting an\n\
// extra span. This terribly fragile set of regexps matches the\n\
// character combinations that suffer from this phenomenon on the\n\
// various browsers.\n\
var spanAffectsWrapping = /^$/; // Won't match any two-character string\n\
if (gecko) spanAffectsWrapping = /$'/;\n\
else if (safari) spanAffectsWrapping = /\\-[^ \\-?]|\\?[^ !'\\\"\\),.\\-\\/:;\\?\\]\\}]/;\n\
else if (chrome) spanAffectsWrapping = /\\-[^ \\-\\.?]|\\?[^ \\-\\.?\\]\\}:;!'\\\"\\),\\/]|[\\.!\\\"#&%\\)*+,:;=>\\]|\\}~][\\(\\{\\[<]|\\$'/;\n\
\n\
var knownScrollbarWidth;\n\
function scrollbarWidth(measure) {\n\
  if (knownScrollbarWidth != null) return knownScrollbarWidth;\n\
  var test = elt(\"div\", null, null, \"width: 50px; height: 50px; overflow-x: scroll\");\n\
  removeChildrenAndAdd(measure, test);\n\
  if (test.offsetWidth)\n\
    knownScrollbarWidth = test.offsetHeight - test.clientHeight;\n\
  return knownScrollbarWidth || 0;\n\
}\n\
\n\
var zwspSupported;\n\
function zeroWidthElement(measure) {\n\
  if (zwspSupported == null) {\n\
    var test = elt(\"span\", \"\\u200b\");\n\
    removeChildrenAndAdd(measure, elt(\"span\", [test, document.createTextNode(\"x\")]));\n\
    if (measure.firstChild.offsetHeight != 0)\n\
      zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !ie_lt8;\n\
  }\n\
  if (zwspSupported) return elt(\"span\", \"\\u200b\");\n\
  else return elt(\"span\", \"\\u00a0\", null, \"display: inline-block; width: 1px; margin-right: -1px\");\n\
}\n\
\n\
// See if \"\".split is the broken IE version, if so, provide an\n\
// alternative way to split lines.\n\
var splitLines = \"\\n\
\\n\
b\".split(/\\n\
/).length != 3 ? function(string) {\n\
  var pos = 0, result = [], l = string.length;\n\
  while (pos <= l) {\n\
    var nl = string.indexOf(\"\\n\
\", pos);\n\
    if (nl == -1) nl = string.length;\n\
    var line = string.slice(pos, string.charAt(nl - 1) == \"\\r\" ? nl - 1 : nl);\n\
    var rt = line.indexOf(\"\\r\");\n\
    if (rt != -1) {\n\
      result.push(line.slice(0, rt));\n\
      pos += rt + 1;\n\
    } else {\n\
      result.push(line);\n\
      pos = nl + 1;\n\
    }\n\
  }\n\
  return result;\n\
} : function(string){return string.split(/\\r\\n\
?|\\n\
/);};\n\
CodeMirror.splitLines = splitLines;\n\
\n\
var hasSelection = window.getSelection ? function(te) {\n\
  try { return te.selectionStart != te.selectionEnd; }\n\
  catch(e) { return false; }\n\
} : function(te) {\n\
  try {var range = te.ownerDocument.selection.createRange();}\n\
  catch(e) {}\n\
  if (!range || range.parentElement() != te) return false;\n\
  return range.compareEndPoints(\"StartToEnd\", range) != 0;\n\
};\n\
\n\
var hasCopyEvent = (function() {\n\
  var e = elt(\"div\");\n\
  if (\"oncopy\" in e) return true;\n\
  e.setAttribute(\"oncopy\", \"return;\");\n\
  return typeof e.oncopy == 'function';\n\
})();\n\
\n\
// KEY NAMING\n\
\n\
var keyNames = {3: \"Enter\", 8: \"Backspace\", 9: \"Tab\", 13: \"Enter\", 16: \"Shift\", 17: \"Ctrl\", 18: \"Alt\",\n\
                19: \"Pause\", 20: \"CapsLock\", 27: \"Esc\", 32: \"Space\", 33: \"PageUp\", 34: \"PageDown\", 35: \"End\",\n\
                36: \"Home\", 37: \"Left\", 38: \"Up\", 39: \"Right\", 40: \"Down\", 44: \"PrintScrn\", 45: \"Insert\",\n\
                46: \"Delete\", 59: \";\", 91: \"Mod\", 92: \"Mod\", 93: \"Mod\", 109: \"-\", 107: \"=\", 127: \"Delete\",\n\
                186: \";\", 187: \"=\", 188: \",\", 189: \"-\", 190: \".\", 191: \"/\", 192: \"`\", 219: \"[\", 220: \"\\\\\",\n\
                221: \"]\", 222: \"'\", 63276: \"PageUp\", 63277: \"PageDown\", 63275: \"End\", 63273: \"Home\",\n\
                63234: \"Left\", 63232: \"Up\", 63235: \"Right\", 63233: \"Down\", 63302: \"Insert\", 63272: \"Delete\"};\n\
CodeMirror.keyNames = keyNames;\n\
(function() {\n\
  // Number keys\n\
  for (var i = 0; i < 10; i++) keyNames[i + 48] = String(i);\n\
  // Alphabetic keys\n\
  for (var i = 65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);\n\
  // Function keys\n\
  for (var i = 1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] = \"F\" + i;\n\
})();\n\
\n\
// BIDI HELPERS\n\
\n\
function iterateBidiSections(order, from, to, f) {\n\
  if (!order) return f(from, to, \"ltr\");\n\
  for (var i = 0; i < order.length; ++i) {\n\
    var part = order[i];\n\
    if (part.from < to && part.to > from || from == to && part.to == from)\n\
      f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? \"rtl\" : \"ltr\");\n\
  }\n\
}\n\
\n\
function bidiLeft(part) { return part.level % 2 ? part.to : part.from; }\n\
function bidiRight(part) { return part.level % 2 ? part.from : part.to; }\n\
\n\
function lineLeft(line) { var order = getOrder(line); return order ? bidiLeft(order[0]) : 0; }\n\
function lineRight(line) {\n\
  var order = getOrder(line);\n\
  if (!order) return line.text.length;\n\
  return bidiRight(lst(order));\n\
}\n\
\n\
function lineStart(cm, lineN) {\n\
  var line = getLine(cm.doc, lineN);\n\
  var visual = visualLine(cm.doc, line);\n\
  if (visual != line) lineN = lineNo(visual);\n\
  var order = getOrder(visual);\n\
  var ch = !order ? 0 : order[0].level % 2 ? lineRight(visual) : lineLeft(visual);\n\
  return {line: lineN, ch: ch};\n\
}\n\
function lineEnd(cm, lineNo) {\n\
  var merged, line;\n\
  while (merged = collapsedSpanAtEnd(line = getLine(cm.doc, lineNo)))\n\
    lineNo = merged.find().to.line;\n\
  var order = getOrder(line);\n\
  var ch = !order ? line.text.length : order[0].level % 2 ? lineLeft(line) : lineRight(line);\n\
  return {line: lineNo, ch: ch};\n\
}\n\
\n\
// This is somewhat involved. It is needed in order to move\n\
// 'visually' through bi-directional text -- i.e., pressing left\n\
// should make the cursor go left, even when in RTL text. The\n\
// tricky part is the 'jumps', where RTL and LTR text touch each\n\
// other. This often requires the cursor offset to move more than\n\
// one unit, in order to visually move one unit.\n\
function moveVisually(line, start, dir, byUnit) {\n\
  var bidi = getOrder(line);\n\
  if (!bidi) return moveLogically(line, start, dir, byUnit);\n\
  var moveOneUnit = byUnit ? function(pos, dir) {\n\
    do pos += dir;\n\
    while (pos > 0 && isExtendingChar.test(line.text.charAt(pos)));\n\
    return pos;\n\
  } : function(pos, dir) { return pos + dir; };\n\
  var linedir = bidi[0].level;\n\
  for (var i = 0; i < bidi.length; ++i) {\n\
    var part = bidi[i], sticky = part.level % 2 == linedir;\n\
    if ((part.from < start && part.to > start) ||\n\
        (sticky && (part.from == start || part.to == start))) break;\n\
  }\n\
  var target = moveOneUnit(start, part.level % 2 ? -dir : dir);\n\
\n\
  while (target != null) {\n\
    if (part.level % 2 == linedir) {\n\
      if (target < part.from || target > part.to) {\n\
        part = bidi[i += dir];\n\
        target = part && (dir > 0 == part.level % 2 ? moveOneUnit(part.to, -1) : moveOneUnit(part.from, 1));\n\
      } else break;\n\
    } else {\n\
      if (target == bidiLeft(part)) {\n\
        part = bidi[--i];\n\
        target = part && bidiRight(part);\n\
      } else if (target == bidiRight(part)) {\n\
        part = bidi[++i];\n\
        target = part && bidiLeft(part);\n\
      } else break;\n\
    }\n\
  }\n\
\n\
  return target < 0 || target > line.text.length ? null : target;\n\
}\n\
\n\
function moveLogically(line, start, dir, byUnit) {\n\
  var target = start + dir;\n\
  if (byUnit) while (target > 0 && isExtendingChar.test(line.text.charAt(target))) target += dir;\n\
  return target < 0 || target > line.text.length ? null : target;\n\
}\n\
\n\
// Bidirectional ordering algorithm\n\
// See http://unicode.org/reports/tr9/tr9-13.html for the algorithm\n\
// that this (partially) implements.\n\
\n\
// One-char codes used for character types:\n\
// L (L):   Left-to-Right\n\
// R (R):   Right-to-Left\n\
// r (AL):  Right-to-Left Arabic\n\
// 1 (EN):  European Number\n\
// + (ES):  European Number Separator\n\
// % (ET):  European Number Terminator\n\
// n (AN):  Arabic Number\n\
// , (CS):  Common Number Separator\n\
// m (NSM): Non-Spacing Mark\n\
// b (BN):  Boundary Neutral\n\
// s (B):   Paragraph Separator\n\
// t (S):   Segment Separator\n\
// w (WS):  Whitespace\n\
// N (ON):  Other Neutrals\n\
\n\
// Returns null if characters are ordered as they appear\n\
// (left-to-right), or an array of sections ({from, to, level}\n\
// objects) in the order in which they occur visually.\n\
var bidiOrdering = (function() {\n\
  // Character types for codepoints 0 to 0xff\n\
  var lowTypes = \"bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLL\";\n\
  // Character types for codepoints 0x600 to 0x6ff\n\
  var arabicTypes = \"rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmmrrrrrrrrrrrrrrrrrr\";\n\
  function charType(code) {\n\
    if (code <= 0xff) return lowTypes.charAt(code);\n\
    else if (0x590 <= code && code <= 0x5f4) return \"R\";\n\
    else if (0x600 <= code && code <= 0x6ff) return arabicTypes.charAt(code - 0x600);\n\
    else if (0x700 <= code && code <= 0x8ac) return \"r\";\n\
    else return \"L\";\n\
  }\n\
\n\
  var bidiRE = /[\\u0590-\\u05f4\\u0600-\\u06ff\\u0700-\\u08ac]/;\n\
  var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;\n\
  // Browsers seem to always treat the boundaries of block elements as being L.\n\
  var outerType = \"L\";\n\
\n\
  return function charOrdering(str) {\n\
    if (!bidiRE.test(str)) return false;\n\
    var len = str.length, types = [];\n\
    for (var i = 0, type; i < len; ++i)\n\
      types.push(type = charType(str.charCodeAt(i)));\n\
\n\
    // W1. Examine each non-spacing mark (NSM) in the level run, and\n\
    // change the type of the NSM to the type of the previous\n\
    // character. If the NSM is at the start of the level run, it will\n\
    // get the type of sor.\n\
    for (var i = 0, prev = outerType; i < len; ++i) {\n\
      var type = types[i];\n\
      if (type == \"m\") types[i] = prev;\n\
      else prev = type;\n\
    }\n\
\n\
    // W2. Search backwards from each instance of a European number\n\
    // until the first strong type (R, L, AL, or sor) is found. If an\n\
    // AL is found, change the type of the European number to Arabic\n\
    // number.\n\
    // W3. Change all ALs to R.\n\
    for (var i = 0, cur = outerType; i < len; ++i) {\n\
      var type = types[i];\n\
      if (type == \"1\" && cur == \"r\") types[i] = \"n\";\n\
      else if (isStrong.test(type)) { cur = type; if (type == \"r\") types[i] = \"R\"; }\n\
    }\n\
\n\
    // W4. A single European separator between two European numbers\n\
    // changes to a European number. A single common separator between\n\
    // two numbers of the same type changes to that type.\n\
    for (var i = 1, prev = types[0]; i < len - 1; ++i) {\n\
      var type = types[i];\n\
      if (type == \"+\" && prev == \"1\" && types[i+1] == \"1\") types[i] = \"1\";\n\
      else if (type == \",\" && prev == types[i+1] &&\n\
               (prev == \"1\" || prev == \"n\")) types[i] = prev;\n\
      prev = type;\n\
    }\n\
\n\
    // W5. A sequence of European terminators adjacent to European\n\
    // numbers changes to all European numbers.\n\
    // W6. Otherwise, separators and terminators change to Other\n\
    // Neutral.\n\
    for (var i = 0; i < len; ++i) {\n\
      var type = types[i];\n\
      if (type == \",\") types[i] = \"N\";\n\
      else if (type == \"%\") {\n\
        for (var end = i + 1; end < len && types[end] == \"%\"; ++end) {}\n\
        var replace = (i && types[i-1] == \"!\") || (end < len - 1 && types[end] == \"1\") ? \"1\" : \"N\";\n\
        for (var j = i; j < end; ++j) types[j] = replace;\n\
        i = end - 1;\n\
      }\n\
    }\n\
\n\
    // W7. Search backwards from each instance of a European number\n\
    // until the first strong type (R, L, or sor) is found. If an L is\n\
    // found, then change the type of the European number to L.\n\
    for (var i = 0, cur = outerType; i < len; ++i) {\n\
      var type = types[i];\n\
      if (cur == \"L\" && type == \"1\") types[i] = \"L\";\n\
      else if (isStrong.test(type)) cur = type;\n\
    }\n\
\n\
    // N1. A sequence of neutrals takes the direction of the\n\
    // surrounding strong text if the text on both sides has the same\n\
    // direction. European and Arabic numbers act as if they were R in\n\
    // terms of their influence on neutrals. Start-of-level-run (sor)\n\
    // and end-of-level-run (eor) are used at level run boundaries.\n\
    // N2. Any remaining neutrals take the embedding direction.\n\
    for (var i = 0; i < len; ++i) {\n\
      if (isNeutral.test(types[i])) {\n\
        for (var end = i + 1; end < len && isNeutral.test(types[end]); ++end) {}\n\
        var before = (i ? types[i-1] : outerType) == \"L\";\n\
        var after = (end < len - 1 ? types[end] : outerType) == \"L\";\n\
        var replace = before || after ? \"L\" : \"R\";\n\
        for (var j = i; j < end; ++j) types[j] = replace;\n\
        i = end - 1;\n\
      }\n\
    }\n\
\n\
    // Here we depart from the documented algorithm, in order to avoid\n\
    // building up an actual levels array. Since there are only three\n\
    // levels (0, 1, 2) in an implementation that doesn't take\n\
    // explicit embedding into account, we can build up the order on\n\
    // the fly, without following the level-based algorithm.\n\
    var order = [], m;\n\
    for (var i = 0; i < len;) {\n\
      if (countsAsLeft.test(types[i])) {\n\
        var start = i;\n\
        for (++i; i < len && countsAsLeft.test(types[i]); ++i) {}\n\
        order.push({from: start, to: i, level: 0});\n\
      } else {\n\
        var pos = i, at = order.length;\n\
        for (++i; i < len && types[i] != \"L\"; ++i) {}\n\
        for (var j = pos; j < i;) {\n\
          if (countsAsNum.test(types[j])) {\n\
            if (pos < j) order.splice(at, 0, {from: pos, to: j, level: 1});\n\
            var nstart = j;\n\
            for (++j; j < i && countsAsNum.test(types[j]); ++j) {}\n\
            order.splice(at, 0, {from: nstart, to: j, level: 2});\n\
            pos = j;\n\
          } else ++j;\n\
        }\n\
        if (pos < i) order.splice(at, 0, {from: pos, to: i, level: 1});\n\
      }\n\
    }\n\
    if (order[0].level == 1 && (m = str.match(/^\\s+/))) {\n\
      order[0].from = m[0].length;\n\
      order.unshift({from: 0, to: m[0].length, level: 0});\n\
    }\n\
    if (lst(order).level == 1 && (m = str.match(/\\s+$/))) {\n\
      lst(order).to -= m[0].length;\n\
      order.push({from: len - m[0].length, to: len, level: 0});\n\
    }\n\
    if (order[0].level != lst(order).level)\n\
      order.push({from: len, to: len, level: order[0].level});\n\
\n\
    return order;\n\
  };\n\
})();\n\
\n\
// THE END\n\
\n\
CodeMirror.version = \"3.02 +\";\n\
\n\
module.exports = CodeMirror;\n\
//@ sourceURL=benatkin-codemirror/codemirror.js"
));
require.register("benatkin-codemirror-mode-javascript/index.js", Function("exports, require, module",
"module.exports = function(CodeMirror) {\n\
// TODO actually recognize syntax of TypeScript constructs\n\
\n\
CodeMirror.defineMode(\"javascript\", function(config, parserConfig) {\n\
  var indentUnit = config.indentUnit;\n\
  var jsonMode = parserConfig.json;\n\
  var isTS = parserConfig.typescript;\n\
\n\
  // Tokenizer\n\
\n\
  var keywords = function(){\n\
    function kw(type) {return {type: type, style: \"keyword\"};}\n\
    var A = kw(\"keyword a\"), B = kw(\"keyword b\"), C = kw(\"keyword c\");\n\
    var operator = kw(\"operator\"), atom = {type: \"atom\", style: \"atom\"};\n\
    \n\
    var jsKeywords = {\n\
      \"if\": A, \"while\": A, \"with\": A, \"else\": B, \"do\": B, \"try\": B, \"finally\": B,\n\
      \"return\": C, \"break\": C, \"continue\": C, \"new\": C, \"delete\": C, \"throw\": C,\n\
      \"var\": kw(\"var\"), \"const\": kw(\"var\"), \"let\": kw(\"var\"),\n\
      \"function\": kw(\"function\"), \"catch\": kw(\"catch\"),\n\
      \"for\": kw(\"for\"), \"switch\": kw(\"switch\"), \"case\": kw(\"case\"), \"default\": kw(\"default\"),\n\
      \"in\": operator, \"typeof\": operator, \"instanceof\": operator,\n\
      \"true\": atom, \"false\": atom, \"null\": atom, \"undefined\": atom, \"NaN\": atom, \"Infinity\": atom\n\
    };\n\
\n\
    // Extend the 'normal' keywords with the TypeScript language extensions\n\
    if (isTS) {\n\
      var type = {type: \"variable\", style: \"variable-3\"};\n\
      var tsKeywords = {\n\
        // object-like things\n\
        \"interface\": kw(\"interface\"),\n\
        \"class\": kw(\"class\"),\n\
        \"extends\": kw(\"extends\"),\n\
        \"constructor\": kw(\"constructor\"),\n\
\n\
        // scope modifiers\n\
        \"public\": kw(\"public\"),\n\
        \"private\": kw(\"private\"),\n\
        \"protected\": kw(\"protected\"),\n\
        \"static\": kw(\"static\"),\n\
\n\
        \"super\": kw(\"super\"),\n\
\n\
        // types\n\
        \"string\": type, \"number\": type, \"bool\": type, \"any\": type\n\
      };\n\
\n\
      for (var attr in tsKeywords) {\n\
        jsKeywords[attr] = tsKeywords[attr];\n\
      }\n\
    }\n\
\n\
    return jsKeywords;\n\
  }();\n\
\n\
  var isOperatorChar = /[+\\-*&%=<>!?|]/;\n\
\n\
  function chain(stream, state, f) {\n\
    state.tokenize = f;\n\
    return f(stream, state);\n\
  }\n\
\n\
  function nextUntilUnescaped(stream, end) {\n\
    var escaped = false, next;\n\
    while ((next = stream.next()) != null) {\n\
      if (next == end && !escaped)\n\
        return false;\n\
      escaped = !escaped && next == \"\\\\\";\n\
    }\n\
    return escaped;\n\
  }\n\
\n\
  // Used as scratch variables to communicate multiple values without\n\
  // consing up tons of objects.\n\
  var type, content;\n\
  function ret(tp, style, cont) {\n\
    type = tp; content = cont;\n\
    return style;\n\
  }\n\
\n\
  function jsTokenBase(stream, state) {\n\
    var ch = stream.next();\n\
    if (ch == '\"' || ch == \"'\")\n\
      return chain(stream, state, jsTokenString(ch));\n\
    else if (/[\\[\\]{}\\(\\),;\\:\\.]/.test(ch))\n\
      return ret(ch);\n\
    else if (ch == \"0\" && stream.eat(/x/i)) {\n\
      stream.eatWhile(/[\\da-f]/i);\n\
      return ret(\"number\", \"number\");\n\
    }      \n\
    else if (/\\d/.test(ch) || ch == \"-\" && stream.eat(/\\d/)) {\n\
      stream.match(/^\\d*(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?/);\n\
      return ret(\"number\", \"number\");\n\
    }\n\
    else if (ch == \"/\") {\n\
      if (stream.eat(\"*\")) {\n\
        return chain(stream, state, jsTokenComment);\n\
      }\n\
      else if (stream.eat(\"/\")) {\n\
        stream.skipToEnd();\n\
        return ret(\"comment\", \"comment\");\n\
      }\n\
      else if (state.lastType == \"operator\" || state.lastType == \"keyword c\" ||\n\
               /^[\\[{}\\(,;:]$/.test(state.lastType)) {\n\
        nextUntilUnescaped(stream, \"/\");\n\
        stream.eatWhile(/[gimy]/); // 'y' is \"sticky\" option in Mozilla\n\
        return ret(\"regexp\", \"string-2\");\n\
      }\n\
      else {\n\
        stream.eatWhile(isOperatorChar);\n\
        return ret(\"operator\", null, stream.current());\n\
      }\n\
    }\n\
    else if (ch == \"#\") {\n\
      stream.skipToEnd();\n\
      return ret(\"error\", \"error\");\n\
    }\n\
    else if (isOperatorChar.test(ch)) {\n\
      stream.eatWhile(isOperatorChar);\n\
      return ret(\"operator\", null, stream.current());\n\
    }\n\
    else {\n\
      stream.eatWhile(/[\\w\\$_]/);\n\
      var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];\n\
      return (known && state.lastType != \".\") ? ret(known.type, known.style, word) :\n\
                     ret(\"variable\", \"variable\", word);\n\
    }\n\
  }\n\
\n\
  function jsTokenString(quote) {\n\
    return function(stream, state) {\n\
      if (!nextUntilUnescaped(stream, quote))\n\
        state.tokenize = jsTokenBase;\n\
      return ret(\"string\", \"string\");\n\
    };\n\
  }\n\
\n\
  function jsTokenComment(stream, state) {\n\
    var maybeEnd = false, ch;\n\
    while (ch = stream.next()) {\n\
      if (ch == \"/\" && maybeEnd) {\n\
        state.tokenize = jsTokenBase;\n\
        break;\n\
      }\n\
      maybeEnd = (ch == \"*\");\n\
    }\n\
    return ret(\"comment\", \"comment\");\n\
  }\n\
\n\
  // Parser\n\
\n\
  var atomicTypes = {\"atom\": true, \"number\": true, \"variable\": true, \"string\": true, \"regexp\": true};\n\
\n\
  function JSLexical(indented, column, type, align, prev, info) {\n\
    this.indented = indented;\n\
    this.column = column;\n\
    this.type = type;\n\
    this.prev = prev;\n\
    this.info = info;\n\
    if (align != null) this.align = align;\n\
  }\n\
\n\
  function inScope(state, varname) {\n\
    for (var v = state.localVars; v; v = v.next)\n\
      if (v.name == varname) return true;\n\
  }\n\
\n\
  function parseJS(state, style, type, content, stream) {\n\
    var cc = state.cc;\n\
    // Communicate our context to the combinators.\n\
    // (Less wasteful than consing up a hundred closures on every call.)\n\
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc;\n\
  \n\
    if (!state.lexical.hasOwnProperty(\"align\"))\n\
      state.lexical.align = true;\n\
\n\
    while(true) {\n\
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;\n\
      if (combinator(type, content)) {\n\
        while(cc.length && cc[cc.length - 1].lex)\n\
          cc.pop()();\n\
        if (cx.marked) return cx.marked;\n\
        if (type == \"variable\" && inScope(state, content)) return \"variable-2\";\n\
        return style;\n\
      }\n\
    }\n\
  }\n\
\n\
  // Combinator utils\n\
\n\
  var cx = {state: null, column: null, marked: null, cc: null};\n\
  function pass() {\n\
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);\n\
  }\n\
  function cont() {\n\
    pass.apply(null, arguments);\n\
    return true;\n\
  }\n\
  function register(varname) {\n\
    function inList(list) {\n\
      for (var v = list; v; v = v.next)\n\
        if (v.name == varname) return true;\n\
      return false;\n\
    }\n\
    var state = cx.state;\n\
    if (state.context) {\n\
      cx.marked = \"def\";\n\
      if (inList(state.localVars)) return;\n\
      state.localVars = {name: varname, next: state.localVars};\n\
    } else {\n\
      if (inList(state.globalVars)) return;\n\
      state.globalVars = {name: varname, next: state.globalVars};\n\
    }\n\
  }\n\
\n\
  // Combinators\n\
\n\
  var defaultVars = {name: \"this\", next: {name: \"arguments\"}};\n\
  function pushcontext() {\n\
    cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};\n\
    cx.state.localVars = defaultVars;\n\
  }\n\
  function popcontext() {\n\
    cx.state.localVars = cx.state.context.vars;\n\
    cx.state.context = cx.state.context.prev;\n\
  }\n\
  function pushlex(type, info) {\n\
    var result = function() {\n\
      var state = cx.state;\n\
      state.lexical = new JSLexical(state.indented, cx.stream.column(), type, null, state.lexical, info);\n\
    };\n\
    result.lex = true;\n\
    return result;\n\
  }\n\
  function poplex() {\n\
    var state = cx.state;\n\
    if (state.lexical.prev) {\n\
      if (state.lexical.type == \")\")\n\
        state.indented = state.lexical.indented;\n\
      state.lexical = state.lexical.prev;\n\
    }\n\
  }\n\
  poplex.lex = true;\n\
\n\
  function expect(wanted) {\n\
    return function(type) {\n\
      if (type == wanted) return cont();\n\
      else if (wanted == \";\") return pass();\n\
      else return cont(arguments.callee);\n\
    };\n\
  }\n\
\n\
  function statement(type) {\n\
    if (type == \"var\") return cont(pushlex(\"vardef\"), vardef1, expect(\";\"), poplex);\n\
    if (type == \"keyword a\") return cont(pushlex(\"form\"), expression, statement, poplex);\n\
    if (type == \"keyword b\") return cont(pushlex(\"form\"), statement, poplex);\n\
    if (type == \"{\") return cont(pushlex(\"}\"), block, poplex);\n\
    if (type == \";\") return cont();\n\
    if (type == \"function\") return cont(functiondef);\n\
    if (type == \"for\") return cont(pushlex(\"form\"), expect(\"(\"), pushlex(\")\"), forspec1, expect(\")\"),\n\
                                      poplex, statement, poplex);\n\
    if (type == \"variable\") return cont(pushlex(\"stat\"), maybelabel);\n\
    if (type == \"switch\") return cont(pushlex(\"form\"), expression, pushlex(\"}\", \"switch\"), expect(\"{\"),\n\
                                         block, poplex, poplex);\n\
    if (type == \"case\") return cont(expression, expect(\":\"));\n\
    if (type == \"default\") return cont(expect(\":\"));\n\
    if (type == \"catch\") return cont(pushlex(\"form\"), pushcontext, expect(\"(\"), funarg, expect(\")\"),\n\
                                        statement, poplex, popcontext);\n\
    return pass(pushlex(\"stat\"), expression, expect(\";\"), poplex);\n\
  }\n\
  function expression(type) {\n\
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeoperator);\n\
    if (type == \"function\") return cont(functiondef);\n\
    if (type == \"keyword c\") return cont(maybeexpression);\n\
    if (type == \"(\") return cont(pushlex(\")\"), maybeexpression, expect(\")\"), poplex, maybeoperator);\n\
    if (type == \"operator\") return cont(expression);\n\
    if (type == \"[\") return cont(pushlex(\"]\"), commasep(expression, \"]\"), poplex, maybeoperator);\n\
    if (type == \"{\") return cont(pushlex(\"}\"), commasep(objprop, \"}\"), poplex, maybeoperator);\n\
    return cont();\n\
  }\n\
  function maybeexpression(type) {\n\
    if (type.match(/[;\\}\\)\\],]/)) return pass();\n\
    return pass(expression);\n\
  }\n\
    \n\
  function maybeoperator(type, value) {\n\
    if (type == \"operator\") {\n\
      if (/\\+\\+|--/.test(value)) return cont(maybeoperator);\n\
      if (value == \"?\") return cont(expression, expect(\":\"), expression);\n\
      return cont(expression);\n\
    }\n\
    if (type == \";\") return;\n\
    if (type == \"(\") return cont(pushlex(\")\"), commasep(expression, \")\"), poplex, maybeoperator);\n\
    if (type == \".\") return cont(property, maybeoperator);\n\
    if (type == \"[\") return cont(pushlex(\"]\"), expression, expect(\"]\"), poplex, maybeoperator);\n\
  }\n\
  function maybelabel(type) {\n\
    if (type == \":\") return cont(poplex, statement);\n\
    return pass(maybeoperator, expect(\";\"), poplex);\n\
  }\n\
  function property(type) {\n\
    if (type == \"variable\") {cx.marked = \"property\"; return cont();}\n\
  }\n\
  function objprop(type) {\n\
    if (type == \"variable\") cx.marked = \"property\";\n\
    if (atomicTypes.hasOwnProperty(type)) return cont(expect(\":\"), expression);\n\
  }\n\
  function commasep(what, end) {\n\
    function proceed(type) {\n\
      if (type == \",\") return cont(what, proceed);\n\
      if (type == end) return cont();\n\
      return cont(expect(end));\n\
    }\n\
    return function(type) {\n\
      if (type == end) return cont();\n\
      else return pass(what, proceed);\n\
    };\n\
  }\n\
  function block(type) {\n\
    if (type == \"}\") return cont();\n\
    return pass(statement, block);\n\
  }\n\
  function maybetype(type) {\n\
    if (type == \":\") return cont(typedef);\n\
    return pass();\n\
  }\n\
  function typedef(type) {\n\
    if (type == \"variable\"){cx.marked = \"variable-3\"; return cont();}\n\
    return pass();\n\
  }\n\
  function vardef1(type, value) {\n\
    if (type == \"variable\") {\n\
      register(value);\n\
      return isTS ? cont(maybetype, vardef2) : cont(vardef2);\n\
    }\n\
    return pass();\n\
  }\n\
  function vardef2(type, value) {\n\
    if (value == \"=\") return cont(expression, vardef2);\n\
    if (type == \",\") return cont(vardef1);\n\
  }\n\
  function forspec1(type) {\n\
    if (type == \"var\") return cont(vardef1, expect(\";\"), forspec2);\n\
    if (type == \";\") return cont(forspec2);\n\
    if (type == \"variable\") return cont(formaybein);\n\
    return cont(forspec2);\n\
  }\n\
  function formaybein(_type, value) {\n\
    if (value == \"in\") return cont(expression);\n\
    return cont(maybeoperator, forspec2);\n\
  }\n\
  function forspec2(type, value) {\n\
    if (type == \";\") return cont(forspec3);\n\
    if (value == \"in\") return cont(expression);\n\
    return cont(expression, expect(\";\"), forspec3);\n\
  }\n\
  function forspec3(type) {\n\
    if (type != \")\") cont(expression);\n\
  }\n\
  function functiondef(type, value) {\n\
    if (type == \"variable\") {register(value); return cont(functiondef);}\n\
    if (type == \"(\") return cont(pushlex(\")\"), pushcontext, commasep(funarg, \")\"), poplex, statement, popcontext);\n\
  }\n\
  function funarg(type, value) {\n\
    if (type == \"variable\") {register(value); return isTS ? cont(maybetype) : cont();}\n\
  }\n\
\n\
  // Interface\n\
\n\
  return {\n\
    startState: function(basecolumn) {\n\
      return {\n\
        tokenize: jsTokenBase,\n\
        lastType: null,\n\
        cc: [],\n\
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, \"block\", false),\n\
        localVars: parserConfig.localVars,\n\
        globalVars: parserConfig.globalVars,\n\
        context: parserConfig.localVars && {vars: parserConfig.localVars},\n\
        indented: 0\n\
      };\n\
    },\n\
\n\
    token: function(stream, state) {\n\
      if (stream.sol()) {\n\
        if (!state.lexical.hasOwnProperty(\"align\"))\n\
          state.lexical.align = false;\n\
        state.indented = stream.indentation();\n\
      }\n\
      if (stream.eatSpace()) return null;\n\
      var style = state.tokenize(stream, state);\n\
      if (type == \"comment\") return style;\n\
      state.lastType = type;\n\
      return parseJS(state, style, type, content, stream);\n\
    },\n\
\n\
    indent: function(state, textAfter) {\n\
      if (state.tokenize == jsTokenComment) return CodeMirror.Pass;\n\
      if (state.tokenize != jsTokenBase) return 0;\n\
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical;\n\
      if (lexical.type == \"stat\" && firstChar == \"}\") lexical = lexical.prev;\n\
      var type = lexical.type, closing = firstChar == type;\n\
      if (type == \"vardef\") return lexical.indented + (state.lastType == \"operator\" || state.lastType == \",\" ? 4 : 0);\n\
      else if (type == \"form\" && firstChar == \"{\") return lexical.indented;\n\
      else if (type == \"form\") return lexical.indented + indentUnit;\n\
      else if (type == \"stat\")\n\
        return lexical.indented + (state.lastType == \"operator\" || state.lastType == \",\" ? indentUnit : 0);\n\
      else if (lexical.info == \"switch\" && !closing)\n\
        return lexical.indented + (/^(?:case|default)\\b/.test(textAfter) ? indentUnit : 2 * indentUnit);\n\
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);\n\
      else return lexical.indented + (closing ? 0 : indentUnit);\n\
    },\n\
\n\
    electricChars: \":{}\",\n\
\n\
    jsonMode: jsonMode\n\
  };\n\
});\n\
\n\
CodeMirror.defineMIME(\"text/javascript\", \"javascript\");\n\
CodeMirror.defineMIME(\"text/ecmascript\", \"javascript\");\n\
CodeMirror.defineMIME(\"application/javascript\", \"javascript\");\n\
CodeMirror.defineMIME(\"application/ecmascript\", \"javascript\");\n\
CodeMirror.defineMIME(\"application/json\", {name: \"javascript\", json: true});\n\
CodeMirror.defineMIME(\"text/typescript\", { name: \"javascript\", typescript: true });\n\
CodeMirror.defineMIME(\"application/typescript\", { name: \"javascript\", typescript: true });\n\
};\n\
//@ sourceURL=benatkin-codemirror-mode-javascript/index.js"
));

require.register("plugin/index.js", Function("exports, require, module",
"\n\
var codemirror = require('codemirror');\n\
var javascript = require('codemirror-mode-javascript')(codemirror);\n\
var ripple = require('ripple');\n\
var template = require('./index.html');\n\
\n\
/**\n\
 * Expose `Plugin`.\n\
 */\n\
\n\
var Plugin = module.exports = ripple(template);\n\
\n\
/**\n\
 * When mounted setup CodeMirror.\n\
 */\n\
\n\
Plugin.on('mounted', function(plugin){\n\
  var textarea = plugin.el.querySelector('textarea');\n\
  plugin.editor = codemirror.fromTextArea(textarea, {\n\
    theme: 'custom',\n\
    lineNumbers: true\n\
  });\n\
});\n\
\n\
/**\n\
 * Get the plugin's code.\n\
 *\n\
 * @return {String}\n\
 */\n\
\n\
Plugin.prototype.code = function(){\n\
  var str = this.editor.getValue().trim();\n\
  var regex = /^module\\.exports += +function *\\(robot\\) *{([\\s\\S]*)};?$/m;\n\
  var parsed = regex.exec(str)[1];\n\
  return parsed.trim();\n\
};//@ sourceURL=plugin/index.js"
));
require.register("ripplejs-bind-methods/index.js", Function("exports, require, module",
"module.exports = function(View) {\n\
  View.created(function(){\n\
    for(var key in this) {\n\
      if(typeof this[key] === 'function') this[key] = this[key].bind(this);\n\
    }\n\
  });\n\
};//@ sourceURL=ripplejs-bind-methods/index.js"
));
require.register("ripplejs-array-observer/index.js", Function("exports, require, module",
"var emitter = require('emitter');\n\
var slice = Array.prototype.slice;\n\
\n\
module.exports = function(arr) {\n\
\n\
  /**\n\
   * Make array an event emitter\n\
   */\n\
  emitter(arr);\n\
\n\
  /**\n\
   * Add an element to the end of the collection.\n\
   *\n\
   * @return {Integer} The collection length.\n\
   * @api public\n\
   */\n\
\n\
  function push() {\n\
    var self = this;\n\
    var startIndex = this.length;\n\
    var result = Array.prototype.push.apply(this, arguments);\n\
    this.slice(startIndex, this.length).forEach(function(value, i){\n\
      self.emit('add', value, (startIndex + i));\n\
      self.emit('change');\n\
    });\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * Remove the last element from the collection.\n\
   *\n\
   * @return {Integer} The collection length.\n\
   * @api public\n\
   */\n\
\n\
  function pop() {\n\
    var startIndex = this.length;\n\
    var result = Array.prototype.pop.apply(this, arguments);\n\
    this.emit('remove', result, startIndex - 1);\n\
    this.emit('change');\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * Remove the first element from the collection.\n\
   *\n\
   * @return {Integer} The collection length.\n\
   * @api public\n\
   */\n\
\n\
  function shift() {\n\
    var startIndex = this.length;\n\
    var result = Array.prototype.shift.apply(this, arguments);\n\
    this.emit('remove', result, 0);\n\
    this.emit('change');\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * Add an element to the beginning of the collection.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  function unshift() {\n\
    var self = this;\n\
    var length = this.length;\n\
    var result = Array.prototype.unshift.apply(this, arguments);\n\
    this.slice(0, this.length - length).forEach(function(value, i){\n\
      self.emit('add', value, i);\n\
      self.emit('change');\n\
    });\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * changes the content of an array, adding new elements\n\
   * while removing old elements.\n\
   *\n\
   * @param {Number} index\n\
   * @param {Number} length\n\
   * @param {Items} [items]* Items to add\n\
   *\n\
   * @return {Array}\n\
   */\n\
\n\
  function splice(index, length) {\n\
    var self = this;\n\
    var removed = Array.prototype.splice.apply(this, arguments);\n\
    if (removed.length) {\n\
      removed.forEach(function(value, i){\n\
        self.emit('remove', value, index + i);\n\
      });\n\
    }\n\
    if (arguments.length > 2) {\n\
      slice.call(arguments, 2).forEach(function(value, i){\n\
        self.emit('add', value, index + i);\n\
      });\n\
    }\n\
    this.emit('change');\n\
    return removed;\n\
  }\n\
\n\
  /**\n\
   * Reverse the items in the array\n\
   *\n\
   * @return {Array}\n\
   */\n\
\n\
  function reverse() {\n\
    var result = Array.prototype.reverse.apply(this, arguments);\n\
    this.emit('sort');\n\
    this.emit('change');\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * Sort the items in the array\n\
   *\n\
   * @return {Array}\n\
   */\n\
\n\
  function sort() {\n\
    var result = Array.prototype.sort.apply(this, arguments);\n\
    this.emit('sort');\n\
    this.emit('change');\n\
    return result;\n\
  }\n\
\n\
  var methods = {\n\
    pop: pop,\n\
    push: push,\n\
    reverse: reverse,\n\
    shift: shift,\n\
    sort: sort,\n\
    splice: splice,\n\
    unshift: unshift\n\
  };\n\
\n\
  for (var method in methods) {\n\
    arr[method] = methods[method];\n\
  }\n\
\n\
  return arr;\n\
};//@ sourceURL=ripplejs-array-observer/index.js"
));
require.register("ripplejs-each/index.js", Function("exports, require, module",
"var observe = require('array-observer');\n\
\n\
module.exports = function(View) {\n\
  View.directive('each', {\n\
    bind: function(el){\n\
      this.View = View.create(el.innerHTML);\n\
      el.innerHTML = '';\n\
      this.previous = {};\n\
    },\n\
    update: function(items, el, view){\n\
      var Child = this.View;\n\
      var self = this;\n\
      var replacing = false;\n\
      el.innerHTML = '';\n\
\n\
      // The new value isn't an array.\n\
      if(Array.isArray(items) === false) {\n\
        throw new Error(items + ' should be an array');\n\
      }\n\
\n\
      // remove the previous emitter so that we don't\n\
      // keep watching the old array for changes\n\
      if(this.previous.emitter) {\n\
        this.previous.emitter.off();\n\
      }\n\
\n\
      // Destroy any old views\n\
      if(this.previous.items) {\n\
        this.previous.items.forEach(function(view){\n\
          view.destroy();\n\
        });\n\
      }\n\
\n\
      function reposition() {\n\
        items.forEach(function(view, i){\n\
          view.set('$index', i).appendTo(self.node);\n\
        });\n\
      }\n\
\n\
      function createViewFromValue(item, i) {\n\
        var data = {};\n\
        if(typeof item === 'object') data = item;\n\
        data.$index = i;\n\
        data.$value = item;\n\
        var child = new Child({\n\
          owner: view,\n\
          scope: view,\n\
          data: data\n\
        });\n\
        return child;\n\
      }\n\
\n\
      // Replace all objects in the array with views\n\
      items.forEach(function(obj, index){\n\
        var view = createViewFromValue(obj, index);\n\
        items.splice(index, 1, view);\n\
      });\n\
\n\
      // Watch the array for changes\n\
      var emitter = observe(items);\n\
\n\
      // Items are added to the array\n\
      emitter.on('add', function(item, index){\n\
        if(replacing) return;\n\
        var view = createViewFromValue(item, index);\n\
        replacing = true;\n\
        items.splice(index, 1, view);\n\
        replacing = false;\n\
        reposition();\n\
      });\n\
\n\
      // Items are removed from the array\n\
      emitter.on('remove', function(view){\n\
        if(view instanceof Child) {\n\
          view.destroy();\n\
          reposition();\n\
        }\n\
      });\n\
\n\
      // Re-render everything on a sort\n\
      emitter.on('sort', function(){\n\
        reposition();\n\
      });\n\
\n\
      // Add all of the views to the DOM immediately\n\
      reposition();\n\
\n\
      // Store it so that we can destroy all of the views\n\
      // if the array is changed\n\
      this.previous.items = items;\n\
      this.previous.emitter = emitter;\n\
    },\n\
    unbind: function(){\n\
      if(this.previous.emitter) {\n\
        this.previous.emitter.off();\n\
      }\n\
      if(this.previous.items) {\n\
        this.previous.items.forEach(function(view){\n\
          view.destroy();\n\
        });\n\
      }\n\
      this.previous = {};\n\
    }\n\
  });\n\
}//@ sourceURL=ripplejs-each/index.js"
));
require.register("ripplejs-events/index.js", Function("exports, require, module",
"var events = [\n\
  'change',\n\
  'click',\n\
  'dblclick',\n\
  'mousedown',\n\
  'mouseup',\n\
  'mouseenter',\n\
  'mouseleave',\n\
  'scroll',\n\
  'blur',\n\
  'focus',\n\
  'input',\n\
  'submit',\n\
  'keydown',\n\
  'keypress',\n\
  'keyup'\n\
];\n\
\n\
module.exports = function(View) {\n\
  events.forEach(function(name){\n\
    View.directive('on-' + name, {\n\
      update: function(fn){\n\
        if(this.callback) {\n\
          this.node.removeEventListener(name, this.callback, true);\n\
        }\n\
        this.callback = fn.bind(this.view);\n\
        this.node.addEventListener(name, this.callback, true);\n\
      },\n\
      unbind: function(){\n\
        this.node.removeEventListener(name, this.callback, true);\n\
      }\n\
    });\n\
  });\n\
};//@ sourceURL=ripplejs-events/index.js"
));
require.register("repl/index.js", Function("exports, require, module",
"\n\
var Repl = require('./repl');\n\
\n\
/**\n\
 * Expose `plugin`.\n\
 */\n\
\n\
module.exports = plugin;\n\
\n\
/**\n\
 * Add a browser shell to Hermes with an `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Function}\n\
 */\n\
\n\
function plugin(el){\n\
  return function(robot){\n\
    var repl = new Repl();\n\
    var id = 'user';\n\
\n\
    robot.user(id, { name: 'You' });\n\
\n\
    robot.connect = function(){\n\
      repl.replace(el);\n\
      repl.on('submit', function(text){\n\
        var user = robot.user(id);\n\
        repl.add({ text: text, name: user.name });\n\
        robot.hear(text, { user: id });\n\
      });\n\
    };\n\
\n\
    robot.say = function(msg, ctx){\n\
      repl.add({ text: msg, name: robot.name() });\n\
    };\n\
\n\
    robot.reply = function(id, msg, ctx){\n\
      var user = robot.user(id);\n\
      var mention = robot.mention(user.nickname);\n\
      msg = mention + msg;\n\
      repl.add({ text: msg, name: robot.name() });\n\
    };\n\
  };\n\
}\n\
//@ sourceURL=repl/index.js"
));
require.register("repl/repl.js", Function("exports, require, module",
"\n\
var bind = require('bind-methods');\n\
var each = require('each');\n\
var Emitter = require('emitter');\n\
var events = require('events');\n\
var ripple = require('ripple');\n\
var template = require('./repl.html');\n\
\n\
/**\n\
 * Expose `Repl`.\n\
 */\n\
\n\
var Repl = module.exports = ripple(template)\n\
  .use(bind)\n\
  .use(each)\n\
  .use(events);\n\
\n\
/**\n\
 * Mixin `Emitter`.\n\
 */\n\
\n\
Emitter(Repl);\n\
\n\
/**\n\
 * When created, add defaults and bind all.\n\
 */\n\
\n\
Repl.on('created', function(repl){\n\
  repl.data.messages = [];\n\
});\n\
\n\
/**\n\
 * Add a message with `data` to the log.\n\
 *\n\
 * @param {Object} data\n\
 *   @property {String} name\n\
 *   @property {String} text\n\
 */\n\
\n\
Repl.prototype.add = function(data){\n\
  this.data.messages.push(data);\n\
  var log = this.el.querySelector('.Repl-log');\n\
  log.scrollTop = log.scrollHeight;\n\
};\n\
\n\
/**\n\
 * Submit handler.\n\
 *\n\
 * @param {Event} e\n\
 */\n\
\n\
Repl.prototype.submit = function(e){\n\
  e.preventDefault();\n\
  var input = this.el.querySelector('.Repl-input');\n\
  this.emit('submit', input.value);\n\
  input.value = '';\n\
};//@ sourceURL=repl/repl.js"
));
require.register("hermes/index.js", Function("exports, require, module",
"\n\
var tabify = require('tabify');\n\
var Hermes = require('hermes');\n\
var Plugin = require('plugin');\n\
var ripple = require('ripple');\n\
var repl = require('repl');\n\
var template = require('./index.html');\n\
\n\
/**\n\
 * View.\n\
 */\n\
\n\
var View = ripple(template);\n\
var view = new View();\n\
\n\
view.appendTo('main');\n\
\n\
var menu = view.el.querySelector('menu');\n\
var ol = view.el.querySelector('ol');\n\
\n\
/**\n\
 * Plugins.\n\
 */\n\
\n\
var plugins = ['flip', 'reminder', 'store'].map(function(name){\n\
  var file = name + '.js';\n\
  var a = document.createElement('a');\n\
  a.textContent = file;\n\
  a.classList.add('Shell-menu-item');\n\
  menu.appendChild(a);\n\
\n\
  var fn = require('./plugins/' + name);\n\
  var view = new Plugin({ data: {\n\
    file: file,\n\
    code: 'module.exports = ' + fn.toString()\n\
  }});\n\
\n\
  view.appendTo(ol);\n\
  return view;\n\
});\n\
\n\
/**\n\
 * Hookup tabs.\n\
 */\n\
\n\
var items = menu.querySelectorAll('a');\n\
var panes = ol.querySelectorAll('li');\n\
var tabs = tabify(items, panes);\n\
tabs.show(0);\n\
tabs.on('show', load);\n\
\n\
/**\n\
 * Kickoff first time.\n\
 */\n\
\n\
load();\n\
\n\
/**\n\
 * Load a Hermes instance, copying the current code strings from each of the\n\
 * plugin views, so that user changes are reflected.\n\
 */\n\
\n\
function load(){\n\
  var hermes = new Hermes()\n\
    .name('Hermes')\n\
    .nickname('hermes')\n\
    .use(repl('.Repl'));\n\
\n\
  plugins.forEach(function(view){\n\
    var code = view.code();\n\
    var fn = new Function('robot', code);\n\
    hermes.use(fn);\n\
  });\n\
\n\
  hermes.connect();\n\
  hermes.say('Hey there, I\\'m Hermes!');\n\
  hermes.say('Type \"@hermes help\" to see what I can do.');\n\
}\n\
//@ sourceURL=hermes/index.js"
));
require.register("hermes/plugins/flip.js", Function("exports, require, module",
"\n\
module.exports = function(robot){\n\
  robot.help('flip <text>', 'Flip some text upside down!');\n\
  robot.on('mention', /flip (.*)/i, function(res){\n\
    var str = res[1];\n\
    res.say('(\\u256f\\u00b0\\u25a1\\u00b0\\uff09\\u256f ' + flip(str));\n\
  });\n\
\n\
  function flip(string){\n\
    return string\n\
      .split('')\n\
      .reverse()\n\
      .map(replace)\n\
      .join('');\n\
  }\n\
\n\
  function replace(character){\n\
    return chars[character] || character;\n\
  }\n\
\n\
  var chars = {\n\
    '\\u0021': '\\u00A1',\n\
    '\\u0022': '\\u201E',\n\
    '\\u0026': '\\u214B',\n\
    '\\u0027': '\\u002C',\n\
    '\\u0028': '\\u0029',\n\
    '\\u002E': '\\u02D9',\n\
    '\\u0033': '\\u0190',\n\
    '\\u0034': '\\u152D',\n\
    '\\u0036': '\\u0039',\n\
    '\\u0037': '\\u2C62',\n\
    '\\u003B': '\\u061B',\n\
    '\\u003C': '\\u003E',\n\
    '\\u003F': '\\u00BF',\n\
    '\\u0041': '\\u2200',\n\
    '\\u0042': '\\u10412',\n\
    '\\u0043': '\\u2183',\n\
    '\\u0044': '\\u25D6',\n\
    '\\u0045': '\\u018E',\n\
    '\\u0046': '\\u2132',\n\
    '\\u0047': '\\u2141',\n\
    '\\u004A': '\\u017F',\n\
    '\\u004B': '\\u22CA',\n\
    '\\u004C': '\\u2142',\n\
    '\\u004D': '\\u0057',\n\
    '\\u004E': '\\u1D0E',\n\
    '\\u0050': '\\u0500',\n\
    '\\u0051': '\\u038C',\n\
    '\\u0052': '\\u1D1A',\n\
    '\\u0054': '\\u22A5',\n\
    '\\u0055': '\\u2229',\n\
    '\\u0056': '\\u1D27',\n\
    '\\u0059': '\\u2144',\n\
    '\\u005B': '\\u005D',\n\
    '\\u005F': '\\u203E',\n\
    '\\u0061': '\\u0250',\n\
    '\\u0062': '\\u0071',\n\
    '\\u0063': '\\u0254',\n\
    '\\u0064': '\\u0070',\n\
    '\\u0065': '\\u01DD',\n\
    '\\u0066': '\\u025F',\n\
    '\\u0067': '\\u0183',\n\
    '\\u0068': '\\u0265',\n\
    '\\u0069': '\\u0131',\n\
    '\\u006A': '\\u027E',\n\
    '\\u006B': '\\u029E',\n\
    '\\u006C': '\\u0283',\n\
    '\\u006D': '\\u026F',\n\
    '\\u006E': '\\u0075',\n\
    '\\u0072': '\\u0279',\n\
    '\\u0074': '\\u0287',\n\
    '\\u0076': '\\u028C',\n\
    '\\u0077': '\\u028D',\n\
    '\\u0079': '\\u028E',\n\
    '\\u007B': '\\u007D',\n\
    '\\u203F': '\\u2040',\n\
    '\\u2045': '\\u2046',\n\
    '\\u2234': '\\u2235'\n\
  };\n\
};\n\
//@ sourceURL=hermes/plugins/flip.js"
));
require.register("hermes/plugins/reminder.js", Function("exports, require, module",
"\n\
module.exports = function(robot){\n\
  robot.help('reminder <n> <message>', 'Set a reminder <message> to appear in <n> minutes.');\n\
  robot.on('mention', /remind(?:er)? (\\d+) (.*)/i, function(res){\n\
    var minutes = res[1];\n\
    var msg = res[2];\n\
    var ms = parseInt(minutes, 10) * 1000;\n\
    var fn = res.say.bind(res, 'REMINDER: ' + msg);\n\
    res.say('Sure thing, I set a reminder for ' + minutes + ' minutes from now.');\n\
    setTimeout(fn, ms);\n\
  });\n\
};\n\
//@ sourceURL=hermes/plugins/reminder.js"
));
require.register("hermes/plugins/store.js", Function("exports, require, module",
"\n\
module.exports = function(robot){\n\
  robot.help([\n\
    'get <key>',\n\
    'set <key> <value>'\n\
  ], 'Get or set a <key> with <value>.');\n\
\n\
  robot.on('mention', /get (\\w+)/i, function(res){\n\
    var key = res[1];\n\
    res.say(robot.data(key));\n\
  });\n\
\n\
  robot.on('mention', /set (\\w+) (.*)/i, function(res){\n\
    var key = res[1];\n\
    var value = res[2];\n\
    robot.data(key, value);\n\
    res.say('Just set \"' + key + '\" to \"' + value + '\".');\n\
  });\n\
};\n\
//@ sourceURL=hermes/plugins/store.js"
));













































require.register("plugin/index.html", Function("exports, require, module",
"module.exports = '<li class=\"Shell-pane Plugin\">\\n\
  <textarea class=\"Plugin-editor\">{{ code }}</textarea>\\n\
</li>';//@ sourceURL=plugin/index.html"
));



require.register("repl/repl.html", Function("exports, require, module",
"module.exports = '<div class=\"Repl\">\\n\
  <ol class=\"Repl-log\" each=\"{{ messages }}\">\\n\
    <li class=\"Repl-message\">\\n\
      <span data-name=\"{{ name }}\" class=\"Repl-message-name\">{{ name }}</span>\\n\
      <span class=\"Repl-message-text\">{{ text }}</span>\\n\
    </li>\\n\
  </ol>\\n\
  <form class=\"Repl-form\" on-submit=\"{{ this.submit }}\">\\n\
    <input class=\"Repl-input\" type=\"text\" placeholder=\"talk here&hellip;\">\\n\
    <input class=\"Repl-submit\" type=\"submit\">\\n\
  </form>\\n\
</div>';//@ sourceURL=repl/repl.html"
));
require.register("hermes/index.html", Function("exports, require, module",
"module.exports = '<div class=\"Shell\">\\n\
  <menu class=\"Shell-menu\">\\n\
    <a class=\"Shell-menu-item\">Hermes</a>\\n\
  </menu>\\n\
  <ol class=\"Shell-panes\">\\n\
    <li class=\"Shell-pane\"><div class=\"Repl\"></div></li>\\n\
  </ol>\\n\
</div>\\n\
';//@ sourceURL=hermes/index.html"
));
require.alias("fredsterss-tabify/lib/index.js", "hermes/deps/tabify/lib/index.js");
require.alias("fredsterss-tabify/lib/index.js", "hermes/deps/tabify/index.js");
require.alias("fredsterss-tabify/lib/index.js", "tabify/index.js");
require.alias("component-emitter/index.js", "fredsterss-tabify/deps/emitter/index.js");

require.alias("component-classes/index.js", "fredsterss-tabify/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-event/index.js", "fredsterss-tabify/deps/event/index.js");

require.alias("fredsterss-tabify/lib/index.js", "fredsterss-tabify/index.js");

require.alias("ripplejs-ripple/lib/index.js", "hermes/deps/ripple/lib/index.js");
require.alias("ripplejs-ripple/lib/view.js", "hermes/deps/ripple/lib/view.js");
require.alias("ripplejs-ripple/lib/bindings.js", "hermes/deps/ripple/lib/bindings.js");
require.alias("ripplejs-ripple/lib/model.js", "hermes/deps/ripple/lib/model.js");
require.alias("ripplejs-ripple/lib/render.js", "hermes/deps/ripple/lib/render.js");
require.alias("ripplejs-ripple/lib/directive.js", "hermes/deps/ripple/lib/directive.js");
require.alias("ripplejs-ripple/lib/text-binding.js", "hermes/deps/ripple/lib/text-binding.js");
require.alias("ripplejs-ripple/lib/attr-binding.js", "hermes/deps/ripple/lib/attr-binding.js");
require.alias("ripplejs-ripple/lib/child-binding.js", "hermes/deps/ripple/lib/child-binding.js");
require.alias("ripplejs-ripple/lib/index.js", "hermes/deps/ripple/index.js");
require.alias("ripplejs-ripple/lib/index.js", "ripple/index.js");
require.alias("anthonyshort-attributes/index.js", "ripplejs-ripple/deps/attributes/index.js");

require.alias("anthonyshort-dom-walk/index.js", "ripplejs-ripple/deps/dom-walk/index.js");
require.alias("anthonyshort-dom-walk/index.js", "ripplejs-ripple/deps/dom-walk/index.js");
require.alias("timoxley-to-array/index.js", "anthonyshort-dom-walk/deps/to-array/index.js");

require.alias("jaycetde-dom-contains/index.js", "anthonyshort-dom-walk/deps/dom-contains/index.js");

require.alias("anthonyshort-dom-walk/index.js", "anthonyshort-dom-walk/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "ripplejs-ripple/deps/is-boolean-attribute/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "ripplejs-ripple/deps/is-boolean-attribute/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "anthonyshort-is-boolean-attribute/index.js");
require.alias("anthonyshort-raf-queue/index.js", "ripplejs-ripple/deps/raf-queue/index.js");
require.alias("component-raf/index.js", "anthonyshort-raf-queue/deps/raf/index.js");

require.alias("component-domify/index.js", "ripplejs-ripple/deps/domify/index.js");

require.alias("component-each/index.js", "ripplejs-ripple/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-emitter/index.js", "ripplejs-ripple/deps/emitter/index.js");

require.alias("ripplejs-interpolate/index.js", "ripplejs-ripple/deps/interpolate/index.js");
require.alias("ripplejs-interpolate/index.js", "ripplejs-ripple/deps/interpolate/index.js");
require.alias("ripplejs-expression/index.js", "ripplejs-interpolate/deps/expression/index.js");
require.alias("ripplejs-expression/index.js", "ripplejs-interpolate/deps/expression/index.js");
require.alias("component-props/index.js", "ripplejs-expression/deps/props/index.js");

require.alias("yields-uniq/index.js", "ripplejs-expression/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("ripplejs-expression/index.js", "ripplejs-expression/index.js");
require.alias("component-format-parser/index.js", "ripplejs-interpolate/deps/format-parser/index.js");

require.alias("yields-uniq/index.js", "ripplejs-interpolate/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("component-props/index.js", "ripplejs-interpolate/deps/props/index.js");

require.alias("ripplejs-interpolate/index.js", "ripplejs-interpolate/index.js");
require.alias("ripplejs-path-observer/index.js", "ripplejs-ripple/deps/path-observer/index.js");
require.alias("ripplejs-path-observer/index.js", "ripplejs-ripple/deps/path-observer/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-path-observer/deps/keypath/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-path-observer/deps/keypath/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-keypath/index.js");
require.alias("component-emitter/index.js", "ripplejs-path-observer/deps/emitter/index.js");

require.alias("component-type/index.js", "ripplejs-path-observer/deps/type/index.js");

require.alias("anthonyshort-raf-queue/index.js", "ripplejs-path-observer/deps/raf-queue/index.js");
require.alias("component-raf/index.js", "anthonyshort-raf-queue/deps/raf/index.js");

require.alias("ripplejs-path-observer/index.js", "ripplejs-path-observer/index.js");
require.alias("yields-uniq/index.js", "ripplejs-ripple/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("ripplejs-ripple/lib/index.js", "ripplejs-ripple/index.js");
require.alias("segmentio-hermes/hermes.js", "hermes/deps/hermes/hermes.js");
require.alias("segmentio-hermes/hermes.js", "hermes/deps/hermes/index.js");
require.alias("segmentio-hermes/hermes.js", "hermes/index.js");
require.alias("segmentio-hermes/hermes.js", "segmentio-hermes/index.js");

require.alias("plugin/index.js", "hermes/deps/plugin/index.js");
require.alias("plugin/index.js", "plugin/index.js");
require.alias("benatkin-codemirror/codemirror.js", "plugin/deps/codemirror/codemirror.js");
require.alias("benatkin-codemirror/codemirror.js", "plugin/deps/codemirror/index.js");
require.alias("benatkin-codemirror/codemirror.js", "benatkin-codemirror/index.js");
require.alias("benatkin-codemirror-mode-javascript/index.js", "plugin/deps/codemirror-mode-javascript/index.js");

require.alias("ripplejs-ripple/lib/index.js", "plugin/deps/ripple/lib/index.js");
require.alias("ripplejs-ripple/lib/view.js", "plugin/deps/ripple/lib/view.js");
require.alias("ripplejs-ripple/lib/bindings.js", "plugin/deps/ripple/lib/bindings.js");
require.alias("ripplejs-ripple/lib/model.js", "plugin/deps/ripple/lib/model.js");
require.alias("ripplejs-ripple/lib/render.js", "plugin/deps/ripple/lib/render.js");
require.alias("ripplejs-ripple/lib/directive.js", "plugin/deps/ripple/lib/directive.js");
require.alias("ripplejs-ripple/lib/text-binding.js", "plugin/deps/ripple/lib/text-binding.js");
require.alias("ripplejs-ripple/lib/attr-binding.js", "plugin/deps/ripple/lib/attr-binding.js");
require.alias("ripplejs-ripple/lib/child-binding.js", "plugin/deps/ripple/lib/child-binding.js");
require.alias("ripplejs-ripple/lib/index.js", "plugin/deps/ripple/index.js");
require.alias("anthonyshort-attributes/index.js", "ripplejs-ripple/deps/attributes/index.js");

require.alias("anthonyshort-dom-walk/index.js", "ripplejs-ripple/deps/dom-walk/index.js");
require.alias("anthonyshort-dom-walk/index.js", "ripplejs-ripple/deps/dom-walk/index.js");
require.alias("timoxley-to-array/index.js", "anthonyshort-dom-walk/deps/to-array/index.js");

require.alias("jaycetde-dom-contains/index.js", "anthonyshort-dom-walk/deps/dom-contains/index.js");

require.alias("anthonyshort-dom-walk/index.js", "anthonyshort-dom-walk/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "ripplejs-ripple/deps/is-boolean-attribute/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "ripplejs-ripple/deps/is-boolean-attribute/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "anthonyshort-is-boolean-attribute/index.js");
require.alias("anthonyshort-raf-queue/index.js", "ripplejs-ripple/deps/raf-queue/index.js");
require.alias("component-raf/index.js", "anthonyshort-raf-queue/deps/raf/index.js");

require.alias("component-domify/index.js", "ripplejs-ripple/deps/domify/index.js");

require.alias("component-each/index.js", "ripplejs-ripple/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-emitter/index.js", "ripplejs-ripple/deps/emitter/index.js");

require.alias("ripplejs-interpolate/index.js", "ripplejs-ripple/deps/interpolate/index.js");
require.alias("ripplejs-interpolate/index.js", "ripplejs-ripple/deps/interpolate/index.js");
require.alias("ripplejs-expression/index.js", "ripplejs-interpolate/deps/expression/index.js");
require.alias("ripplejs-expression/index.js", "ripplejs-interpolate/deps/expression/index.js");
require.alias("component-props/index.js", "ripplejs-expression/deps/props/index.js");

require.alias("yields-uniq/index.js", "ripplejs-expression/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("ripplejs-expression/index.js", "ripplejs-expression/index.js");
require.alias("component-format-parser/index.js", "ripplejs-interpolate/deps/format-parser/index.js");

require.alias("yields-uniq/index.js", "ripplejs-interpolate/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("component-props/index.js", "ripplejs-interpolate/deps/props/index.js");

require.alias("ripplejs-interpolate/index.js", "ripplejs-interpolate/index.js");
require.alias("ripplejs-path-observer/index.js", "ripplejs-ripple/deps/path-observer/index.js");
require.alias("ripplejs-path-observer/index.js", "ripplejs-ripple/deps/path-observer/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-path-observer/deps/keypath/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-path-observer/deps/keypath/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-keypath/index.js");
require.alias("component-emitter/index.js", "ripplejs-path-observer/deps/emitter/index.js");

require.alias("component-type/index.js", "ripplejs-path-observer/deps/type/index.js");

require.alias("anthonyshort-raf-queue/index.js", "ripplejs-path-observer/deps/raf-queue/index.js");
require.alias("component-raf/index.js", "anthonyshort-raf-queue/deps/raf/index.js");

require.alias("ripplejs-path-observer/index.js", "ripplejs-path-observer/index.js");
require.alias("yields-uniq/index.js", "ripplejs-ripple/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("ripplejs-ripple/lib/index.js", "ripplejs-ripple/index.js");

require.alias("repl/index.js", "hermes/deps/repl/index.js");
require.alias("repl/repl.js", "hermes/deps/repl/repl.js");
require.alias("repl/index.js", "repl/index.js");
require.alias("component-emitter/index.js", "repl/deps/emitter/index.js");

require.alias("ripplejs-bind-methods/index.js", "repl/deps/bind-methods/index.js");

require.alias("ripplejs-each/index.js", "repl/deps/each/index.js");
require.alias("ripplejs-array-observer/index.js", "ripplejs-each/deps/array-observer/index.js");
require.alias("component-emitter/index.js", "ripplejs-array-observer/deps/emitter/index.js");

require.alias("ripplejs-events/index.js", "repl/deps/events/index.js");

require.alias("ripplejs-ripple/lib/index.js", "repl/deps/ripple/lib/index.js");
require.alias("ripplejs-ripple/lib/view.js", "repl/deps/ripple/lib/view.js");
require.alias("ripplejs-ripple/lib/bindings.js", "repl/deps/ripple/lib/bindings.js");
require.alias("ripplejs-ripple/lib/model.js", "repl/deps/ripple/lib/model.js");
require.alias("ripplejs-ripple/lib/render.js", "repl/deps/ripple/lib/render.js");
require.alias("ripplejs-ripple/lib/directive.js", "repl/deps/ripple/lib/directive.js");
require.alias("ripplejs-ripple/lib/text-binding.js", "repl/deps/ripple/lib/text-binding.js");
require.alias("ripplejs-ripple/lib/attr-binding.js", "repl/deps/ripple/lib/attr-binding.js");
require.alias("ripplejs-ripple/lib/child-binding.js", "repl/deps/ripple/lib/child-binding.js");
require.alias("ripplejs-ripple/lib/index.js", "repl/deps/ripple/index.js");
require.alias("anthonyshort-attributes/index.js", "ripplejs-ripple/deps/attributes/index.js");

require.alias("anthonyshort-dom-walk/index.js", "ripplejs-ripple/deps/dom-walk/index.js");
require.alias("anthonyshort-dom-walk/index.js", "ripplejs-ripple/deps/dom-walk/index.js");
require.alias("timoxley-to-array/index.js", "anthonyshort-dom-walk/deps/to-array/index.js");

require.alias("jaycetde-dom-contains/index.js", "anthonyshort-dom-walk/deps/dom-contains/index.js");

require.alias("anthonyshort-dom-walk/index.js", "anthonyshort-dom-walk/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "ripplejs-ripple/deps/is-boolean-attribute/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "ripplejs-ripple/deps/is-boolean-attribute/index.js");
require.alias("anthonyshort-is-boolean-attribute/index.js", "anthonyshort-is-boolean-attribute/index.js");
require.alias("anthonyshort-raf-queue/index.js", "ripplejs-ripple/deps/raf-queue/index.js");
require.alias("component-raf/index.js", "anthonyshort-raf-queue/deps/raf/index.js");

require.alias("component-domify/index.js", "ripplejs-ripple/deps/domify/index.js");

require.alias("component-each/index.js", "ripplejs-ripple/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-emitter/index.js", "ripplejs-ripple/deps/emitter/index.js");

require.alias("ripplejs-interpolate/index.js", "ripplejs-ripple/deps/interpolate/index.js");
require.alias("ripplejs-interpolate/index.js", "ripplejs-ripple/deps/interpolate/index.js");
require.alias("ripplejs-expression/index.js", "ripplejs-interpolate/deps/expression/index.js");
require.alias("ripplejs-expression/index.js", "ripplejs-interpolate/deps/expression/index.js");
require.alias("component-props/index.js", "ripplejs-expression/deps/props/index.js");

require.alias("yields-uniq/index.js", "ripplejs-expression/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("ripplejs-expression/index.js", "ripplejs-expression/index.js");
require.alias("component-format-parser/index.js", "ripplejs-interpolate/deps/format-parser/index.js");

require.alias("yields-uniq/index.js", "ripplejs-interpolate/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("component-props/index.js", "ripplejs-interpolate/deps/props/index.js");

require.alias("ripplejs-interpolate/index.js", "ripplejs-interpolate/index.js");
require.alias("ripplejs-path-observer/index.js", "ripplejs-ripple/deps/path-observer/index.js");
require.alias("ripplejs-path-observer/index.js", "ripplejs-ripple/deps/path-observer/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-path-observer/deps/keypath/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-path-observer/deps/keypath/index.js");
require.alias("ripplejs-keypath/index.js", "ripplejs-keypath/index.js");
require.alias("component-emitter/index.js", "ripplejs-path-observer/deps/emitter/index.js");

require.alias("component-type/index.js", "ripplejs-path-observer/deps/type/index.js");

require.alias("anthonyshort-raf-queue/index.js", "ripplejs-path-observer/deps/raf-queue/index.js");
require.alias("component-raf/index.js", "anthonyshort-raf-queue/deps/raf/index.js");

require.alias("ripplejs-path-observer/index.js", "ripplejs-path-observer/index.js");
require.alias("yields-uniq/index.js", "ripplejs-ripple/deps/uniq/index.js");
require.alias("component-indexof/index.js", "yields-uniq/deps/indexof/index.js");

require.alias("ripplejs-ripple/lib/index.js", "ripplejs-ripple/index.js");