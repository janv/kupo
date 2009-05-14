var CustomController = require('custom_controller').CustomController;
var FooController = CustomController.define('foo');
FooController.xxx = "yyy";

FooController.actions = {
  index : function() {
    return "Hello from FooController.index"
  },

  bar : function(x) {
    return "Hello from FooController.bar: " + x
  }
}

exports.FooController = FooController;