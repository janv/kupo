var Fetcher = exports.Fetcher = {}

/* Generate an absolute filename from the type and the name of a file to be loaded */
var filename = function(name, type) {
  return $KUPO_HOME + '/app/' + type + "/" + name + ".js"
}

/* Return a factory function for the contents of a file */
var evaluate = function (text, filename) {
    if (typeof Packages !== "undefined" && Packages.java)
        return Packages.org.mozilla.javascript.Context.getCurrentContext().compileFunction(
            __global__,
            "function(require,exports,environment){"+text+"}",
            filename,
            1,
            null
        );
    else
        return new Function("require", "exports", "environment", text);
};

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
  var fname      = filename(name, type);
  var content    = readFile(fname)
  var filemodule = evaluate(content, fname)
  var e = {}
  filemodule(require, e, environment)
  return e[varName(name, type)]
}

/* Return a controller by a given name */
Fetcher.fetchController = function(name) {
  return fetch(name, 'controller');
}

/* Return a model by a given name */
Fetcher.fetchModel = function(name) {
  return fetch(name, 'model');  
}

