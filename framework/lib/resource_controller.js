var Controller = require('controller').Controller

var ResourceController = exports.ResourceController = function(_model) {
  this.model = _model
}

var RCP = ResourceController.prototype = Object.create(Controller);

//Identify the kind of the Controller to the Dispatcher
RCP.kind = "resource";
//Handle a request
RCP.handle = function(request) {
  //calll object bauen (gemeinsam für Controller/ResourceController)
    //gucken: index?
    //gucken: show?
    //sonst aus JSON-dings bauen
  //gucken: existiert die methode auf dem object?
  //methode callable freigegeben?
  return [200, {"Content-Type" : "text/plain"},  ["Hello World from resource controller"]];
}
RCP.index = function(){};
RCP.show  = function(){};
