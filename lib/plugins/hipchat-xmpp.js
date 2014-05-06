
var Emitter = require('events').EventEmitter;
var inherit = require('util').inherits;
var noop = function(){};
var xmpp = require('node-xmpp');
var Client = xmpp.Client;
var Element = xmpp.Element;
var JID = xmpp.JID;

/**
 * Expose `XMPP`.
 */

module.exports = XMPP;

/**
 * Augmenting IDs.
 */

var ids = 1;

/**
 * Initialize a new `XMPP` XMPP wrapper with `settings`.
 *
 * @param {Object} settings
 */

function XMPP(settings){
  var jid = new JID(settings.jid);
  jid.resource = 'bot'; // prevent hipchat from sending history
  this.jid = jid.toString();
  this.password = settings.password;
  this.host = settings.host;
}

/**
 * Inherit from `Emitter`.
 */

inherit(XMPP, Emitter);

/**
 * Get or set the current client.
 *
 * @return {Client or XMPP}
 * @api private
 */

XMPP.prototype.client = function(client){
  if (!arguments.length) {
    if (!this._client) throw new Error('You must call #connect before using the client.');
    return this._client;
  };

  this._client = client;
  return this;
};

/**
 * Start the XMPP connection.
 *
 * @param {Function} fn (optional)
 */

XMPP.prototype.connect = function(fn){
  fn = fn || noop;

  var client = new Client({
    jid: this.jid,
    password: this.password,
    host: this.host
  });

  client.on('error', this.onError.bind(this));
  client.on('online', this.onOnline.bind(this));
  client.on('stanza', this.onStanza.bind(this));

  this.client(client);
  this.once('connect', fn);
  this.once('error', this.disconnect.bind(this));
};

/**
 * End the XMPP connection.
 */

XMPP.prototype.disconnect = function(){
  var client = this.client();
  client.end();
  this.emit('disconnect');
};

/**
 * A convenience method to send an XMPP `element` to the server.
 *
 * @param {Element} element
 * @param {Function} fn
 */

XMPP.prototype.send = function(element, fn){
  fn = fn || noop;
  element = element.root(); // always work with the root element
  element.attrs.id = ids++;
  var client = this.client();
  this.once('iq ' + element.attrs.id, fn);
  client.send(element, fn);
};

/**
 * Set the connector's `status` with optional `message`.
 *
 * The status can be either 'chat', 'away' or 'dnd'.
 *
 * @param {String} status
 * @param {String} message
 */

XMPP.prototype.status = function(status, message, fn){
  var client = this.client();
  var el = new Element('presence', { type: 'available' });
  if (message) el.c('status').t(message);
  el.c('show').t(status);
  client.send(el, fn);
};

/**
 * Get the user's profile information.
 *
 * @param {Function} fn
 */

XMPP.prototype.profile = function(fn){
  var el = new Element('iq', { type: 'get' });
  el.c('vCard', { xmlns: 'vcard-temp' });

  this.send(el, function(err, stanza){
    if (err) return fn(err);
    var ret = {};
    var card = stanza.getChild('vCard').children;

    for (var key in card) {
      var field = card[key];
      var k = field.name.toLowerCase();
      ret[k] = field.getText();
    }

    fn(null, ret);
  });
};

/**
 * Get the available rooms.
 *
 * @param {Function} fn
 */

XMPP.prototype.rooms = function(fn){
  var el = new Element('iq', {
    to: 'conf.hipchat.com',
    type: 'get'
  });
  el.c('query', { xmlns: 'http://jabber.org/protocol/disco#items' });

  this.send(el, function(err, stanza){
    if (err) return fn(err);
    var els = stanza.getChild('query').getChildren('item');
    fn(null, els.map(function(el){
      var x = el.getChild('x', 'http://hipchat.com/protocol/muc#room');
      return {
        x: x,
        jid: el.attrs.jid,
        name: el.attrs.name,
        id: parseInt(get(x, 'id'), 10),
        topic: get(x, 'topic'),
        privacy: get(x, 'privacy'),
        owner: get(x, 'owner'),
        num_participants: get(x, 'num_participants'),
        guest_url: get(x, 'guest_url'),
        is_archived: !! x.getChild('is_archived')
      };
    }));
  });
};

/**
 * Get the list of users.
 *
 * @param {Function} fn
 */

XMPP.prototype.roster = function(fn){
  var el = new Element('iq', { type: 'get' })
  el.c('query', { xmlns: 'jabber:iq:roster' });
  this.send(el, function(err, stanza){
    if (err) return fn(err);
    fn(null, getUsers(stanza));
  });
};

/**
 * Join a room by `jid`.
 *
 * @param {String} jid
 * @param {Function} fn
 */

XMPP.prototype.join = function(jid, fn){
  var client = this.client();
  var to = jid + '/' + this.name;
  var el = new Element('presence', { to: to });
  el.c('x', { xmlns: 'http://jabber.org/protocol/muc' });
  this.once('join', fn);
  client.send(el);
};

/**
 * Leave a room by `jid`.
 *
 * @param {String} jid
 * @param {Function} fn
 */

XMPP.prototype.leave = function(jid, fn){
  fn = fn || noop;
  var client = this.client();
  var el = new Element('presence', {
    type: 'unavailable',
    to: jid + '/' + this.name
  });
  el.c('x', { xmlns: 'http://jabber.org/protocol/muc' });
  el.c('status').t('hc-leave');
  this.once('leave', fn);
  client.send(el);
};

/**
 * Send a `message` to a room by `jid`.
 *
 * @param {String} jid
 * @param {String} message
 * @param {Function} fn
 */

XMPP.prototype.groupchat = function(jid, message, fn){
  var client = this.client();
  var el = new Element('message', {
    to: jid + '/' + this.name,
    type: 'groupchat'
  });
  el.c('body').t(message);
  client.send(el, fn);
};

/**
 * Send a private `message` to a user by `jid`.
 *
 * @param {String} jid
 * @param {String} message
 * @param {Function} fn
 */

XMPP.prototype.chat = function(jid, message, fn){
  var client = this.client();
  var el = new Element('message', {
    to: jid,
    type: 'chat',
    from: this.jid
  });
  el.c('inactive', { xmlns: 'http://jabber/protocol/chatstates' });
  el.c('body').t(message);
  client.send(el, fn);
};

/**
 * Set the `topic` for a given room by `jid`.
 *
 * @param {String} jid
 * @param {String} topic
 * @param {Function} fn
 */

XMPP.prototype.topic = function(jid, topic, fn){
  var client = this.client();
  var el = new Element('message', {
    to: jid + '/' + this.name,
    type: 'groupchat'
  });
  el.c('subject').t(topic);
  client.send(el, fn);
};

/**
 * Handle an incoming XMPP "online" event.
 */

XMPP.prototype.onOnline = function(){
  var self = this;
  this.status('chat');
  this.ping = setInterval(ping, 30000);

  this.profile(function(err, profile){
    if (err) return self.emit('error', 'Unable to get profile information.');
    self.name = profile.fn;
    self.username = profile.nickname;

    self.roster(function(err, users){
      if (err) return self.emit('error', 'Unable to get user roster.');
      self.emit('connect', profile, users);
    });
  });

  function ping(){
    var el = new Element('r');
    var client = self.client();
    client.send(el);
    self.emit('ping');
  }
};

/**
 * Handle incoming XMPP stream `err`.
 *
 * @param {Element} err
 */

XMPP.prototype.onError = function(err){
  if (!(err instanceof Element)) return this.emit('error', null, null, err);
  var condition = err.children[0].name;
  var text = err.getChildText('text');
  if (!text) text = 'No error text sent by XMPP, see http://xmpp.org/rfcs/rfc6120.html#streams-error-conditions for error condition descriptions.'
  this.emit('error', condition, text, err);
};

/**
 * Handle an incoming XMPP `stanza`.
 *
 * @param {Element} stanza
 */

XMPP.prototype.onStanza = function(stanza){
  if (stanza.is('message')) return this.onMessage(stanza);
  if (stanza.is('iq')) return this.onIq(stanza);
  if (stanza.is('presence')) return this.onPresence(stanza);
};

/**
 * Handle an incoming XMPP message `stanza`.
 *
 * @param {Element} stanza
 */

XMPP.prototype.onMessage = function(stanza){
  var from = stanza.attrs.from;
  var jid = new JID(from);
  var channel = jid.bare().toString();
  var body = stanza.getChild('body');
  var state = stanza.getChildByAttr('xmlns', 'http://jabber.org/protocol/chatstates');

  switch (stanza.attrs.type) {
    case 'chat':
      if (state) this.emit('chatstate', channel, state.name);
      if (!body) return;
      var text = body.getText();
      return this.emit('chat', channel, text);

    case 'groupchat':
      var name = jid.resource;
      if (name == this.name) return;
      if (state) this.emit('groupchatstate', channel, jid.toString(), state.name);
      if (!body) return;
      var text = body.getText();
      debugger;
      return this.emit('groupchat', channel, name, text);

    default: // invite
      var x = stanza.getChild('x', 'http://jabber.org/protocol/muc#user');
      if (!x) return;
      var invite = x.getChild('invite');
      if (!invite) return;
      var reason = invite.getChildText('reason');
      var room = jid;
      var sender = new JID(invite.attrs.from).bare();
      return this.emit('invite', room.toString(), sender.toString(), reason);
  }
};

/**
 * Handle an incoming XMPP iq `stanza`.
 *
 * @param {Element} stanza
 */

XMPP.prototype.onIq = function(stanza){
  var id = 'iq ' + stanza.attrs.id;

  switch (stanza.attrs.type) {
    case 'result':
      return this.emit(id, null, stanza);

    case 'set':
      if (stanza.getChild('query').attrs.xmlns != 'jabber:iq:roster') return;
      var users = getUsers(stanza);
      return this.emit('roster', users);

    default: // error
      var condition = 'unknown';
      var err = stanza.getChild('error');
      if (err) condition = err.children[0].name;
      return this.emit(id, condition);
  }
};

/**
 * Handle an incoming XMPP presence `stanza`.
 *
 * @param {Element} stanza
 */

XMPP.prototype.onPresence = function(stanza){
  var from = stanza.attrs.from;
  var jid = new JID(from);
  var room = jid.bare().toString();
  if (!room) return;

  var name = from.split('/')[1] || '';
  var type = stanza.attrs.type || 'available';
  var x = stanza.getChild('x', 'http://jabber.org/protocol/muc#user');
  if (!x) return;

  var entity = x.getChild('item');
  if (!entity || !entity.attrs) return;

  var f = entity.attrs.jid;
  if (!f) return;

  return 'unavailable' == type
    ? this.emit('leave', f, room, name)
    : this.emit('join', f, room, name);
};

/**
 * Return an array of users from a `stanza`.
 *
 * @param {Element} stanza
 * @return {Array}
 */

function getUsers(stanza){
  return stanza
    .getChild('query')
    .getChildren('item')
    .map(function(el){
      return {
        jid: el.attrs.jid,
        name: el.attrs.name,
        mention_name: el.attrs.mention_name
      };
    });
}

/**
 * Get the text of the child of an `el` by `name`.
 *
 * @param {Element} el
 * @param {String} name
 * @return {String}
 */

function get(el, name){
  return el.getChild(name).getText();
}