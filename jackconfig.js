global.$KUPO_HOME = require("dir").pwd()

//Prepare debug helpers
var Util = require('./packages/v8cgi/util').Util
global.pp = function (x) {
  print(Util.serialize(x, true))
}

//Custom core extensions
//Create objects descending from other objects
if (typeof Object.create !== 'function') {
  Object.create = function(o) {
    var F = function(){};
    F.prototype = o
    return new F();
  }  
}

//Require the Kupo Loader
var Dispatcher = require('kupo/dispatcher').Dispatcher

exports.app = Dispatcher.handle

exports.development = function(app) {
    return require("jack/commonlogger").CommonLogger(
        require("jack/showexceptions").ShowExceptions(
            require("jack/lint").Lint(
                require("jack/contentlength").ContentLength(app))));
}
