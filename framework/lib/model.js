//Class prototype
var Model = exports.Model = {}

/*** define
    Use this in a model's definition file to define the model,
    passing the name and the specialization object.
    The specialization object is a plain object containing a few special keys:
    - instance:
      specifies the instance prototype for the model, is passed to InstancePrototype.derive
    - callbacks:
      put callBack methods in here. Currently supported are
      - beforeProcess - Controller Callback
      - afterProcess  - Controller Callback
      Not yet supported are model lifecycle callbacks
      - beforeValidation 
      - beforeValidation_on_create 
      - beforeValidation_on_update 
      - afterValidation 
      - afterValidation_on_create 
      - afterValidation_on_update 
      - beforeSave 
      - beforeCreate 
      - beforeUpdate 
      - afterCreate 
      - afterUpdate 
      - afterSave 
      - beforeDestroy 
      - afterDestroy 
      TODO: Store the model callbacks somewhere else
    o DO NOT OVERWRITE
*/
Model.define = function(_name, _specialization) {
  var m = Object.create(Model);
  m.name = _name;
  m.specialization = _specialization;
  m.initSpecialization();
  return m;
}

/*** initSpecialization
    Initialize the specialized model using the specialization object passed in
    Model.define.
    o DO NOT CALL
    o DO NOT OVERWRITE
*/
Model.initSpecialization = function(){
  // for (x in this.specialization)
  this.instancePrototype = InstancePrototype.derive(this.specialization.instance);
}

/*** rpcCallable
    Determine for a given function name wether the function os remotely callable
    overwrite and implement as needed.
    TODO: Develop quick way of determining this using lists specified in the
          specialization object
*/
Model.rpcCallable = function(name) {
  //return wether the named function is RPC-callable.
  return true;
}

/*** controllerCallBack
    Used by the ResourceController to call callbacks defined in the model on
    the Controller instance
  o DO NOT CALL
  o DO NOT OVERWRITE  
*/
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
