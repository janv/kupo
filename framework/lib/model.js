var Model = exports.Model = function(name){
  this.name = name
}

Model.prototype.rpcCallable = function(name){
  //return wether the named function is RPC-callable.
  return true;
}

Model.prototype.beforeCallFilters = function(controller, method, parameters){
  // this.beforeCall.apply(controller)   // beforeCall als generic filter
  // einen methodspezifischen filter
  
}