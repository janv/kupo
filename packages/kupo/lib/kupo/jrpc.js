var JSON = require('json');
/**
 * Wrapper for JRPCRequests, provinding some convenience
 * @private
 */
var JRPCRequest = exports.JRPCRequest = function(method, params) {
  this.methodName = method;
  this.parameters = params;
}

/**
 * Create a JRPCRequest from a GET request
 *
 * @param methodName the Method to call
 * @param request    the Jack request
 * @constructor
 */
JRPCRequest.fromGET = function(methodName, request){
  return new JRPCRequest(methodName, request.GET());
}

/**
 * Create a JRPCRequest from a POST request
 *
 * @param request    the Jack request
 * @constructor
 */
JRPCRequest.fromPOST = function(request){
  print("Creating JRPC-Request from POST")
  if (request.body().read) {
    var call = JSON.parse(request.body().read().decodeToString());
    print("   call: " + request.body().read().decodeToString());
  } else {
    var call = JSON.parse(request.body());
    print("   call: " + request.body());
  }
  print("   method: " + call.method);
  print("   call: " + JSON.stringify(call.params));
  return new JRPCRequest(call.method, call.params);
}


JRPCRequest.prototype = {
  /** The method that should be called */
  getMethodName : function() {
    return this.methodName
  },

  /**
   * The method parameters as an array
   *
   * Returns null if no parameters were provided
   */
  getParameters : function() {
    if (this.parameters != null && this.parameters != undefined) {
      if (this.parameters instanceof Array) {
        return this.parameters;
      } else  if (typeof this.parameters == 'object'){
        var retval = [];
        for(key in this.parameters) {
          retval.push(this.parameters[key]);
        }
        return retval;
      } else {
        throw new Errors.InternalError("params neither Array nor object but " + this.parameters);
      }
    } else {
      return null;
    }
  },

  /**
   * The method parameters as an object
   * 
   * Returns null if no parameters were provided
   */
  getNamedParameters : function() {
    if (this.parameters != null && this.parameters != undefined) {
      if (this.parameters instanceof Array) {
        retval = {};
        for (var i=0; i < this.parameters.length; i++) {
          retval[i] = this.parameters[i];
        };
        return retval;
      } else if (typeof this.parameters == 'object'){
        return this.parameters;
      } else {
        throw new Errors.InternalError("params neither Array nor object but " + this.parameters);
      }
    } else {
      return null;
    }
  },

  /** Call the requested method on the target with the provided parameters */
  call : function(target) {
    print("Calling JRPCRequest")
    print("   method: " + this.methodName);
    print("   parameters: " + JSON.stringify(this.getParameters()));
    
    if (this.getParameters() != null && this.getParameters() != undefined) {
      return target[this.methodName].apply(target, this.getParameters())
    } else {
      return target[this.methodName].apply(target)
    }
    //maybe return JRPCResponse
  }
}

/**
 * Build a JRPC Response containting a result
 *
 * @param status The status of the response
 * @param result The result of the call that should be returned to the client
 */
JRPCRequest.buildResponse = function(status, result, headers) {
  headers = headers || {};
  headers["Content-Type"] = headers["Content-Type"] || 'application/json'
  
  var r = {};
  r.result = result;
  r.version = "1.1";
  return [status, headers, [JSON.stringify(r)]];
}

/**
 * Build a JRPC Error-Response
 *
 * @param status The status of the response
 * @param error  An object or string describing the error
 */
JRPCRequest.buildError = function(error, status, headers) {
  headers = headers || {};
  headers["Content-Type"] = headers["Content-Type"] || 'application/json'

  var r = {version: '1.1'};
  if (error.isKupoError) {
    r.error = {
      name: error.name,
      code: error.code || status || 000,
      message: error.message,
      description: error.description,
      error : error.backtrace()
    }
  } else if (error.name) {
    r.error = {
      name: error.name,
      code: status || 000,
      message: error.message || "",
      error: error
    };
  }
  return [status, headers, [JSON.stringify(r)]]
}
