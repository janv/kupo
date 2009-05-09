var JSON = require('json')
//Controller gemeinsamkeiten hier rein:
// JSON bauen

var Controller = exports.Controller = {
  //Stores the Jack Request
  request : null,
  
  jrpcRequest : function() {
    // memoize/create JRPCrequest from this.request
  },
  
  jrpcResponse : function(value){
    //create Reponse-Array for Jack from Value
  },

  //Sessionstuff
  // ...

  handle : function(_request) {
    //mit request und sessionkram und so initialisieren
    this.request = _request;
    //handler des erbenden controllers aufrufen
    var response = this.process();
    //dessen antwort noch ggf modifizieren, session usw. abbauen
    this.request = null;
    //antwort zurückgeben
    return response;
  },
  
  // process prepared request
  //
  // should be overwritten in custom_controller and resource_controller but not
  // further down the inheritance chain
  process : function() {
    return [200, {"Content-Type" : "text/plain"},  ["Hello World from controller. This should have been overwritten"]];
  }
}


var JRPCRequest = exports.JRPCRequest = function(request) {
  if (request.requestMethod == 'GET') {
    this.methodName = request.pathInfo().split('/')[2] || 'index'
    //TODO: Parameter zuweisen
  } else if (request.requestMethod == 'POST') {
    //complicated stuff, JSON decode etc
  }  
}

JRPCRequest.prototype = {
  getMethodName : function() {
    return this.methodName
  },
  getParameters : function() {
    //return parameters as Array
  },
  getNamedParameters : function() {
    //return parameters as Object
  },
  call : function(target) {
    //call this method on a target
    //maybe return JRPCResponse or just the targets return value
  }
}