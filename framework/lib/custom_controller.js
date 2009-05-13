var Controller = require('controller').Controller
var JRPCRequest = require('controller').JRPCRequest

var CustomController = exports.CustomController = Object.create(Controller)

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

//Identify the kind of the Controller to the Dispatcher
CustomController.kind = "custom";

CustomController.getAction = function(){
  var urlparts = this.request.pathInfo().split('/')
  urlparts.shift();  //remove blank string
  urlparts.shift();  //remove Controller
  return urlparts[0] || 'index';
}
/*

Methoden:

/cont     immer zu index geroutet
/cont/act GET-call mit parametern auf act
/cont/act POST checken ob json-rpc oder gewöhnlicher post

*/

CustomController.process = function() {
  var r = JRPCRequest.fromGET(this.getAction(), this.request);
  if (typeof this[r.getMethodName()] == 'function') {
    var result = r.call(this)
    return JRPCRequest.buildResponse(200, result);
  } else {
    return [500, {"Content-Type" : "text/plain"},  ["Method " + r.getMethodName() + " does not exist in controller " + this.name]];
  }
}
