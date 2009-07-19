var CustomController = require('kupo/custom_controller').CustomController;
var DefaultController = CustomController.define('default');

DefaultController.index = function() {
  return [200, {"Content-Type" : "text/plain"}, ["Default Controller:index"]];
}

exports.DefaultController = DefaultController;