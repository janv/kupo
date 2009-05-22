var CustomController = require('kupo/custom_controller').CustomController;
var FooController = CustomController.define('foo');
FooController.xxx = "yyy";

FooController.actions = {
  index : function() {
    return [200, {"Content-Type" : "text/plain"}, ["Hello from FooController.index"]];
  },

  bar : function() {
    x = this.request.GET('x')
    return [200, {"Content-Type" : "text/plain"}, ["Hello from FooController.bar: " + x]];
  }
}

exports.FooController = FooController;