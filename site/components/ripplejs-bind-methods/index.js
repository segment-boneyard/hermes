module.exports = function(View) {
  View.created(function(){
    for(var key in this) {
      if(typeof this[key] === 'function') this[key] = this[key].bind(this);
    }
  });
};