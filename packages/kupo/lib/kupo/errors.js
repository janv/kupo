var JRPCRequest = require('kupo/controller').JRPCRequest
var JSON = require('json') 
// var statuslist = {
//   401 : "Unauthorized",          // Authorisierung fehlgeschlagen
//   403 : "Forbidden",             // NonCallable Methods
//   404 : "Not Found",             // Datensatz oder Method nicht gefunden
//   500 : "Internal Server Error", // StandardError
//   500 : "Not Implemented"        //
// }

var Error = {
  "toJRPC" : function() {
    return JRPCRequest.buildError(this.code, {
      code: this.code,
      message: this.message,
      description: this.description
    })
  },
  
  "toHTML" : function() {
    var backtrace = (this.inner && String( (this.inner.rhinoException && this.inner.rhinoException.printStackTrace()) || (this.inner.name + ": " + this.inner.message) )) || "";
    backtrace = "<pre>"+backtrace+"</pre>"
    return [this.code, {"Content-Type" : "text/html"}, ["<h1>Error " + this.code + "</h1> " + this.message + "<br>" + this.description + "<br>" + backtrace]]
  },
  
  "to" : function(contentType) {
    if (typeof contentType == 'string' && contentType.match(/json/i)) {
      return this.toJRPC();
    } else {
      return this.toHTML();
    }
  },
  
  initDetails : function (_details) {
    this.description = (_details || {})['description'] || "";
    this.inner = (_details || {})['inner'];
    if (this.inner) {
      this.fileName = this.inner.filename;
      this.description += "\n " + this.inner.name + " - " + this.inner.message + " in " + this.inner.fileName + ":" + this.inner.lineNumber;
      this.lineNumber = this.inner.lineNumber;
    }
  },
  
  isKupoError : true
}

var Errors = exports.Errors = {}

Errors.UnauthorizedError = function(_message, _details) {
  this.name = "UnauthorizedError";
  this.message = _message || "Please authorize";
  this.code = 401;
  this.initDetails(_details);
}
Errors.UnauthorizedError.prototype = Error;

Errors.ForbiddenError = function(_message, _details) {
  this.name = "ForbiddenError";
  this.message = _message || "The procedure you tried to call doesn't exist or is not remotely available";
  this.code = 403;
  this.initDetails(_details);
}
Errors.ForbiddenError.prototype = Error;

Errors.NotFoundError = function(_message, _details) {
  this.name = "NotFoundError";
  this.message = _message || "The resource you tried to access doesn't exist or the procedure you tried to call is not available";
  this.code = 404;
  this.initDetails(_details);
}
Errors.NotFoundError.prototype = Error;

Errors.InternalError = function(_message, _details) {
  this.name = "InternalError";
  this.message = _message || "An error occured while processing your request";
  this.code = 500;
  this.initDetails(_details);
}
Errors.InternalError.prototype = Error;

Errors.NotImplementedError = function(_message, _details) {
  this.name = "NotImplementedError";
  this.message = _message || "Request Method not implemented. Please use GET or POST";
  this.code = 501;
  this.initDetails(_details);
}
Errors.NotImplementedError.prototype = Error;

Errors.wrap = function(e) {
  return new Errors.InternalError(null, {inner: e});
}
