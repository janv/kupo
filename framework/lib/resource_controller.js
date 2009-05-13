var Controller = require('controller').Controller
var JRPCRequest = require('controller').JRPCRequest
var JSON = require('json')

var ResourceController = exports.ResourceController = Object.create(Controller);

ResourceController.requestInstance = function(_model){
  var r = Object.create(ResourceController);
  r.model = _model;
  return r;
}


//Identify the kind of the Controller to the Dispatcher
ResourceController.kind = "resource";

// build the simple show and index request objects if conditions are met
// else return null
// ResourceController.buildSimpleRequest = function(request) {
//   if (request.requestMethod() == 'GET') {
//     //return something that behaves like a jrprcRequest and triggers the correct methods to be called
//   } else {
//     return null;
//   };
// }

//Handle a request
/*

Methoden

GET  /model         -> Simple: Collection
                          index aufrufen
GET  /model/<int>   -> Simple: Single resource
                          show aufrufen
GET  /model/*       -> GET JRPC auf Model
                          JRPC aus request bauen (letztes segment + querystring)
GET  /model/<int>/* -> GET JRPC auf Instanz
                          Instanz laden
                          JRPC aus request bauen (letztes segment + querystring)
POST /model         -> JRPC auf Klasse
                          JRPC aus Body bauen
POST /model/<int>   -> JRPC auf Instanz
                          Instanz laden
                          JRPC aus body bauen

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
    this.target = this.model.find(id);
    var jrpcRequest = JRPCRequest.fromGET(proc, this.request)
  } else if (method == 'POST' && !id) { // POST JRPC on model
    this.target = this.model;
    var jrpcRequest = JRPCRequest.fromPOST(this.request)
  } else if (method == 'POST' && id) { // POST JRPC on instance
    this.target = this.model.find(id);
    var jrpcRequest = JRPCRequest.fromPOST(this.request)
  } else {
    return [500, {"Content-Type" : "text/plain"},  ["Unsupported Request"]];
  }
  return this.processJRPC(this.target, jrpcRequest);
  return [200, {"Content-Type" : "text/plain"},  ["Hello World from resource controller. JSON-RPC would have been executed if JSON-RPC was implemented yet"]];
};

ResourceController.processJRPC = function(target, jrpcRequest){
  if (typeof target[jrpcRequest.getMethodName()] == 'function') {
    if (this.model.rpcCallable(jrpcRequest.getMethodName())) {
      var result = jrpcRequest.call(target)
      this.model.controllerCallback(this, 'afterProcess')
      //TODO Wenn models zurückgegeben werden, diese irgendwie auspacken, nur die Daten verschicken
      return JRPCRequest.buildResponse(200, result);
    } else {
      return [500, {"Content-Type" : "text/plain"},  ["Method " + jrpcRequest.getMethodName() + " is not callable remotely on " + this.model.name]];
    }
  } else {
    return [500, {"Content-Type" : "text/plain"},  ["Method " + jrpcRequest.getMethodName() + " does not exist in model " + this.model.name]];
  }  
}

ResourceController.index = function(){
  var collection = this.model.all()
  return JRPCRequest.buildResponse(200, collection)
};

ResourceController.show  = function(id){
  var item = this.model.find(id)
  //TODO Wenn models zurückgegeben werden, diese irgendwie auspacken, nur die Daten verschicken
  return JRPCRequest.buildResponse(200, item )
};
