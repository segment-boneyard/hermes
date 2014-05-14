
var assert = require('assert');
var exec = require('child_process').exec;
var format = require('util').format;
var resolve = require('path').resolve;

/**
 * Settings.
 */

var bin = resolve(__dirname, '../bin');

/**
 * Tests.
 */

describe('cli', function(){
  it('should error without a config', function(done){
    test('no-config', function(err, stdout, stderr){
      assert(err);
      assert(stderr);
      assert(~stderr.indexOf('Could not find configuration file'));
      done();
    });
  });

  it('should error if the config file has invalid json', function(done){
    test('invalid-config', function(err, stdout, stderr){
      assert(err);
      assert(stderr);
      assert(~stderr.indexOf('Unexpected end of input'));
      done();
    });
  });

  it('should set the robot\'s name', function(done){
    test('name', function(err, stdout, stderr){
      assert(err);
      assert(stdout);
      assert(~stdout.indexOf('Name: Picasso'));
      assert(~stdout.indexOf('Nickname: picasso'));
      done();
    });
  });

  it('should set the robot\'s nickname', function(done){
    test('nickname', function(err, stdout, stderr){
      assert(err);
      assert(stdout);
      assert(~stdout.indexOf('Name: Picasso'));
      assert(~stdout.indexOf('Nickname: mozart'));
      done();
    });
  });

  it('should set the robot\'s template', function(done){
    test('template', function(err, stdout, stderr){
      assert(err);
      assert(stdout);
      assert(~stdout.indexOf('Template: %s '));
      done();
    });
  });

  it('should use the repl when the flag is set');

  it('should apply a remote plugin');

  it('should apply a local plugin', function(done){
    test('local-plugin', function(err, stdout, stderr){
      assert(err);
      assert(stdout);
      assert(~stdout.indexOf('Local plugin applied!'));
      done();
    });
  });

  it('should fail on an non-existant plugin', function(done){
    test('non-existant-plugin', function(err, stdout, stderr){
      assert(err);
      assert(stderr);
      assert(~stderr.indexOf('Cannot find module'));
      done();
    });
  });
});

/**
 * Exec hermes on a `fixture`.
 *
 * @param {String} fixture
 * @param {Function} done
 */

function test(fixture, flags, done){
  if ('function' == typeof flags) done = flags, flags = '';
  var path = resolve(__dirname, 'fixtures', fixture);
  var bin = resolve(__dirname, '../bin/hermes --repl');
  var cmd = format('cd %s; %s', path, bin);
  exec(cmd, done);
}