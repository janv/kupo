//Controller gemeinsamkeiten hier rein:
// JSON bauen
var Controller = exports.Controller = {
  createJRPCRequest  : function(request){},
  createJRPCResponse : function(){},
  handle : function(request) {
    return [200, {"Content-Type" : "text/plain"},  ["Hello World from controller"]];
  }
}