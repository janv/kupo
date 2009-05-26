var Support = exports.Support = {};

/**
 * Clone an object, creating an object that has the original object as its prototype
 */
Support.clone = function(object) {
  var F = function(){};
  F.prototype = object;
  return new F();
}

