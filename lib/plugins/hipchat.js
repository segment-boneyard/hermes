
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
    xmpp.connect();

    /**
     * Connect, save the robot's name from the profile.
     *
     * @param {Object} profile
     * @param {Array} users
     */

    xmpp.on('connect', function(profile, users){
      robot.name(profile.nickname);
      saveUsers(users);
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
      robot.receive(message, { user: user.id, room: room });
    });

    /**
     * Private chat, add the mention equivalent to the message.
     *
     * @param {String} user
     * @param {String} message
     */

    xmpp.on('chat', function(user, message){
      message = format('@%s %s', robot.name(), message);
      robot.receive(message, { user: user });
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
        robot.receive(message, { user: user, room: room });
      });
    });

    xmpp.on('roster', function(users){
      debugger;
    });

    xmpp.on('error', function(err){
      debugger;
    });


    // simple.connect({
    //   jid: settings.jid,
    //   password: settings.password,
    //   host: 'chat.hipchat.com'
    // });

    // simple.on('online', function(data){
    //   console.log(data);
    //   console.log(data.jid);
    //   console.log(data.jid.user);
    // });

    // simple.on('error', console.log);

    // simple.on('chat', function(from, message){
    //   robot.receive(message, { user: from });
    // });

    // simple.on('groupchat', function(conference, from, message, stamp){
    //   debugger;
    // });



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

    /**
     * Update the roster of `users`.
     *
     * @param {Array} users
     */

    function saveUsers(users){
      users.forEach(function(user){
        robot.user(user.jid, {
          name: user.name,
          username: user.mention_name
        });
      });
    }

    /**
     * Update the list of `rooms`.
     *
     * @param {Array} rooms
     */

    function saveRooms(rooms){
      rooms.forEach(function(room){
        robot.room(room.jid, {
          name: room.name,
          topic: room.topic
        });
      });
    }

  };
}
