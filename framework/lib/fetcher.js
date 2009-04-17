var Fetcher = exports.Fetcher = {}

var filename = function(name, type) {
  return $KUPO_HOME + '/app/' + type + "/" + name + ".js"
}

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

var varName = function(name, type) {
  var head = name.charAt(0).toUpperCase()
  var tail = name.slice(1)
  name = head + tail
  if (type == "controller") name += "Controller"
  return name
}

var fetch = function(name, type) {
  var fname      = filename(name, type);
  var content    = readFile(fname)
  var filemodule = evaluate(content, fname)
  var e = {}
  filemodule(require, e, environment)
  return e[varName(name, type)]
}


Fetcher.fetchController = function(name) {
  return fetch(name, 'controller');
}

Fetcher.fetchModel = function(name) {
  return fetch(name, 'model');  
}

