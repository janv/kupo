var Controller  = require('kupo/controller').Controller
var JRPCRequest = require('kupo/jrpc').JRPCRequest
var JSON = require('json')
var Errors = require('kupo/errors').Errors
var Support = require('kupo/support').Support;

/**
 * Base class for custom controllers
 * @class
 */
var ResourceController = exports.ResourceController = Support.clone(Controller);

/** Identify the kind of the Controller to the Dispatcher */
ResourceController.kind = "resource";

/**
 * Return a clone of the Controller to handle a request
 * Ensures that values stored in the Controller are cleared during the next request
 *
 * @param {Model} _model The model this instance should operate on
 */
ResourceController.requestInstance = function(_model){
  var r = Support.clone(ResourceController);
  r.model = _model;
  return r;
}

ResourceController.process = function() {
  this.buildRequest();
  
  this.model.callBack(this, 'beforeProcess');
  if (!this.result) { //TODO Document this behaviour
    this.executeRequest();
    this.model.callBack(this, 'afterProcess');
  }
  
  return JRPCRequest.buildResponse(200, this.result);
};

/**
 * Builds the request.
 * Called in Controller.handle, do not call by yourself
 *
 * Methods
 * 
 * GET  /model         -> Simple: Collection
 *                           call index
 * GET  /model/<int>   -> Simple: Single resource
 *                           call show
 * GET  /model/*       -> GET JRPC on Model
 *                           build JRPC from request (last segment + querystring)
 * GET  /model/<int>/* -> GET JRPC auf Instanz
 *                           load instance
 *                           build JRPC from request (last segment + querystring)
 * POST /model         -> JRPC auf Klasse
 *                           build JRPC from body
 * POST /model/<int>   -> JRPC auf Instanz
 *                           load instance
 *                           build JRPC from body
 * 
 * @private
 */
ResourceController.buildRequest = function() {
  var method   = this.request.requestMethod()
  var urlparts = this.request.pathInfo().split('/')
  urlparts.shift();  //remove empty string
  urlparts.shift();  //remove model
  var id     = ((urlparts[0] || '').match(/^[0-9a-f]{24}$/i) || [])[0] // an instance id if we have one
  var proc   = id ? urlparts[1] : urlparts[0] // the procedure to call (for GET-JRPC)
  
  if        (method == 'GET'  && !id && !proc) { // simple index action
    this.target = this.model;
    this.jrpcRequest = new JRPCRequest('all')
  } else if (method == 'GET'  &&  id && !proc) { // simple show/fetch action
    this.target = this.model;
    this.jrpcRequest = new JRPCRequest('find', [id])
  } else if (method == 'GET'  && !id &&  proc) { // GET JRPC on model
    this.target = this.model;
    this.jrpcRequest = JRPCRequest.fromGET(proc, this.request)
  } else if (method == 'GET'  &&  id &&  proc) { // GET JRPC on instance
    this.target = this.object = this.model.find(id);
    this.jrpcRequest = JRPCRequest.fromGET(proc, this.request)
  } else if (method == 'POST' && !id) { // POST JRPC on model
    this.target = this.model;
    this.jrpcRequest = JRPCRequest.fromPOST(this.request)
  } else if (method == 'POST' && id) { // POST JRPC on instance
    this.target = this.object = this.model.find(id);
    this.jrpcRequest = JRPCRequest.fromPOST(this.request)
  } else {
    throw new Errors.NotImplementedError()
  }
}

ResourceController.executeRequest = function() {
  var methodName = this.jrpcRequest.getMethodName()
  if (this.target[methodName] != null && typeof this.target[methodName] == 'function') {
    if (this.target.rpcCallable(methodName)) {
      this.result = this.jrpcRequest.call(this.target)
    } else {
      throw new Errors.ForbiddenError("Method " + methodName + " is not callable remotely on " + this.model.name)
    }
  } else {
    throw new Errors.NotFoundError("Method " + methodName + " does not exist in model " + this.model.name)
  }    
}
