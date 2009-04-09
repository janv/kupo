var KUPO_ROOT = "../"
$LOAD_PATH = KUPO_ROOT + "framework/lib" + ":" + KUPO_ROOT + "vendor/narwhal/lib" + ":" + KUPO_ROOT + "vendor/v8cgi";

//V8
// include(KUPO_ROOT + 'vendor/v8cgi/js.js')
V8CGI = {}
// V8CGI.HTML    = require(KUPO_ROOT + 'vendor/v8cgi/html.js').HTML
// V8CGI.HTTP    = require(KUPO_ROOT + 'vendor/v8cgi/http.js').HTTP
// V8CGI.Session = require(KUPO_ROOT + 'vendor/v8cgi/session.js').Session
V8CGI.Util    = require(KUPO_ROOT + 'vendor/v8cgi/util.js').Util

// Print
global.print = function(x) {
  System.stdout(x + "\n")
}

// Debugging
// $DEBUG = true;
// print("Content-Type: text/plain\n\n")
// global.pd = function(x){
//   print(d(x))
// }
global.d = function(x){
  V8CGI.Util.serialize(x, true)
}


// Load Jack and Narwhal
include(KUPO_ROOT + "vendor/narwhal/narwhal.js");

var Jack = require("jack");

var app = function(env) {
    var Request = require('jack/request').Request;
    var r = new Request(env)
    return [200, {"Content-Type":"text/plain"}, "hello world! How are you?" + r.scriptName()];
}
// app = Jack.Lint(app);

Jack.Handler.V8CGI.run(app, request, response);