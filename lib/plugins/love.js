
var async = require('async');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * What is love?
 *
 * @param {Robot} robot
 */

function plugin(robot){
  robot.on('overhear', 'love', function(){
    robot.say([
      "What is Love?",
      "What is this longing in our hearts for togetherness?",
      "Is it not the sweetest flower?",
      "Does not this flower of love have the fragrant aroma of fine, fine Diamonds?",
      "Does not the wind love the Dirt?",
      "Is not love not unlike the unlikely knot it is unlikened to?",
      "Are you with someone tonight?",
      "Do not question your love.",
      "Take your lover by the hand.",
      "Release the power within yourself.",
      "You heard me, release the power.",
      "Tame the wild cosmos with a whisper.",
      "Conquer heaven with one intimate caress.",
      "That's right don't be shy."
    ]);
  });
}