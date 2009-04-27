var Controller = require('controller').Controller;
var DefaultController = new Controller('default');

DefaultController.handle = function(request) {
  return [200, {"Content-Type" : "text/plain"},  ["Default Controller:index"]];
}

exports.DefaultController = DefaultController;