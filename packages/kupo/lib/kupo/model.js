var Errors = require('kupo/errors').Errors;
var MongoAdapter = require('kupo/mongo_adapter').MongoAdapter
var Support = require('kupo/support').Support;

//Connection
var conn = MongoAdapter.getConnection();

// Class prototype ///////////////////////////////////////////////////////////

/** @class */
var ClassPrototype = exports.Model = {
  "defaultCallables" : ['all', 'find']
}

/**
 * Use this in a model's definition file to define the model,
 * passing the name and the specialization object.
 * The specialization object is a plain object containing a few special keys:
 * - callables:
 *   Array of strings with functions that are remotely callable
 * - instance:
 *   specifies the instance prototype for the model, is passed to InstancePrototype.derive
 * - callbacks:
 *   put callBack methods in here. Currently supported are
 *   - beforeProcess - Controller Callback
 *   - afterProcess  - Controller Callback
 *   - beforeFind    - Controller Callback
 *   - afterFind     - Controller Callback
 *   - beforeAll     - Controller Callback
 *   - afterAll      - Controller Callback
 *   Not yet supported are model lifecycle callbacks
 *   - beforeValidation
 *   - beforeValidation_on_create
 *   - beforeValidation_on_update
 *   - afterValidation
 *   - afterValidation_on_create
 *   - afterValidation_on_update
 *   - beforeSave
 *   - beforeCreate
 *   - beforeUpdate
 *   - afterCreate
 *   - afterUpdate
 *   - afterSave
 *   - beforeDestroy
 *   - afterDestroy
 *   TODO: Store the model callbacks somewhere else
 * o DO NOT OVERWRITE
 */
ClassPrototype.define = function(_name, _specialization) {
  var m = Support.clone(ClassPrototype);
  m.name = _name;
  m.specialization = _specialization; //TODO Möglichst nicht speichern, alles über Closures
  m.initSpecialization();
  
  var collection = conn.getCollection(_name);
  m.collection = function() {return collection;}
  return m;
}

/**
 * Initialize the specialized model using the specialization object passed in
 * Model.define. Do not call, do not overwrite.
 * 
 * @private
 */
ClassPrototype.initSpecialization = function(){
  // for (x in this.specialization)
  this.instancePrototype = CommonInstancePrototype.derive(this.specialization.instance, this);
}

/**
 * Returns true if the named function is remotely callable on the instance
 *
 * Follows a predefined pattern first, extends this pattern through definitions
 * in the instance part of the specialization or can be completely overwritten
 * to implement special behavior.
 */
ClassPrototype.rpcCallable = function(name) {
  for (var i=0; i < this.defaultCallables.length; i++) {
    if (this.defaultCallables[i] == name) return true;
  };
  if (this.specialization.callables && this.specialization.callables instanceof Array) {
    for (var i=0; i < this.specialization.callables.length; i++) {
      if (this.specialization.callables[i] == name) return true;
    };
  }
  return false;
}

/**
 * Used by the ResourceController to call callbacks defined in the model on
 * the Controller instance. Do not call or overwrite.
 *
 * @private
 */
ClassPrototype.controllerCallback = function(controllerInstance, _callback){
  if (this.specialization.callbacks
      && this.specialization.callbacks[_callback]) {
    this.specialization.callbacks[_callback].apply(controllerInstance)
  }
}

// Persistence stuff

/** Pass a reference Object and returns a Mongo DBCursor */
ClassPrototype.all = function(ref) {
  ref = ref || {};
  return this.collection().find(ref).map(function(o){
    return newInstancePrototype(this.instancePrototype, o, 'clean');
  })
}

/** Pass a reference Object and returns the first found object */
ClassPrototype.find = function(ref) {
  if (typeof ref == 'number' || ref instanceof Number) {
    return newInstancePrototype(this.instancePrototype, this.collection().findId(ref), 'clean');
  } else if ((typeof ref == 'string' || ref instanceof String) && ref.match(/^\d$/)) {
    return newInstancePrototype(this.instancePrototype, this.collection().findId(parseInt(ref)), 'clean');
  } else {
    return newInstancePrototype(this.instancePrototype, this.collection().findOne(ref), 'clean');
  }
}

/** Create a new Instance with initial data */
ClassPrototype.makeNew = function(data) {
  data = data || {};
  delete(data['_id']);
  return newInstancePrototype(this.instancePrototype, data, 'new');
}

/** Create a new Instance with initial data and save it */
ClassPrototype.create = function(data) {
  var i = this.makeNew(data);
  i.save();
  return i;
}

// Common instance prototype /////////////////////////////////////////////////

/**
 * Common instance prototype of model instances.
 * Is further specialized and extendend in concrete models.
 *
 * @class
 */
var CommonInstancePrototype = {
  "defaultCallables" : ['update'],
  "state" : 'new' // new, clean, dirty, deleted
}

/**
 * Create an specialized instance prototype for a specific model
 *
 * Called by ClassPrototype.derive, passing the instance-part of the specialization
 * object. Do not call, do not overwrite.
 *
 * @private
 */
CommonInstancePrototype.derive = function(_instanceSpec, _model){
  var ip = Support.clone(CommonInstancePrototype);
  ip.instanceSpec = _instanceSpec; //TODO CamelCase
  ip.model = _model;
  return ip;
}

/**
 * Returns true if the named function is remotely callable on the instance
 *
 * Follows a predefined pattern first, extends this pattern through definitions
 * in the instance part of the specialization or can be completely overwritten
 * to implement special behavior.
 */
CommonInstancePrototype.rpcCallable = function(name) {
  for (var i=0; i < this.defaultCallables.length; i++) {
    if (this.defaultCallables[i] == name) return true;
  };
  if (this.instanceSpec.callables && this.instanceSpec.callables instanceof Array) {
    for (var i=0; i < this.instanceSpec.callables.length; i++) {
      if (this.instanceSpec.callables[i] == name) return true;
    };
  }
  return false;
}

/**
 * Save this object to the database
 *
 * @return true if the object was saved, false if it wasn't
 */
CommonInstancePrototype.save = function() {
  var c = this.model.collection();
  switch (this.state) {
    case 'new':
      delete(this.data['_id']);
      this.data = c.insert(this.data);
      this.state = 'clean'
      return true;
    case 'dirty':
      this.data = c.update({'_id': this.data.id}, this.data, true, true);
      this.state = 'clean'
      return true;
    case 'clean':
      return false;
    case 'deleted':
      return false;
      break;
  }
}

CommonInstancePrototype.remove = function() {
  var c = this.model.collection();
  c.remove({'_id' : this.data['_id']});
  this.state = 'deleted';
}

/**
 * Remove this instance from the database
 *
 * @see set
 */
CommonInstancePrototype.remove = function() {
  var c = this.model.collection();
  c.remove({'_id' : this.data['_id']});
  this.state = 'deleted';
}

/**
 * Set properties of this instance and save it.
 *
 * @see set
 */
CommonInstancePrototype.update = function(propData, value) {
  this.set(propData, value);
  this.save();
}

/**
 * Set properties of this instance. Either provide name and value or just an
 * object containing names an values of properties you want to update.
 */
CommonInstancePrototype.set = function(propData, value) {
  if (typeof propData == "string" || propData instanceof String) {
    this.data[propData] = value;
  } else {
    for (var p in propData) {
      this.data[p] = propData[p];
    }
  }
  this.state = 'dirty';
}

/**
 * Access a property of this instance by name.
 */
CommonInstancePrototype.get = function(property) {
  return this.data[property];
}

/**
 * Creates a model instance based on data object and a state flag.
 *
 * This is NOT supposed to be called by the user, it's only used internally to
 * manufacture instances. Do not call or override this method.
 *
 * (This is not an accessible Method on the InstancePrototype to prevent manual calls to it)
 *
 * @param {InstancePrototype} _instancePrototype The Instance Prototype the instance should be derived from.
 * @param {Object} _data The data describing the objects properties, from the database
 * @param {String} _state A flag describing the state of the object: new, clean, dirty, deleted
 *
 * @private
 * @member CommonInstancePrototype
 */
var newInstancePrototype = function(_instancePrototype, _data, _state) {
  var instance = Support.clone(_instancePrototype);
  instance.data  = _data  || {};
  //TODO: New nur ohne id
  instance.state = _state || 'new';
  return instance;
}