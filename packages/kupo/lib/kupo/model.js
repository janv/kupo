var Errors = require('kupo/errors').Errors;
var MongoAdapter = require('kupo/mongo_adapter').MongoAdapter

//Connection
var conn = MongoAdapter.getConnection();

// Class prototype ///////////////////////////////////////////////////////////

var Model = exports.Model = {
  "defaultCallables" : ['all', 'find']
}

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
      - beforeFind    - Controller Callback
      - afterFind     - Controller Callback
      - beforeAll     - Controller Callback
      - afterAll      - Controller Callback
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
  m.specialization = _specialization; //TODO Möglichst nicht speichern, alles über Closures
  m.initSpecialization();
  
  var collection = conn.getCollection(_name);
  m.collection = function() {return collection;}
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
  for (var i=0; i < this.defaultCallables.length; i++) {
    if (this.defaultCallables[i] == name) return true;
  };
  if (this.specialization.callables && this.specialization.callables instanceof Array) {
    for (var i=0; i < this.instance_spec.callables.length; i++) {
      if (this.specialization.callables[i] == name) return true;
    };
  }
  return false;
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
/*** all
    Pass a reference Object and returns a Mongo DBCursor
*/
Model.all = function(ref) {
  ref = ref || {};
  return this.collection().find(ref).toArray() //TODO instancize Object
}

Model.find = function(ref) {
  //TODO Instancize Object
  if (typeof ref == 'number' || ref instanceof Number) {
    return this.collection().findId(ref);
  } else if ((typeof ref == 'string' || ref instanceof String) && ref.match(/^\d$/)) {
    return this.collection().findId(parseInt(ref));
  } else {
    return this.collection().findOne(ref);
  }
}

// Common instance prototype /////////////////////////////////////////////////

var InstancePrototype = {
  "defaultCallables" : ['update']
}

//create an specialized instance prototype for a specific model
InstancePrototype.derive = function(_instance_spec){
  var ip = Object.create(InstancePrototype);
  ip.instance_spec = _instance_spec;
  return ip;
}

InstancePrototype.rpcCallable = function(name) {
  for (var i=0; i < this.defaultCallables.length; i++) {
    if (this.defaultCallables[i] == name) return true;
  };
  if (this.instance_spec.callables && this.instance_spec.callables instanceof Array) {
    for (var i=0; i < this.instance_spec.callables.length; i++) {
      if (this.instance_spec.callables[i] == name) return true;
    };
  }
  return false;
}
