$KUPO_HOME = require('file').absolute('../../..');

var assert = require("test/assert");
var Dispatcher = require('kupo/dispatcher').Dispatcher;
var Request = require("jack/request").Request;
var MockRequest = require("jack/mock").MockRequest;
var JSON = require('json');

exports.testRemoteCalls = {
  setup : function() {
    this.request = new MockRequest(Dispatcher.handle);
  },
  
  testProjectAll : function() {
    var response = this.request.POST('/project/all', {"jack.input": '{"method":"all","version":"1.1","param":[],"id":0}' });
    assert.isEqual(200, response.status);
  }
}