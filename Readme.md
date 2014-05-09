
# hermes

Hermes is a friendly, pluggable chat bot. He's super easy to customize, so you can write your own plugins to teach him new tricks, and automate away all of the things!

## Installation

    $ npm install -g hermes

## Usage

The simplest way to use Hermes is to use the CLI paired with a `hermes.json` configuration file. Here's an example `hermes.json` file:

```json
{
  "name": "Dr. Watson",
  "nickname": "watson",
  "plugins": {
    "hermes-math": {},
    "hermes-url-shortener": {},
    "hermes-hipchat": {
      "jid": "YOUR_HIPCHAT_JID",
      "password": "YOUR_HIPCHAT_PASSWORD",
      "apiKey": "YOUR_HIPCHAT_API_KEY"
    }
  }
}
```

That would be setup to create a HipChat robot named "Picasso", that would know how to do basic math and shorten URLs. Then, to run your robot, just do:

    $ hermes

You'll see him connect to your HipChat room. Then ask him to do things:

    > You: @watson shorten https://github.com/segmentio/hermes
    > Dr. Watson: @you Sure thing: http://goo.gl/hZevN6

    > You: @watson what's 52/3
    > Dr. Watson: @you That would be: 17.333333333

## Plugins

Check out the [Hermes site](TODO) for a list of all the open-source plugins you can add to your robot.

## Javascript API

Hermes also comes with a Javascript API, for complicated use cases and full control over how Hermes is configured.

#### `new Robot(name)`
 
Create a new `Robot` instance with the given `name`, defaulting to `'Hermes'`, and with its nickname defaulting to `'hermes'`.

#### `robot.name([string])`

Get or set the robot's name `string`. The **name** is the full, proper english way to format the robot's name, for example `'Picasso'` not `'picasso'`.

#### `robot.nickname([string])`

Get or set the robot's nickname `string`. The **nickname** is the chat-friendly way to format the robot's, for services that distinguish the two. For example, in HipChat this would correlate to the user's "mention name", so a robot named `'Hermes Hubeau'` might have a **nickname** of `'hermes'`, so that it can be mentioned with `@hermes`. By default, the **nickname** will just mirror the name.

#### `robot.template([string])`

Get or set the template for how the robot is mentioned. By default it is `'@%s '`, which converts via `util.format` to `'@hermes '`. (The robot's **nickname** is used for conversion.)

#### `robot.mention(nickname)`

Return a mention string for the given nickname, defaulting to the robot's own nickname. This is so that plugins don't have to format the nicknames themselves. For example, `robot.mention('ian')` might return `'@ian '`.

#### `robot.hear(message, [context])`

Send the robot a `message` to process, with optional `context`. It'll decide which of its plugin's handlers to invoke. `context` is useful for situations where the message comes from a certain `user` or `room`, so that it can reply properly, for example:

```js
robot.hear('@watson Hi Watson', {
  user: 'ian',
  room: 'hq'
});
```

#### `robot.on(event, [regexp], [string], [context], callback)`

The robot is an event emitter, so by default `robot.on('event', callback)` will act exactly as expected. It fires the following events:

  - `name` - with the new `name` string
  - `nickname` - with the new `nickname` string
  - `template` - with the new `template` string
  - `hear` - with `match, context` whenever it hears an incoming message
  - `mention` - with `match, context` whenever it's mentioned in an incoming message

But it's also got augmented functionality, so that you can filter which incoming messages you want to listen to. You can filter by either a `regexp`, a `string` or a `context`. This is how plugins are made. For example, here's what the URL shortening plugin is listening for:

```js
robot.on('mention', /^shorten (\S+)$/i, callback);
```

Or if you just want to match a basic string:

```js
robot.on('mention', 'surprise me', callback);
```

Or if you want to only match messages from a certain user:

```js
robot.on('mention', { user: 'USER_ID' }, callback);
```

These filters can be combined to add pretty complex logic to your robot, for example you can wait for an incoming reply from the user you're currently conversing with, so that you don't get noise from other users in the middle:

```js
robot.on('mention', 'shorten', function(match, context){
  robot.say('What URL do you want to shorten?', context);
  robot.once('mention', { user: context.user }, function(match){
    var url = match[0];
    var res = shorten(url);
    robot.say(res, context);
  });
});
```

#### `robot.once(event, [regexp], [string], [context], callback)`

The same as `robot.on()` but the `callback` will only ever be called once, and then it will be removed.

#### `robot.off(event, callback)`

Remove an event handler from the robot.

#### `robot.say(message, [context])`

Say a `message` with optional `context`.

#### `robot.emote(message, [context])`

Emote a `message` with optional `context`.

#### `robot.reply(id, message, [context])`

Reply to a user by `id` with a `message` and optional `context`.

#### `robot.topic(id, topic)`

Set the `topic` of a room by `id`.

#### `robot.error(message, [context])`
  
Send an error `message` with optional `context`. The error `message` can also be a Javascript `Error` instance.

#### `robot.warn(message, [context])`

Send a warning `message` with optional `context`.

#### `robot.success(message, [context])`

Send a success `message` with optional `context`.

#### `robot.user(id, [attrs])`

Get or set a user by `id` with `attrs`, defaulting to a simple in-memory store.

#### `robot.users()`

Get all of the stored users.

#### `robot.room(id, [attrs])`

Get or set a room by `id` with `attrs`, defaulting to a simple in-memory store.

#### `robot.rooms()`

Get all of the stored rooms.

#### `robot.data(key, [value])`

Get or set a custom piece of data by `key` with `value`, defaulting to a simple in-memory store.

#### `robot.help(trigger, description)`
  
Register a help `trigger` with a `description`, so that when the user says `@robot help` we can print out a useful list of commands, like:

    @robot shorten <url>
    Returns a shortened goo.gl for the given <url>.
    
    @robot math <string>
    Calculate the value of a <string> of math.

The trigger should just be `shorten <url>` and the `help` command will automatically add in the mention specific to the robot's configuration, eg. `@robot `.

## Debugging

Debugging ease was one of the core concerns when building Hermes. Since you need to use `stdin` in the shell for actually interacting with the robot, the typical `node debug` workflow doesn't help.

Instead, using [`node-inspector`](https://github.com/node-inspector/node-inspector) you can easily call:

    $ node-inspector &
    $ hermes --debug-brk

Like you're used to, and everything will just work.

## License

The MIT License (MIT)

Copyright &copy; 2014 Segment &lt;friends@segment.io&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.