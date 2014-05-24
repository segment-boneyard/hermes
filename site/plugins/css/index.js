
/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * A plugin to tell Hermes to edit the CSS of the page.
 *
 * @return Function
 */

function plugin(){
  return function(robot){
    robot.help('css <string>', 'Apply a <string> of CSS to the page.');
    robot.on('mention', /css (.*)/i, function(res){
      var str = res[0];
      // todo
    });
  };
}