var Controller = require('controller').Controller
var JRPCRequest = require('controller').JRPCRequest
var Errors = require('errors').Errors

var CustomController = exports.CustomController = Object.create(Controller)

//Identify the kind of the Controller to the Dispatcher
CustomController.kind = "custom";

// Create a new concrete Controller by a given name
CustomController.define = function(_name) {
  var c = Object.create(CustomController)
  c.name = _name;
  return c
}

// Return a clone of the Controller to handle a request
//
// Ensures that values stored in the Controller are cleared during the next request
CustomController.requestInstance = function(){
  return Object.create(this);
}

// Determine the Action a GET request should serve
CustomController.getAction = function(){
  var urlparts = this.request.pathInfo().split('/')
  urlparts.shift();  //remove blank string
  urlparts.shift();  //remove Controller
  return urlparts[0] || 'index';
}

CustomController.process = function() {
  var method = this.request.requestMethod();
  if (this.actions && this.actions[this.getAction()]) {
    return this.actions[this.getAction()].apply(this)
  } else {
    throw new Errors.NotFoundError("Method " + this.getAction() + " does not exist in controller " + this.name)
  }
}
