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
 * Determine the Action a GET request should serve
 *
 * @private
 */
CustomController.getAction = function(){
  var urlparts = this.request.pathInfo().split('/')
  urlparts.shift();  //remove blank string
  urlparts.shift();  //remove Controller
  return urlparts[0] || 'index';
}

/**
 * Process the request.
 * Called in Controller.handle, do not call by yourself
 * 
 * @private
 */
CustomController.process = function() {
  var method = this.request.requestMethod();
  if (this.actions && this.actions[this.getAction()]) {
    return this.actions[this.getAction()].apply(this)
  } else {
    throw new Errors.NotFoundError("Method " + this.getAction() + " does not exist in controller " + this.name)
  }
}
