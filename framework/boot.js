$KUPO_HOME = ENV.KUPO_HOME
var paths = require.loader.getPaths()
paths.push($KUPO_HOME + '/framework/lib') //TODO Only works because getPaths exposes the internal array

var Jack = require("jack");

//Require the Kupo Loader
var Dispatcher = require('dispatcher').Dispatcher

var app = function(env) {
    return [200, {"Content-Type" : "text/plain"},  ["Hello World"]];
}

Jack.ContentLength(app)