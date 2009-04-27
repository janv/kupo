var Request = require('jack/request').Request;
var Fetcher = require('fetcher').Fetcher

var Dispatcher = exports.Dispatcher = {}

var DispatcherDB = {
  controllers : {},
  models : {}
};

Dispatcher.handle = function(env) {
  var request = new Request(env);
  //resolve
  var path = request.pathInfo().split('/');
  var controllerName = path[1] || 'default'
  var actionName     = path[2] || 'index'
  try {
    var controller = fetchController(controllerName)
    //handle
    return controller.handle(request)
  } catch (error) {
    return [500, {"Content-Type" : "text/plain"},  [error.message()]];
  }
}

var fetchController = function(controllerName) {
  if (DispatcherDB.controllers[controllerName] == undefined) {
    DispatcherDB.controllers[controllerName] = Fetcher.fetchController(controllerName);
  }
  return DispatcherDB.controllers[controllerName];
}