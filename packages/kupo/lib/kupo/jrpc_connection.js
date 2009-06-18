var JSON = require('json');

var JRPCConnection = exports.JRPCConnection = function(url, connectionOptions) {
  connectionOptions = connectionOptions || {};
  
  this.onId = function(id) {
    return new JRPCConnection(url + '/' + id, connectionOptions);
  }
  
  this.call  = function(procedure, parameters, options){
    parameters = parameters || [];
    if (!(parameters instanceof Array)) parameters = [parameters]
    options = options || {};
    var response = null;

    if ((options.method || connectionOptions.method) == 'GET') {
      throw new Error("GET JSON-RPC not implemented")
    } else {
      var request = {
        method: procedure,
        version: "1.1",
        param: parameters
      }
      $.ajax({
        type: 'POST',
        url:url,
        data: JSON.stringify(request), 
        async: false,
        success: function(data){
          response = data;
        }
    });
    }

    if (response == null)
      throw new Error("Error making JRPC call (response = null)");
    if (response.hasOwnProperty('error'))
      throw new Error(response.error);
    
    return JSON.parse(response).result;
  }
}