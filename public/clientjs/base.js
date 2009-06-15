//Initialize global
global = window;

evalGlobal= {};
system = {
  global: global,
  evalGlobal: evalGlobal,
  platform: 'browser',
  platforms: ['browser', 'default'],
  print: console.debug,
  fs: {
      read: function(url) {
        var retval = null;
        $.ajax({url:url, async: false, success: function(data){
          retval = data
        }});
        return retval;
      },
      isFile: function(url) {
        var retval = null;
        $.ajax({url:url, async: false, complete: function(xhr, status){
          retval = (xhr.status == 200 && xhr.getResponseHeader("Content-Type") == 'application/x-javascript')
        }});
        return retval;
      }
  },
  prefix: '/js',
  evaluate: function (text, name, lineNo) {
    var x = null;
    return eval("x = function(require,exports,module,system,print){" + text + "\n// */\n}");
    return x;
  }
}

// Initilaize global require

// equivalent to "var sandbox = require('sandbox');"
var sandboxPath = system.prefix + "/sandbox.js";
var sandboxFactory = system.evaluate(
    system.fs.read(sandboxPath),
    "sandbox.js",
    1
);
var sandbox = {};
var sandboxModule = {id: 'sandbox', path: sandboxPath};
sandboxFactory(
    null, // require
    sandbox, // exports
    sandboxModule, // module
    system, // system
    system.print // print
);

// construct the initial paths
var paths = [];
paths.push(system.prefix);

// create the primary Loader and Sandbox:
var loader = sandbox.MultiLoader({paths: paths});
var modules = {system: system, sandbox: sandbox};
global.require = sandbox.Sandbox({loader: loader, modules: modules});
