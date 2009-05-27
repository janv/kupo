var jsDump = require('test/jsdump').jsDump;
var assert = require("test/assert");
require("kupo/mongo_adapter").MongoAdapter.setConnection("kupo_test");
var Model  = require("kupo/model").Model;

// Sample Model //////////////////////////////////////////////////////////////

var Project = Model.define('project',{
  instance: {
    callables: ['finish']
  },
  callables: ['blubb'],
  callbacks: {
    beforeProcess: function(){
      print('PROJECT beforeProcess callback executing')
    },
    afterProcess: function(){
      print('PROJECT afterProcess callback executing')
    }
  }
});

Project.blubb = function(x) {
  return "This is the result of the blubb test-function which multiplies the argument by 3: " + ( 3 * x ).toString()
}

// Tests /////////////////////////////////////////////////////////////////////

exports.testDefinition = {
  testSimple : function() {
    var TestModel = Model.define('test',{});
  },
  
  testDefaultsCallable : function() {
    assert.isTrue(Project.rpcCallable('all'));
    assert.isTrue(Project.rpcCallable('find'));
  },
  
  testNonDefaultsNotCallable : function() {
    assert.isTrue(!Project.rpcCallable('bingobongo'));
  },
  
  testCustomCallables : function() {
    assert.isTrue(Project.rpcCallable('blubb'));    
  },
  
  testInitSetsCollectionAndSpecialization : function() {
    assert.isTrue(Project.collection().count() >= 0);
    assert.isEqual('blubb', Project.specialization.callables[0]);
  },
  
  testDefineSetsInstancePrototype : function() {
    assert.isTrue(typeof Project.instancePrototype == 'object');
    assert.isTrue(Project.instancePrototype.state == 'new');
  },
  
  testInstDefaultsCallable : function() {
    assert.isTrue(Project.instancePrototype.rpcCallable('update'));
  },
  
  testInstNonDefaultsNotCallable : function() {
    assert.isTrue(!Project.instancePrototype.rpcCallable('palimpalim'));
  },
  
  testInstCustomCallables : function() {
    assert.isTrue(Project.instancePrototype.rpcCallable('finish'));
  },
  
  testInstRefersSpecAndModel : function() {
    assert.isEqual(Project, Project.instancePrototype.model);
    assert.isEqual(Project.specialization.instance, Project.instancePrototype.instanceSpec);
  }
  
}