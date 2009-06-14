var assert = require("test/assert");

// Generic ///////////////////////////////////////////////////////////////////

var generic = {}

generic.Model = function(name, spec) {
  // Add ClassMethods (nicht hier drin, manuell)
  // Set Name
  // Set specialization  
  // generate instancePrototype
  this.instancePrototype = new generic.InstancePrototype(this)
}
generic.Model.prototype = generic.ClassPrototype;

generic.ClassPrototype = {
  rpcCallable : function() {
    //access specialization
  },
  callBack : function() {
    //access specialization
  },
  installCallback : function() {
    //access specialization
  },
  makeInstance : function() {
    var constr = function(){}
    constr.prototype = this.instancePrototype;
    return new constr()
  }
  // ODER als Konstruktor:
  //
  // Instance : function() {
  //   var constr = function(){}
  //   constr.prototype = this.instancePrototype;
  //   return new constr()
  // }
  
}

//Constructor für den InstancePrototype, nicht für die Instance Selber
generic.InstancePrototype = function(model){
  //aus model.spec methoden addedn
  //aus model.spec register association callbacks
}
generic.InstancePrototype.prototype = generic.CommonInstancePrototype

generic.CommonInstancePrototype = {
  set : function() {
    //access data
  },
  get : function() {
    //access data
  },
  id : function() {
    //access data
  },
  erase : function() {
    //access data
  },
  taint : function() {
    //access state
  },
  validate : function() {
    //access data
    //access model.specialization
  },
  installAssociationProxies : function() {
    //access model.specialization
  },
}

// Server ////////////////////////////////////////////////////////////////////

var server = {}

server.Model = function(name, spec) {
  generic.Model.call(this, name, spec) //super call
  this.instancePrototype = new server.InstancePrototype(this)
}
server.Model.prototype = server.ClassPrototype;

server.ClassPrototype = Object.create(generic.ClassPrototype);
server.ClassPrototype.all = function() {
  //access this.collection
  //access this.makeInstance
}
server.ClassPrototype.find = function() {}


server.InstancePrototype = function(model) {
  generic.InstancePrototype.call(this, model); //super call
}
server.InstancePrototype.prototype = server.CommonInstancePrototype

server.CommonInstancePrototype = Object.create(generic.CommonInstancePrototype)
server.CommonInstancePrototype.save = function() {
  //access this.data
  //access this.state
  //access this.model.collection
}
server.CommonInstancePrototype.remove = function() {
  //access this.data
  //access this.state
  //access this.model.collection
}

// Tests /////////////////////////////////////////////////////////////////////




exports.testModelIsGenericModel = function(){
  var Project = new server.Model('project', {});
  assert.isTrue(Project instanceof generic.Model, "Project is genericModel");
}

exports.testInstanceIsGenericInstance = function(){
  var Project = new server.Model('project', {});
  assert.isTrue((new Project.Instance) instanceof Project.Instance, "Project is genericModel");
  assert.isTrue((new Project.Instance) instanceof generic.InstanceConstructor, "instance is InstanceConstructor");
}

