var Fetcher = exports.Fetcher = {}

var FetchError = function(_name, _type){
  this.name = _name;
  this.type = _type
}

FetchError.prototype.message = function() {
  if (this.type == 'controller')
    return "Controller " + this.name + " was not found"
  else if (this.type == 'model')
    return "Model " + this.name + " was not found"
  else
    return this.name + " was not found"
}

/* Generate an absolute filename from the type and the name of a file to be loaded */
var filename = function(name, type) {
  return $KUPO_HOME + '/app/' + type + "/" + name + ".js"
}

/* Determine the Name of the variable containing the loaded object in the
 * exports hash of the factory
 * 
 * Example: varName('foo', 'controller') = 'FooController'
 */
var varName = function(name, type) {
  var head = name.charAt(0).toUpperCase()
  var tail = name.slice(1)
  name = head + tail
  if (type == "controller") name += "Controller"
  return name
}

/* Returns a Model or Controller  */
var fetch = function(name, type) {
  try {
    var fname = filename(name, type);
    var e = require(fname)
    return e[varName(name, type)]
  } catch (error) {
    throw new FetchError(name, type)
  }
}

var check = function(name, type) {
  try {
    var fname = filename(name, type);
    var e = require(fname)
    print("    " + e[varName(name,type)])
    return e[varName(name, type)] != undefined
  } catch (error) {
    print("    " + error)
    return false
  }
}

/* Return a controller by a given name */
Fetcher.fetchController = function(name) {
  return fetch(name, 'controller');
}

/* Return a model by a given name */
Fetcher.fetchModel = function(name) {
  return fetch(name, 'model');  
}

Fetcher.hasController = function(name) {
  return check(name, 'controller')
}

Fetcher.hasModel = function(name) {
  return check(name, 'model')
}