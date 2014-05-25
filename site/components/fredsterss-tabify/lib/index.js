var classes = require('classes')
  , Emitter = require('emitter')
  , events  = require('event');

/**
 * Expose Tabify
 */
module.exports = Tabify;

/**
 * Turn a linksEl and targetsEl
 * @param {el} parent el of links you want to be tabs
 * @param {el} parent el of targets for the tabs
 */
function Tabify (links, targets, options) {
  if (!(this instanceof Tabify)) return new Tabify(links, targets, options);
  options = options || {};
  this.hiddenClass = options.hiddenClass || "hidden";
  this.activeClass = options.activeClass || "active";
  this.links = links;
  this.targets = targets;
  this.current = 0;
  this.bind();
  this.show(0);
};

/**
 * Mixin emitter
 */
Emitter(Tabify.prototype);

/**
 * Show target and activate link
 * @param  {Number} the tab order
 * @return {Tabify}
 */
Tabify.prototype.show = function (i) {
  this.current = i;
  this.hide();
  classes(this.links[i]).add(this.activeClass);
  classes(this.targets[i]).remove(this.hiddenClass);
  this.emit('show');
  return this;
}

/**
 * Hide tab. If no id is passed, hide all.
 * @param  {Number} tab id (order in array)
 * @return {Tabify} 
 */
Tabify.prototype.hide = function (id) {
  for (i = 0; i < this.links.length; i++) {
    if (id != null && id != i) { continue; }
    classes(this.links[i]).remove(this.activeClass);
    classes(this.targets[i]).add(this.hiddenClass);
  }
  return this;
}

/**
 * Show the next tab
 * @return {Tabify}
 */
Tabify.prototype.next = function () {
  if (this.current + 1 == this.links.length) {
    this.emit('finished');
    this.show(0);
  } else {
    this.show(this.current + 1);
  }
  return this;
}

/**
 * Show the previous tab
 * @return {Tabify}
 */
Tabify.prototype.prev = function () {
  if (this.current - 1 < 0) {
    this.show(this.links.length - 1);
  } else {
    this.show(this.current - 1);
  }
  return this;
}

/**
 * Bind click events
 * @return {Tabify}
 */
Tabify.prototype.bind = function () {
  var self = this;
  bindListener = function (i) {
    events.bind(self.links[i], 'click', function () {
      self.show(i);
    });    
  };
  for (i = 0; i < this.links.length; i++) {
    bindListener(i);
  }
  return this;
}