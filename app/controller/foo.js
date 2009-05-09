var CustomController = require('custom_controller').CustomController;
var FooController = CustomController.define('foo');
FooController.xxx = "yyy";

exports.FooController = FooController;