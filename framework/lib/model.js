//Class prototype
var Model = exports.Model = {}

Model.define = function(_name, _specialization) {
  var m = Object.create(Model);
  m.name = _name;
  m.specialization = _specialization;
  m.initSpecialization();
  return m;
}

Model.initSpecialization = function(){
  // for (x in this.specialization)
  this.instancePrototype = InstancePrototype.derive(this.specialization.instance);
}

Model.rpcCallable = function(name) {
  //return wether the named function is RPC-callable.
  return true;
}

Model.controllerCallback = function(controllerInstance, _callback){
  if (this.specialization.callbacks
      && this.specialization.callbacks[_callback]) {
    this.specialization.callbacks[_callback].apply(controllerInstance)
  }
}

// Persistence stuff
Model.all = function(cond) {
  //fetch all by condition.
  return [];
}

//Common instance prototype
var InstancePrototype = {}

//create an specialized instance prototype for a specific model
InstancePrototype.derive = function(spec){
  //spec ist die instanzspezifiaktion im model
}




/*

Controllerfilter:

beforeProcess
afterProcess

ModelFilter:

beforeValidation 
beforeValidation_on_create 
beforeValidation_on_update 
afterValidation 
afterValidation_on_create 
afterValidation_on_update 
beforeSave 
beforeCreate 
beforeUpdate 
afterCreate 
afterUpdate 
afterSave 
beforeDestroy 
afterDestroy 


*/