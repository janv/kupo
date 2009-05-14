var CustomController = require('custom_controller').CustomController;
var DefaultController = CustomController.define('default');

DefaultController.actions = {
  index : function() {
    return "Default Controller:index";
  }
}

exports.DefaultController = DefaultController;