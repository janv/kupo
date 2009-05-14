var CustomController = require('custom_controller').CustomController;
var DefaultController = CustomController.define('default');

DefaultController.actions = {
  index : function() {
    return [200, {"Content-Type" : "text/plain"}, ["Default Controller:index"]];
  }
}

exports.DefaultController = DefaultController;