var CustomController = require('custom_controller').CustomController;
var DefaultController = new CustomController('default');

DefaultController.handle = function(request) {
  return [200, {"Content-Type" : "text/plain"},  ["Default Controller:index"]];
}

exports.DefaultController = DefaultController;