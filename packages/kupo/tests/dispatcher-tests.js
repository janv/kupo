$KUPO_HOME = require('file').absolute('../../..');

var assert = require("test/assert");
var Dispatcher = require('kupo/dispatcher').Dispatcher;
var Request = require("jack/request").Request;
var MockRequest = require("jack/mock").MockRequest;

exports.testBla = function() {
  Dispatcher.handle(MockRequest.envFor('GET', '/bla', {}))
}

exports.testJavascriptDelivery = {
  setup : function() {
    this.request = new MockRequest(Dispatcher.handle);
  },
  
  testModel : function() {
    var response = this.request.GET('/js/kupo/model');
    assert.isTrue(null != response.match(/c.call\('remote_create'/), "'c.call('remote_create' found, model.js delivered");
  },
  
  testShouldNotDeliverServerJs : function() {
    var response = this.request.GET('/js/kupo/model.server.js');
    assert.isEqual(403, response.status);
  },

  testShouldDeliverKupoLibs : function() {
    var response = this.request.GET('/js/kupo/controller');
    assert.isTrue(null != response.match(/exports\.Controller/), "'exports.Controller' found, model.js delivered");
  },

  testShouldDeliverJackLibs : function() {
    var response = this.request.GET('/js/jack/mock');
    assert.isTrue(null != response.match(/var MockRequest =/), "'var MockRequest =' found, model.js delivered");
  },
  
  testShouldDeliverNarwhalLibs : function() {
    var response = this.request.GET('/js/file');
    assert.isTrue(null != response.match(/exports\.open = function/), "'exports.open = function' found, model.js delivered");
  },

  testShouldDeliverAppModel : function() {
    var response = this.request.GET('/js/model/project');
    assert.isTrue(null != response.match(/var Project = new Model/), "'var Project = new Model' found, model.js delivered");
  },

  testShouldNotDeliverAppController : function() {
    var response = this.request.GET('/js/controller/foo');
    assert.isEqual(403, response.status);
  },

  testUnknownShouldThrow404 : function() {
    var response = this.request.GET('/js/model/irks');
    assert.isEqual(404, response.status);
    var response = this.request.GET('/js/kupo/adasdas');
    assert.isEqual(404, response.status);
  },

}