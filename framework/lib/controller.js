var JSON = require('json')

var Controller = exports.Controller = {
  //Stores the Jack Request
  request : null,
  
  cookiesLoad : function() {
    //TODO implement
  },
  
  cookiesStore : function() {
    //TODO implement
  },

  //Sessionstuff
  sessionSetup : function() {
    //TODO implement
  },
  
  sessionTeardown : function() {
    //TODO implement
  },
  
  handle : function(_request) {
    //mit request und sessionkram und so initialisieren
    this.request = _request;
    this.cookieLoad();
    this.sessionSetup();
    //handler des erbenden controllers aufrufen
    var response = this.process();
    //dessen antwort noch ggf modifizieren, session usw. abbauen
    this.sessionTeardown();
    this.cookiesStore();
    this.request = null;
    //antwort zurückgeben
    return response;
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
  r.result = stuff
  r.version = "1.1"
  return [status, {"Content-Type" : "text/plain"}, [JSON.stringify(r)]]
}