global.$KUPO_HOME = system.env.KUPO_HOME
var paths = require.loader.getPaths()
paths.push($KUPO_HOME + '/framework/lib')
paths.push($KUPO_HOME + '/vendor/v8cgi')
require.loader.setPaths(paths)

var Jack = require("jack");

//Prepare debug helpers
var Util = require('util').Util
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
var Dispatcher = require('dispatcher').Dispatcher

var app = Dispatcher.handle

exports.app = Jack.ContentLength(app)