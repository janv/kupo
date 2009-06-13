/** A global reference to the Kupo home directory */
global.$KUPO_HOME = require('file').absolute('.');

/** Console Pretty printer */
global.pp = function (x) {
  print(require('test/jsdump').jsDump.parse(x))
}

var serverLoader = require('sandbox').Loader({
  paths      : require.loader.loader.paths,
  extensions : ['','.server.js']
})
require.loader.loaders.push(['.server.js', serverLoader]);
require.loader.loaders.reverse();

//Require the Kupo Loader
var Dispatcher = require('kupo/dispatcher').Dispatcher

exports.app = Dispatcher.handle

exports.development = function(app) {
  return require("jack/commonlogger").CommonLogger(
    require("jack/showexceptions").ShowExceptions(
      require("jack/lint").Lint(
        require("jack/contentlength").ContentLength(app))));
}
