var assert = require("test/assert");

// Generic ///////////////////////////////////////////////////////////////////

var generic = {}

generic.Model = function(_name, _specialization) {
  var m  = {};
  m.name = _name;
  
  m.Instance = new generic.InstanceConstructor(_specialization, m);
  return m;
}

generic.InstanceConstructor = function(_specialization, _model){
  var ip = {};
  ip.model = _model;
  
  var constructor = function(){
    this.state = 'new'
  }
  constructor.prototype = ip;
  
  return constructor;
}

// Server ////////////////////////////////////////////////////////////////////

var server = {}

server.Model = function(_name, _specialization) {
  var m = new generic.Model(_name, _specialization);
  
  // Overwrite Instance constructor with the server-specififc one
  m.Instance = new server.InstanceConstructor(_specialization, m);
  
  m.makeNew = function(data) {
    data = data || {};
    delete(data['_id']);
    return new m.Instance(data, 'new');
  }
  
  return m;
}

server.InstanceConstructor = function(_specialization, _model) {
  var constructor = new generic.InstanceConstructor(_specialization, _model);
  constructor.prototype.save = function() {}
  return constructor;
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

