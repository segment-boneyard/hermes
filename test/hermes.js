
/**
 * Fail.
 */

document.body.style.backgroundColor = 'red';

/**
 * Just enough tests to make sure it works.
 */

var Hermes = window.Hermes;

if (!window.Hermes) throw 'expected a Hermes global';
if ('function' != typeof Hermes) throw 'expected Hermes to be a constructor';

var hermes = Hermes();

if (!(hermes instanceof Hermes)) throw 'expected constructor not to require new';
if (!hermes.use) throw 'expected a #use method';

var instance;
hermes.use(function(i){
  instance = i;
});

if (instance != hermes) throw 'expected plugins to be called with the instance';

/**
 * Pass.
 */

document.body.style.backgroundColor = 'green';