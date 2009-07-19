var Controller = require('kupo/controller').Controller
var JRPCRequest = require('kupo/jrpc').JRPCRequest
var Errors = require('kupo/errors').Errors
var Support = require('kupo/support').Support;

/**
 * Base class for custom controllers
 * @class
 */
var CustomController = exports.CustomController = Support.clone(Controller)

/** Identify the kind of the Controller to the Dispatcher */
CustomController.kind = "custom";

/**
 * Create a new concrete Controller by a given name
 * The name has to match the name of the file the controller is defined in.
 * The result has to be assigned to a capitalized export with the same name in that file.
 * 
 * @constructor
 */
CustomController.define = function(_name) {
  var c = Support.clone(CustomController)
  c.name = _name;
  return c
}

/**
 * Return a clone of the Controller to handle a request
 * Ensures that values stored in the Controller are cleared during the next request
 */
CustomController.requestInstance = function(){
  return Support.clone(this);
}

/**
 * Generate a JRPC object for the Request
 *
 * @private
 */
CustomController.createRequest = function() {
  var method   = this.request.requestMethod();
  var urlparts = this.request.pathInfo().split('/');
  urlparts.shift();   //remove empty string
  urlparts.shift();   //remove controller
  var action   = ((urlparts[0] || '').match(/^\w+$/i) || [])[0];
  action = action || 'index'

  if        (method == 'GET' ) { // simple index action
    return JRPCRequest.fromGET(action, this.request);
  } else if (method == 'POST') { // simple show/fetch action
    return JRPCRequest.fromPOST(this.request);
  } else {
      throw new Errors.NotImplementedError()
  }
}

/**
 * Process the request.
 * Called in Controller.handle, do not call by yourself
 * 
 * @private
 */
CustomController.process = function() {
  var jr = this.createRequest();
  
  var methodName = jr.getMethodName()
  if (this[methodName] != null && typeof this[methodName] == 'function') {
    return jr.call(this);
  } else {
    throw new Errors.NotFoundError("Unknown action " + methodName + " in controller " + this.name);
  }
}
