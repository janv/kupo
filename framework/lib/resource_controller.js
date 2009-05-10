var Controller = require('controller').Controller
var JSRPCRequest = require('controller').JSRPCRequest

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
  var idOrAction = urlparts[0];
  var jrpcGetAction  = urlparts[1];
  if (method == 'GET') {
    if (!idOrAction) {
      //call index
      return this.index();
    } else if (idOrAction.match(/\d+/) ) {
      if (jrpcGetAction) {
        this.modelInstance = null; //TODO: replace by actual instance fetching
        //GET-JRPC on instance
      } else {
        //call show
        return this.show(idOrAction);
      }
    } else {
      //GET-JRPC on model
    }
  } else if (method == 'POST') {
    if (!idOrAction) {
      // POST-JRPC on Class
    } else if (idOrAction.match(/\d+/)) {
      //POST-JRPC on Model
    } else {
      return [500, {"Content-Type" : "text/plain"},  ["Unsupported Request. POST requests have to target the model (/<model>) oder an indexed instance (/<model>/<int>)"]];
    }
  } else {
    return [500, {"Content-Type" : "text/plain"},  ["Unsupported HTTP Method. Try GET or POST."]];
  }
  //if we haven't returned yet, a JSON-RPC request was prepared. execute it!
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
  //build list and return as JSON response
  return [200, {"Content-Type" : "text/plain"},  ["Hello World from resource controller." + this.model.name + " index"]];
};

ResourceController.show  = function(id){
  //fetch single and return as JSON response
  return [200, {"Content-Type" : "text/plain"},  ["Hello World from resource controller." + this.model.name + " show " + id]];
};
