var Controller = exports.Controller = function(name){
  this.name = name
}

//Identify the kind of the Controller to the Dispatcher
Controller.prototype.kind = "custom"

//Handle a request
Controller.prototype.handle = function(request) {
  return [200, {"Content-Type" : "text/plain"},  ["Hello World"]];
}