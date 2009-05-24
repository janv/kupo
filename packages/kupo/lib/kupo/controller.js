var JSON   = require('json')
var Errors = require('kupo/errors').Errors

/**
 * Base class for Custom- and ResourceController
 * @class
 */
var Controller = exports.Controller = {
  /** Stores the Jack Request */
  request : null,
  /** Stores the Cookies */
  cookies : null,
  /** Stores the Session */
  session : null,
  
  //Cookies
  /** Extract the Cookies from the request and store them in the Controller instance */
  cookiesLoad : function() {
    var crappyCookies = this.request.cookies();
    this.cookies = {}
    for (var key in crappyCookies) {
      this.cookies[key.match(/^ *(.*)/)[1]] = crappyCookies[key]
    }
  },
  
  /** Modify the response so the cookies are stored to the client */
  cookiesStore : function() {
    var pairs = []
    for(var key in this.cookies) {
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(this.cookies[key].toString())) 
    }
    this.response[1]["Set-Cookie"] = pairs.join(", ")
  },

  //Sessionstuff
  /** Extract the session from the cookies and store it in this.session */
  sessionSetup : function() {
    if (this.cookies['kupo_session']) {
      this.session = JSON.decode(this.cookies['kupo_session']);
    } else {
      this.session = {}
    }
  },
  
  /** Store the session in a cookie */
  sessionTeardown : function() {
    this.cookies['kupo_session'] = JSON.stringify(this.session);
  },
  
  /** Handle a Jack request */
  handle : function(_request) {
    try {
      this.request = _request;
      this.cookiesLoad();
      this.sessionSetup();
      
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

/**
 * Wrapper for JRPCRequests, provinding some convenience
 * @private
 */
var JRPCRequest = exports.JRPCRequest = function(request) {}

/**
 * Create a JRPCRequest from a GET request
 *
 * @param methodName the Method to call
 * @param request    the Jack request
 * @constructor
 */
JRPCRequest.fromGET = function(methodName, request){
  var r = new JRPCRequest(request);
  r.methodName = methodName;
  // TODO Bug im Simpleserver. Keine Arrays unterstützt
  r.parameters = request.GET();
  return r;
}

/**
 * Create a JRPCRequest from a POST request
 *
 * @param request    the Jack request
 * @constructor
 */
JRPCRequest.fromPOST = function(request){
  var r = new JRPCRequest(request);
  var call = JSON.parse(request.body());
  r.methodName = call.method;
  r.parameters = call.params
  return r;
}


JRPCRequest.prototype = {
  /** The method that should be called */
  getMethodName : function() {
    return this.methodName
  },

  /** The method parameters as an array */
  getParameters : function() {
    var retval = []
    for(key in this.parameters) {
      retval.push(this.parameters[key])
    }
    return retval;
  },

  /** The method parameters as an object */
  getNamedParameters : function() {
    return this.parameters
  },

  /** Call the requested method on the target with the provided parameters */
  call : function(target) {
    return target[this.methodName].apply(target, this.getParameters())
    //maybe return JRPCResponse
  }
}

/**
 * Build a JRPC Response containting a result
 *
 * @param status The status of the response
 * @param result The result of the call that should be returned to the client
 */
JRPCRequest.buildResponse = function(status, result) {
  var r = {};
  r.result = result;
  r.version = "1.1";
  return [status, {"Content-Type" : "text/plain"}, [JSON.stringify(r)]];
}

/**
 * Build a JRPC Error-Response
 *
 * @param status The status of the response
 * @param error  An object or string describing the error
 */
JRPCRequest.buildError = function(status, error) {
  var r = {};
  r.error = error
  r.version = "1.1"
  return [status, {"Content-Type" : "text/plain"}, [JSON.stringify(r)]]
}