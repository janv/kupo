var JSON = require('json');

/**
 * A clientside JSON-RPC connection that can be used to send messages to a server
 * 
 * @param url               URL of the service
 * @param connectionOptions An object. Currently no options are supported
 */
var JRPCConnection = exports.JRPCConnection = function(url, connectionOptions) {
  connectionOptions = connectionOptions || {};
  
  /** Create a new JRPCConnection for a model instance, identified by an ID */
  this.onId = function(id) {
    return new JRPCConnection(url + '/' + id, connectionOptions);
  }
  
  /** Call a method remotely with named parameters */
  this.callNamed = function(procedure, parameters) {
    if (typeof parameters == 'object') {
      return this.callInternal(procedure, parameters);
    } else {
      throw new Error("Please pass named parameters")
    }
  }
  
  /** Call a method remotely with ordered parameters */
  this.call = function(procedure, parameters) {
    if (parameters instanceof Array) {
      return this.callInternal(procedure, parameters);
    } else if (parameters === null || parameters === undefined) {
      // don't add params
      return this.callInternal(procedure);
    } else {
      //single value, wrap in array
      return this.callInternal(procedure, [parameters]);
    }
  }
  
  /**
   * After the parameters have been converted in call or callNamed,
   * callInternal is used to actually perform the call.
   * 
   * Requires jQuery and Firebug
   * @private
   */
  this.callInternal  = function(procedure, parameters){
    console.group("Making Ajax Call to %s, calling '%s' with %o", url, procedure, parameters);
    var response = null;

    if (connectionOptions.method == 'GET') {
      throw new Error("GET JSON-RPC not implemented")
    } else {
      var request = {
        method: procedure,
        version: "1.1"
      }

      if (parameters === null || parameters === undefined) {
        // don't add params
      } else {
        request.params = parameters;
      }
      console.debug("Request: %o", request);

      $.ajax({
        type: 'POST',
        url:url,
        data: JSON.stringify(request), 
        async: false,
        beforeSend: function(xhr) {
          console.debug("RequestText: %o", JSON.stringify(request));
          console.debug("XHR: %o", xhr);
          xhr.setRequestHeader("Accept", "application/json");
        },
        complete: function(xhr, textStatus){
          response = xhr.responseText;
          console.debug("ResponseText: %o", response);
        }
    });
    }
    
    if (response == null) {
      console.groupEnd();
      throw new Error("Error making JRPC call (response = null)");
    } else {
      response = JSON.parse(response);
      console.debug("Parsed Response: %o", response);
      console.groupEnd();
      if (response.error) {
        var e = new Error(response.error.message);
        for (var x in response.error) {
          e[x] = response.error[x];
        }
        throw e;
      }
      return response.result;
    }
    
  }
}