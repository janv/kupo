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
        beforeSend: function(xhr) {xhr.setRequestHeader("Accept", "application/json")},
        complete: function(xhr, textStatus){
          response = xhr.responseText;
        }
    });
    }
    
    if (response == null) {
      throw new Error("Error making JRPC call (response = null)");
    } else {
      response = JSON.parse(response);
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