$KUPO_HOME = require('file').absolute('../../..');

require("kupo/mongo_adapter").MongoAdapter.setConnection("kupo_test");
var assert         = require("test/assert");
var Dispatcher     = require('kupo/dispatcher').Dispatcher;
var Request        = require("jack/request").Request;
var MockRequest    = require("jack/mock").MockRequest;
var JSON           = require('json');
var Project        = require($KUPO_HOME + '/app/model/project.server.js').Project;
var JRPCConnection = require('kupo/jrpc_connection').JRPCConnection
var JRPCRequest    = require('kupo/jrpc').JRPCRequest


exports.testRemoteCalls = {
  setup : function() {
    Project.collection().drop();
    this.request = new MockRequest(Dispatcher.handle);
    this.call = function(url, jrpc) {
      var response = this.request.POST(url, {
        "jack.input" : (typeof jrpc == 'string' || jrpc instanceof String ) ? jrpc : JSON.stringify(jrpc),
        "HTTP_ACCEPT": "application/json"
      });
      response.object = JSON.parse(response.body);
      return response;
    }
  },
  
  testProjectAll : function() {
    Project.create({"name": "blaproject"});
    var response = this.call('/project/all', '{"method":"all","version":"1.1"}')
    assert.isEqual("blaproject", response.object.result[0].data.name);
  },

  testProjectAblauf : function() {
    Project.create({"name": "Testproject", "description" : "A nice project", "time" : 12});
    var response = this.call('/project/all', '{"method":"all","version":"1.1"}')
    var id = response.object.result[0].data._id;
    assert.isEqual("Testproject", response.object.result[0].data.name);
    var response = this.call('/project/'+id, '{"method":"remote_update","version":"1.1","params":[{"_id":"'+id+'","name":"Testproject","description":"A nice project","time":12,"_ns":"project","xxx":"yyy"}]}')
  }
}

exports.testJRPCEncoding = {
  setup : function() {
    self = this;
    $ = {ajax : function(arg){
      self.ajaxcall = arg
      var jr = JRPCRequest.fromPOST({
        body : function() {
          return arg.data;
        }
      });
      //server-rpc aufrufen
      arg.complete(responsetext, status)
    }}
  }
}