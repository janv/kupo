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
}

JRPCRequest.fromGET = function(methodName, request){
  var r = new JRPCRequest(request);
  r.methodName = methodName;
  // TODO Bug im Simpleserver. Keine Arrays unterstützt
  r.parameters = request.GET();
  return r;
}

JRPCRequest.fromPOST = function(request){
  var r = new JRPCRequest(request);
  var call = JSON.parse(request.body());
  r.methodName = call.method;
  r.parameters = call.params
  return r;
}


JRPCRequest.prototype = {
  getMethodName : function() {
    return this.methodName
  },
  getParameters : function() {
    var retval = []
    for(key in this.parameters) {
      retval.push(this.parameters[key])
    }
    return retval;
  },
  getNamedParameters : function() {
    return this.parameters
  },
  call : function(target) {
    return target[this.methodName].apply(target, this.getParameters())
    //maybe return JRPCResponse
  }
}

JRPCRequest.buildResponse = function(status, stuff) {
  var r = {};
  for (x in stuff) {
    r[x] = stuff[x];
  }
  r.version = "1.1"
  return [status, {"Content-Type" : "text/plain"}, [JSON.stringify(r)]]
}