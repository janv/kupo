var Fetcher = exports.Fetcher = {}

//TODO: Deprecated, replace by proper Error from errors.js
var FetchError = function(_name, _type){
  this.name = _name;
  this.type = _type
}

//TODO: Deprecated, replace by proper Error from errors.js
FetchError.prototype.message = function() {
  if (this.type == 'controller')
    return "Controller " + this.name + " was not found"
  else if (this.type == 'model')
    return "Model " + this.name + " was not found"
  else
    return this.name + " was not found"
}

/**
 * Generate an absolute filename from the type and the name of a file to be loaded
 *
 * @private
 */
var filename = function(name, type) {
  return $KUPO_HOME + '/app/' + type + "/" + name + ".js"
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
  var head = name.charAt(0).toUpperCase()
  var tail = name.slice(1)
  name = head + tail
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
    throw new FetchError(name, type)
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
    print("    CHECK: ERROR " + error)
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