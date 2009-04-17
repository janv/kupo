$KUPO_HOME = ENV.KUPO_HOME
var paths = require.loader.getPaths()
paths.push($KUPO_HOME + '/framework/lib') //TODO Only works because getPaths exposes the internal array
paths.push($KUPO_HOME + '/vendor/v8cgi')  //TODO Only works because getPaths exposes the internal array

var Jack = require("jack");

//Prepare debug helpers
var Util = require('util').Util
__global__.pp = function (x) {
  print(Util.serialize(x, true))
}

//Require the Kupo Loader
var Dispatcher = require('dispatcher').Dispatcher

var app = Dispatcher.handle

Jack.ContentLength(app)