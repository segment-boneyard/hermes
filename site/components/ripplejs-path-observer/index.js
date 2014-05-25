var emitter = require('emitter');
var keypath = require('keypath');
var type = require('type');
var raf = require('raf-queue');

module.exports = function(obj) {

  /**
   * Stores each observer created for each
   * path so they're singletons. This allows us to
   * fire change events on all related paths.
   *
   * @type {Object}
   */
  var cache = {};

  /**
   * Takes a path and announces whenever
   * the value at that path changes.
   *
   * @param {String} path The keypath to the value 'foo.bar.baz'
   */
  function PathObserver(path) {
    if(!(this instanceof PathObserver)) return new PathObserver(path);
    if(cache[path]) return cache[path];
    this.path = path;
    Object.defineProperty(this, 'value', {
      get: function() {
        return keypath.get(obj, this.path);
      },
      set: function(val) {
        keypath.set(obj, this.path, val);
      }
    });
    cache[path] = this;
  }

  /**
   * Remove all path observers
   */
  PathObserver.dispose = function() {
    for(var path in cache) {
      cache[path].dispose();
    }
    this.off();
  };

  /**
   * Emit a change event next tick
   */
  PathObserver.change = function() {
    raf.once(this.notify, this);
  };

  /**
   * Notify observers of a change
   */
  PathObserver.notify = function() {
    this.emit('change');
  };

  /**
   * Mixin
   */
  emitter(PathObserver);
  emitter(PathObserver.prototype);

  /**
   * Get the value of the path.
   *
   * @return {Mixed}
   */
  PathObserver.prototype.get = function() {
    return this.value;
  };

  /**
   * Set the value of the keypath
   *
   * @return {PathObserver}
   */
  PathObserver.prototype.set = function(val) {
    var current = this.value;

    if (type(val) === 'object') {
      var changes = 0;
      for (var key in val) {
        var path = new PathObserver(this.path + '.' + key);
        path.once('change', function(){
          changes += 1;
        });
        path.set(val[key]);
      }
      if (changes > 0) {
        this.emit('change', this.value, current);
      }
      return;
    }

    // no change
    if(current === val) return this;

    this.value = val;
    this.emit('change', this.value, current);
    PathObserver.change();
    return this;
  };

  /**
   * Bind to changes on this path
   *
   * @param {Function} fn
   *
   * @return {Function}
   */
  PathObserver.prototype.change = function(fn){
    var self = this;
    self.on('change', fn);
    return function(){
      self.off('change', fn);
    };
  };

  /**
   * Clean up and remove all event bindings
   */
  PathObserver.prototype.dispose = function(){
    this.off('change');
    delete cache[this.path];
  };

  return PathObserver;
};