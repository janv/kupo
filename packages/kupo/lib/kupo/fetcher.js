var Support = require('kupo/support').Support;
var Errors  = require('kupo/errors').Errors;

var Fetcher = exports.Fetcher = {}

/**
 * Generate an absolute filename from the type and the name of a file to be loaded
 *
 * @private
 */
var filename = function(name, type) {
  return $KUPO_HOME + '/app/' + type + "/" + name
}

/**
 * Determine the Name of the variable containing the loaded object in the
 * exports hash of the factory
 * 
 * Example: varName('foo', 'controller') = 'FooController'
 *
 * @param name {String} The name to load
 * @param type {String} The type of object to load, 'controller' for a controller, 'model' for a model
 */
var varName = function(name, type) {
  name = Support.capitalize(name)
  if (type == "controller") name += "Controller"
  return name
}

/**
 * Returns a Model or Controller
 * 
 * @private
 */
var fetch = function(name, type) {
  try {
    var fname = filename(name, type);
    var e = require(fname)
    return e[varName(name, type)]
  } catch (error) {
    throw new Errors.NotFoundError(type + " " + name + "was not found", {inner: error});
  }
}

/**
 * Check wether a model or controller exists 
 * 
 * @private
 */
var check = function(name, type) {
  try {
    var fname = filename(name, type);
    var e = require(fname)
    // print("    CHECK: " + e[varName(name,type)])
    return e[varName(name, type)] != undefined
  } catch (error) {
    // print("    CHECK: ERROR " + error)
    return false
  }
}

/** Return a controller by a given name */
Fetcher.fetchController = function(name) {
  return fetch(name, 'controller');
}

/** Return a model by a given name */
Fetcher.fetchModel = function(name) {
  return fetch(name, 'model');  
}

/** Return wether a controller with a given name exists */
Fetcher.hasController = function(name) {
  return check(name, 'controller')
}

/** Return wether a controller with a given name exists */
Fetcher.hasModel = function(name) {
  return check(name, 'model')
}