var CustomController = require('custom_controller').CustomController;
var FooController = CustomController.define('foo');
FooController.xxx = "yyy";

FooController.index = function(){
  return "Hello from FooController.index"
}

exports.FooController = FooController;