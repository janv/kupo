var Errors = require('kupo/errors').Errors

var Callbacks = exports.Callbacks = {
  
  /**
   * Generate a HTTP Basic authentication requirement filter. (beforeProcess)
   *
   * Throws a AuthenticationError if Authentication requirement are not met
   * by an incoming request.
   * 
   * @param realm Authentication realm
   * @param username Username
   * @param password Password
   */
  requireBasicLogin : function(realm, username, password) {
    return function() {
      for (var a in this.request.env) {
        print(a);
      }
      if (this.request.env['Authorization']) {
        var auth = require('base64').decode(this.request.env['Authorization']).split(':')
        if (auth[0] == username && auth[1] == password) {
          return true;
        }
      }
      throw new Errors.UnauthorizedError(null,{
        headers: {'WWW-Authenticate': 'Basic realm="'+realm+'"', "Content-Type" : "text/plain"}
      })
    }
  },
  
  /**
   * Limit a before/afterProcess callback function's applicability to
   * the given target and methods.
   *
   * @param target   Either 'model' or 'instance'.
   * @param methods  Array containing methodnames or a single string with a methodname.
   * @param callback The actual callback function.
   * 
   */
  limitTo : function(target, methods, callback){
    return function(){
      if (target == 'model'    && this.target != this.model) return;
      if (target == 'instance' && this.target == this.model) return;

      found = false;
      if (!(methods instanceof Array)) methods = [methods];
      for (var i=0; i < methods.length; i++) {
        if (methods[i] == this.jrpcRequest.getMethodName()) { found = true; break};
      };
      if (!found) return;

      callback.call(this);
    }
  }
  
  /**
   * Replace the function result with an object containing the result
   * and a timestamp (afterProcess)
   */
  timeStamp : function() {
    this.result = {
      result    : this.result,
      timestamp : (new Date()).getTime()
    }
  }
  
}

