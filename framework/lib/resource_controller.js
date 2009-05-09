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
ResourceController.buildSimpleRequest = function(request) {
  if (request.requestMethod() == 'GET') {
    //return something that behaves like a jrprcRequest and triggers the correct methods to be called
  } else {
    return null;
  };
}

//Handle a request
/*

Methoden

GET  /model/all   -> Simple: Collection
GET  /model/<int> -> Simple: Single resource
GET  /model/*     -> GET JRPC auf Model
GET  /model/int/* -> GET JRPC auf Instanz
POST /model       -> JRPC auf Klasse
POST /model/<int> -> JRPC auf Instanz


*/

ResourceController.process = function() {
  //gucken: existiert die methode auf dem object?
  //methode callable freigegeben?
  return [200, {"Content-Type" : "text/plain"},  ["Hello World from resource controller"]];
};

ResourceController.index = function(){
  //build list and return as JSON response
};

ResourceController.show  = function(){
  //fetch single and return as JSON response
};
