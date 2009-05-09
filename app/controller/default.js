var CustomController = require('custom_controller').CustomController;
var DefaultController = CustomController.define('default');

// Die konkreten Controller dürfen process _eigentlich_ nicht überschreiben
DefaultController.process = function() {
  return [200, {"Content-Type" : "text/plain"},  ["Default Controller:index"]];
}

exports.DefaultController = DefaultController;