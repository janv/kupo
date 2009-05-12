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
  var method   = this.request.requestMethod()
  var urlparts = this.request.pathInfo().split('/')
  urlparts.shift();  //remove empty string
  urlparts.shift();  //remove model

  var id     = ((urlparts[0] || '').match(/^\d+$/) || [])[0]    
  var proc   = id ? urlparts[1] : urlparts[0]        
  
  if        (method == 'GET'  && !id && !proc) {
    return this.index();
  } else if (method == 'GET'  &&  id && !proc) {
    return this.show(id);
  } else if (method == 'GET'  && !id &&  proc) {
    // GET JRPC auf model
    this.target = this.model;
  } else if (method == 'GET'  &&  id &&  proc) {
    // GET JRPC auf instanz
    this.target = this.model.find(id);
    var x = JRPCRequest.fromGET(proc, request)
  } else if (method == 'POST' && !id) {
    // POST JRPC on model
    this.target = this.model;
  } else if (method == 'POST' && id) {
    // POST JRPC on instance
    this.target = this.model.find(id);
  } else {
    return [500, {"Content-Type" : "text/plain"},  ["Unsupported Request"]];
  }
  this.processJRPC();
  return [200, {"Content-Type" : "text/plain"},  ["Hello World from resource controller. JSON-RPC would have been executed if JSON-RPC was implemented yet"]];
};

ResourceController.processJRPC = function(){
  var r = this.buildSimpleRequest(request) || this.jrpcRequest()
  if (typeof this.model[r.getMethodName()] == 'function') {
    if (this.model.rpcCallable(r.getMethodName())) {
      //before_call_filters
      var result = this.model[r.getMethodName()].apply(this.model, r.getParameters())
      return jrpcResponse(result);
    } else {
      return [500, {"Content-Type" : "text/plain"},  ["Method " + r.getMethodName() + " is not callable remotely on " + this.model.name]];
    }
  } else {
    return [500, {"Content-Type" : "text/plain"},  ["Method " + r.getMethodName() + " does not exist in model " + this.model.name]];
  }  
}

ResourceController.index = function(){
  var collection = this.model.all()
  return JRPCRequest.buildResponse(200, {result  : collection })
};

ResourceController.show  = function(id){
  var item = this.model.find(id)
  return JRPCRequest.buildResponse(200, {result  : item })
};
