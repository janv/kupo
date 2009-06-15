var Request = require('jack/request').Request;
var Fetcher = require('kupo/fetcher').Fetcher
var ResourceController = require('kupo/resource_controller').ResourceController;
var Errors = require('kupo/errors').Errors;

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
  try {
    var request = new Request(env);
    if (request.pathInfo().match(/^\/js/)) {
      // deliver Javascript
      return deliverJavascript(request);
    } else {
      //resolve
      var path = request.pathInfo().split('/');
      var controllerName = path[1] || 'default'
      var actionName     = path[2] || 'index'
      if (hasController(controllerName)) {
        //invoke controller
        var controller = fetchController(controllerName).requestInstance()
      } else if (hasModel(controllerName)) {
        //invoke resource controller
        var model = fetchModel(controllerName)
        var controller = ResourceController.requestInstance(model)
      } else {
        //deliver static file
        return serveFile(env);
      }
    }
    //handle
    return controller.handle(request)
  } catch (e) {
    if (!e.isKupoError) { e = Errors.wrap(e); }
    return e.to(request.contentType());
  }
}

var deliverJavascript = function(request) {
  var loader = require('sandbox').Loader({
    paths : [$KUPO_HOME + '/app', $KUPO_HOME + '/packages/kupo/lib'].concat(require.paths)
  });
  var id = request.pathInfo().match(/^\/js\/*(.*)/)[1];
  id = loader.resolve(id, '');
  if (id.match(/\.server\.js$/)) {
    throw new Errors.ForbiddenError("Server-only modules are not accessible")
  } else if (id.match(/^controller\/|\.server\.js$/)) {
    throw new Errors.ForbiddenError("Controllers are not accessible")
  } else {
    try {
      var text = loader.fetch(id)
      return [200, {"Content-Type" : "application/x-javascript"}, [text]];
    } catch (e) {
      if (e.message.match(/require error: couldn't find/)) {
        throw new Errors.NotFoundError("Module not found", {inner:e})
      } else {
        throw e
      }
    }
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
  // print("HasModel" + modelName)
  // print("  DispatcherDB.models["+modelName+"] != undefined: " + (DispatcherDB.models[modelName] != undefined))
  // print("  Fetcher.hasModel(\""+modelName+"\"): " + (Fetcher.hasModel(modelName)))
  return (DispatcherDB.models[modelName] != undefined
        || Fetcher.hasModel(modelName))
}
