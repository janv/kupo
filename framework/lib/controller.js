var Controller = exports.Controller = function(name){
  this.name = name
}

//Identify the kind of the Controller to the Dispatcher
controller.prototype.kind = "custom"

//Handle a request
controller.prototype.handle = function(request) {
  
}