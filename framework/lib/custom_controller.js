var Controller = require('controller').Controller

var CustomController = exports.CustomController = function(_name) {
  this.name = _name
}

var CCP = CustomController.prototype = Object.create(Controller);

//Identify the kind of the Controller to the Dispatcher
CCP.kind = "resource";
//Handle a request
CCP.handle = function(request) {
  //calll object bauen (gemeinsam für Controller/ResourceController)
    //gucken: GET?
    //sonst aus JSON-dings bauen
  //gucken: existiert die action?
  return [200, {"Content-Type" : "text/plain"},  ["Hello World from custom controller"]];
}
