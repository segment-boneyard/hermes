exports.get = function(obj, path) {
  var parts = path.split('.');
  var value = obj;
  while(parts.length) {
    var part = parts.shift();
    value = value[part];
    if(value === undefined) parts.length = 0;
  }
  return value;
};

exports.set = function(obj, path, value) {
  var parts = path.split('.');
  var target = obj;
  var last = parts.pop();
  while(parts.length) {
    part = parts.shift();
    if(!target[part]) target[part] = {};
    target = target[part];
  }
  target[last] = value;
};