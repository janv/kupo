var CustomController = require('custom_controller').CustomController;
var FooController = new CustomController('foo');
FooController.xxx = "yyy";

exports.FooController = FooController;