var Request = require('jack/request').Request;
var Fetcher = require('fetcher').Fetcher
var ResourceController = require('resource_controller').ResourceController;

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
  if (hasController(controllerName)) {
    var controller = fetchController(controllerName).requestInstance()
  } else if (hasModel(controllerName)) {
    var model = fetchModel(controllerName)
    var controller = ResourceController.requestInstance(model)
  } else {
    return [500, {"Content-Type" : "text/plain"},  ["No model or controller found for " + controllerName]];
  }
  try {
    //handle
    return controller.handle(request)
  } catch (error) {
    return [500, {"Content-Type" : "text/plain"},  [error]];
  }
}

var fetchController = function(controllerName) {
  if (DispatcherDB.controllers[controllerName] == undefined) {
    DispatcherDB.controllers[controllerName] = Fetcher.fetchController(controllerName);
  }
  return DispatcherDB.controllers[controllerName];
}

var fetchModel = function(modelName) {
  if (DispatcherDB.models[modelName] == undefined) {
    DispatcherDB.models[modelName] = Fetcher.fetchModel(modelName);
  }
  return DispatcherDB.models[modelName];
}

var hasController = function(controllerName) {
  return (DispatcherDB.controllers[controllerName] != undefined
        || Fetcher.hasController(controllerName))
}

var hasModel = function(modelName) {
  print("HasModel" + modelName)
  print("  DispatcherDB.models[modelName] != undefined: " + (DispatcherDB.models[modelName] != undefined))
  print("  Fetcher.hasModel(modelName): " + (Fetcher.hasModel(modelName)))
  return (DispatcherDB.models[modelName] != undefined
        || Fetcher.hasModel(modelName))
}
