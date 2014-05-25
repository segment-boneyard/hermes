var events = [
  'change',
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mouseenter',
  'mouseleave',
  'scroll',
  'blur',
  'focus',
  'input',
  'submit',
  'keydown',
  'keypress',
  'keyup'
];

module.exports = function(View) {
  events.forEach(function(name){
    View.directive('on-' + name, {
      update: function(fn){
        if(this.callback) {
          this.node.removeEventListener(name, this.callback, true);
        }
        this.callback = fn.bind(this.view);
        this.node.addEventListener(name, this.callback, true);
      },
      unbind: function(){
        this.node.removeEventListener(name, this.callback, true);
      }
    });
  });
};