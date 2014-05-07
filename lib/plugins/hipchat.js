
var assert = require('assert');
var format = require('util').format;
var HTTP = require('node-hipchat');
var type = require('component-type');
var XMPP = require('./hipchat-xmpp');
var simple = require('simple-xmpp');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * A HipChat plugin for Hermes.
 *
 * @param {Object} settings
 *   @property {String} apiKey
 *   @property {String} jid
 *   @property {String} password
 *   @property {Boolean} log (optional)
 */

function plugin(settings){
  assert('object' == type(settings), 'You must supply a settings object.');

  var http = new HTTP(settings.apiKey);

  var xmpp = new XMPP({
    jid: settings.jid,
    password: settings.password,
    host: 'chat.hipchat.com'
  });

  return function(robot){

    /**
     * Connect and save info to memory.
     */

    xmpp.connect(function(){
      xmpp.profile(function(err, profile){
        if (err) throw err;
        robot.name(profile.nickname);
      });

      xmpp.roster(function(err, users){
        if (err) throw err;
        users.forEach(function(user){
          robot.user(user.jid, {
            name: user.name,
            username: user.mention_name
          });
        });
      });

      xmpp.rooms(function(err, rooms){
        if (err) throw err;
        rooms.forEach(function(room){
          xmpp.join(room.jid);
          robot.room(room.jid, {
            name: room.name,
            topic: room.topic
          });
        });
      });
    });

    /**
     * Group chat.
     *
     * @param {String} room
     * @param {String} name
     * @param {String} message
     */

    xmpp.on('groupchat', function(room, name, message){
      var user = robot.user({ name: name });
      if (!user) return;
      robot.hear(message, { user: user.id, room: room });
    });

    /**
     * Private chat, add the mention equivalent to the message.
     *
     * @param {String} user
     * @param {String} message
     */

    xmpp.on('chat', function(user, message){
      message = format('@%s %s', robot.name(), message);
      robot.hear(message, { user: user });
    });

    /**
     * Invite, join the room then act on the message.
     *
     * @param {String} room
     * @param {String} user
     * @param {String} message
     */

    xmpp.on('invite', function(room, user, message){
      xmpp.join(room, function(){
        robot.hear(message, { user: user, room: room });
      });
    });

    /**
     * Error.
     *
     * @param {Error} err
     */

    xmpp.on('error', function(err){
      throw err;
    });

    /**
     * Send a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     */

    robot.say = function(message, context){
      if (!context) throw new Error('A message `context` is required.');
      var user = context.user;
      var room = context.room;
      if (room) return xmpp.groupchat(room, message);
      if (user) return xmpp.chat(user, message);
      throw new Error('A `context.user` or `context.room` to speak to is required.');
    };

    /**
     * Emote a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     */

    robot.emote = function(message, context){
      message = format('/me %s', message);
      robot.say(message, context);
    };

    /**
     * Reply to a `context.user` with a `message`.
     *
     * @param {String} message
     * @param {Object} context (optional)
     *   @property {String} user
     *   @property {String} room
     */

    robot.reply = function(message, context){
      if (!context) throw new Error('A message `context` is required.');
      if (!context.user) throw new Error('A `context.user` to reply to is required.');
      if (context.room) message = format('@%s %s', context.user, message);
      robot.say(message, context);
    };
  };
}
