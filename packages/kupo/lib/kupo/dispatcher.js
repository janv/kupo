var Request = require('jack/request').Request;
var Fetcher = require('kupo/fetcher').Fetcher
var ResourceController = require('kupo/resource_controller').ResourceController;

var Dispatcher = exports.Dispatcher = {}

/**
 * The Dispatcher Database containing loaded models and custom controllers
 *
 * @deprecated TODO: deprecated, same functionality provided by sandbox
 * @private
 */
var DispatcherDB = {
  controllers : {},
  models : {}
};

/**
 * Deliver files to the client
 */
serveFile = require("jack/file").File($KUPO_HOME + '/public')

/**
 * Main Jack request handler.
 *
 * @param   env A Jack request environment
 * @returns {Array} A Jack response array
 */
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
    return serveFile(env);
  }
  try {
    //handle
    return controller.handle(request)
  } catch (error) {
    return [500, {"Content-Type" : "text/plain"},  [error.toString(), error.fileName, error.lineNumber.toString()]];
  }
}

/**
 * Load a controller by name
 * @private
 */
var fetchController = function(controllerName) {
  if (DispatcherDB.controllers[controllerName] == undefined) {
    DispatcherDB.controllers[controllerName] = Fetcher.fetchController(controllerName);
  }
  return DispatcherDB.controllers[controllerName];
}

/**
 * Load a model by name
 * @private
 */
var fetchModel = function(modelName) {
  if (DispatcherDB.models[modelName] == undefined) {
    DispatcherDB.models[modelName] = Fetcher.fetchModel(modelName);
  }
  return DispatcherDB.models[modelName];
}

/**
 * Check that a controller exists
 * @private
 */
var hasController = function(controllerName) {
  return (DispatcherDB.controllers[controllerName] != undefined
        || Fetcher.hasController(controllerName))
}

/**
 * Check that a model exists
 * @private
 */
var hasModel = function(modelName) {
  print("HasModel" + modelName)
  print("  DispatcherDB.models["+modelName+"] != undefined: " + (DispatcherDB.models[modelName] != undefined))
  print("  Fetcher.hasModel(\""+modelName+"\"): " + (Fetcher.hasModel(modelName)))
  return (DispatcherDB.models[modelName] != undefined
        || Fetcher.hasModel(modelName))
}
