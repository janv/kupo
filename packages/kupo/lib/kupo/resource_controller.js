var Controller  = require('kupo/controller').Controller
var JRPCRequest = require('kupo/controller').JRPCRequest
var JSON = require('json')
var Errors = require('kupo/errors').Errors

/**
 * Base class for custom controllers
 * @class
 */
var ResourceController = exports.ResourceController = Object.create(Controller);

/** Identify the kind of the Controller to the Dispatcher */
ResourceController.kind = "resource";

/**
 * Return a clone of the Controller to handle a request
 * Ensures that values stored in the Controller are cleared during the next request
 *
 * @param {Model} _model The model this instance should operate on
 */
ResourceController.requestInstance = function(_model){
  var r = Object.create(ResourceController);
  r.model = _model;
  return r;
}

/**
 * Process the request.
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
ResourceController.process = function() {
  this.model.controllerCallback(this, 'beforeProcess')
  
  var method   = this.request.requestMethod()
  var urlparts = this.request.pathInfo().split('/')
  urlparts.shift();  //remove empty string
  urlparts.shift();  //remove model
  var id     = ((urlparts[0] || '').match(/^\d+$/) || [])[0] // an instance id if we have one
  var proc   = id ? urlparts[1] : urlparts[0] // the procedure to call (for GET-JRPC)
  
  if        (method == 'GET'  && !id && !proc) { // simple index action
    return this.index();
  } else if (method == 'GET'  &&  id && !proc) { // simple show/fetch action
    return this.show(id);
  } else if (method == 'GET'  && !id &&  proc) { // GET JRPC on model
    this.target = this.model;
    var jrpcRequest = JRPCRequest.fromGET(proc, this.request)
  } else if (method == 'GET'  &&  id &&  proc) { // GET JRPC on instance
    this.target = this.object = this.model.find(id);
    var jrpcRequest = JRPCRequest.fromGET(proc, this.request)
  } else if (method == 'POST' && !id) { // POST JRPC on model
    this.target = this.model;
    var jrpcRequest = JRPCRequest.fromPOST(this.request)
  } else if (method == 'POST' && id) { // POST JRPC on instance
    this.target = this.object = this.model.find(id);
    var jrpcRequest = JRPCRequest.fromPOST(this.request)
  } else {
    throw new Errors.NotImplementedError()
  }
  return this.processJRPC(this.target, jrpcRequest);
};

/**
 * Process the request as a JRPCrequest
 * Called in process(), do not call by yourself
 * 
 * @param target The object on which to call the requested method
 * @param {JRPCRequest} jrpcRequest The JRPCRequest object to execute
 * @private
 */
ResourceController.processJRPC = function(target, jrpcRequest){
  if (typeof target[jrpcRequest.getMethodName()] == 'function') {
    if (this.model.rpcCallable(jrpcRequest.getMethodName())) {
      this.result = jrpcRequest.call(target)
      this.model.controllerCallback(this, 'afterProcess')
      //TODO Wenn models zurückgegeben werden, diese irgendwie auspacken, nur die Daten verschicken
      return JRPCRequest.buildResponse(200, this.result);
    } else {
      throw new Errors.ForbiddenError("Method " + jrpcRequest.getMethodName() + " is not callable remotely on " + this.model.name)
    }
  } else {
    throw new Errors.NotFoundError("Method " + jrpcRequest.getMethodName() + " does not exist in model " + this.model.name)
  }  
}

/**
 * The index action for retrieving a collection of instances of this model.
 * Called in process(), do not call by yourself
 * 
 * @private
 */
ResourceController.index = function(){
  if (!this.model.rpcCallable('all')) throw new Errors.ForbiddenError("Method all is not callable remotely on " + this.model.name)
  this.model.controllerCallback(this, 'beforeAll')
  this.collection = this.model.all()
  this.model.controllerCallback(this, 'afterAll')
  return JRPCRequest.buildResponse(200, this.collection)
};

/**
 * The show action for retrieving a single instances of this model.
 * Called in process(), do not call by yourself
 * 
 * @private
 */
ResourceController.show  = function(id){
  if (!this.model.rpcCallable('find')) throw new Errors.ForbiddenError("Method find is not callable remotely on " + this.model.name)
  this.model.controllerCallback(this, 'beforeFind')
  this.object = this.model.find(id)
  this.model.controllerCallback(this, 'afterFind')
  return JRPCRequest.buildResponse(200, this.object ) //TODO Wenn models zurückgegeben werden, diese irgendwie auspacken, nur die Daten verschicken
};
