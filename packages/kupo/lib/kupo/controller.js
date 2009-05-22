var JSON   = require('json')
var Errors = require('kupo/errors').Errors

var Controller = exports.Controller = {
  //Stores the Jack Request
  request : null,
  cookies : null,
  session : null,
  
  //Cookies
  cookiesLoad : function() {
    var crappyCookies = this.request.cookies();
    this.cookies = {}
    for (var key in crappyCookies) {
      this.cookies[key.match(/^ *(.*)/)[1]] = crappyCookies[key]
    }
  },
  
  cookiesStore : function() {
    var pairs = []
    for(var key in this.cookies) {
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(this.cookies[key].toString())) 
    }
    this.response[1]["Set-Cookie"] = pairs.join(", ")
  },

  //Sessionstuff
  sessionSetup : function() {
    if (this.cookies['kupo_session']) {
      this.session = JSON.decode(this.cookies['kupo_session']);
    } else {
      this.session = {}
    }
  },
  
  sessionTeardown : function() {
    this.cookies['kupo_session'] = JSON.stringify(this.session);
  },
  
  handle : function(_request) {
    try {
      this.request = _request;
      this.cookiesLoad();
      this.sessionSetup();
      //handler des erbenden controllers aufrufen
      this.response = this.process();
      this.sessionTeardown();
      this.cookiesStore();
      this.request = null;
      return this.response;      
    } catch (e) {
      if (!e.isKupoError) { e = Errors.wrap(e); }
      return e.to(this.request.contentType());
    }
  }
}


var JRPCRequest = exports.JRPCRequest = function(request) {}

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

JRPCRequest.buildError = function(status, error) {
  var r = {};
  r.error = error
  r.version = "1.1"
  return [status, {"Content-Type" : "text/plain"}, [JSON.stringify(r)]]
}