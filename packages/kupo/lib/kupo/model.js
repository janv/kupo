var Errors = require('kupo/errors').Errors;
var MongoAdapter = require('kupo/mongo_adapter').MongoAdapter
var Support = require('kupo/support').Support;

//Connection
var conn = MongoAdapter.getConnection();

//////////////////////////////////////////////////////////////////////////////
// Class prototype ///////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

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
 *   - beforeValidationOnCreate
 *   - beforeValidationOnUpdate
 *   - afterValidation
 *   - afterValidationOnCreate
 *   - afterValidationOnUpdate
 *   - beforeSave
 *   - beforeCreate
 *   - beforeUpdate
 *   - afterCreate
 *   - afterUpdate
 *   - afterSave
 *   - beforeRemove
 *   - afterRemove
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
 * Used to call callbacks defined in the model on
 * the instances. Do not call or overwrite.
 *
 * @private
 */
 ClassPrototype.callBack = function(context, _callback){
   if (this.specialization.callbacks
       && this.specialization.callbacks[_callback]) {
     var callbacks = this.specialization.callbacks[_callback];
     for (var i=0; i < callbacks.length; i++) {
       callbacks[i].apply(context)
     };
   }
 }


/**
 * Pushes a callback to the end of one of the callback chains
 *
 * @param name Name of the callback chain, eg. 'afterSave'
 * @param fun  The callback-function to add
 */
ClassPrototype.installCallback = function(name, fun) {
  if (!this.specialization.callbacks) {
    this.specialization.callbacks = {};
  }
  if (this.specialization.callbacks[name]) {
    this.specialization.callbacks[name].push(fun);
  } else {
    this.specialization.callbacks[name] = [fun];
  }  
}


// Persistence stuff

/** Pass a reference Object and returns a Mongo DBCursor */
ClassPrototype.all = function(ref) {
  ref = ref || {};
  var prot = this.instancePrototype;
  return this.collection().find(ref).map(function(o){
    return newInstance(prot, o, 'clean');
  })
}

/** Pass a reference Object and returns the first found object (or null) */
ClassPrototype.find = function(ref) {
  if (ref.toString().match(/^[abcdef\d]+$/)) {
    var result = this.collection().findId(ref);
  } else {
    var result = this.collection().findOne(ref);
  }
  if (result == null) {
    return result;
  } else {
    return newInstance(this.instancePrototype, result, 'clean');
  }
}

/** Create a new Instance with initial data */
ClassPrototype.makeNew = function(data) {
  data = data || {};
  delete(data['_id']);
  return newInstance(this.instancePrototype, data, 'new');
}

/** Create a new Instance with initial data and save it */
ClassPrototype.create = function(data) {
  var i = this.makeNew(data);
  i.save();
  return i;
}







//////////////////////////////////////////////////////////////////////////////
// Common instance prototype /////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/**
 * Common instance prototype of model instances.
 * Is further specialized and extendend in concrete models.
 *
 * @class
 */
var CommonInstancePrototype = {
  "associationCache" : {},
  "defaultCallables" : ['update'],
  "errors" : [],
  "state" : 'new' // new, clean, dirty, removed
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
  ip.instanceSpec = _instanceSpec;
  ip.model = _model;
  ip.installAssociations();
  if (ip.instanceSpec) ip.extractMethods(ip.instanceSpec.methods);
  return ip;
}

// Call only on Instance Prototype, otherwise the assocs are installed on the 
// Common Instance prototype
CommonInstancePrototype.installAssociations = function() {
  for (var a in this.model.specialization.associations) {
    this.model.specialization.associations[a].apply(this, [a]);
  }
}

/**
 * Used to add methods defined in InstanceSpec.methods to the CommonInstancePrototype
 *
 * @private
 */
CommonInstancePrototype.extractMethods = function(origin) {
  if (typeof origin == 'object') {
    for (var m in origin) {
      if (CommonInstancePrototype[m] == undefined) this[m] = origin[m];
      // else throw new Errors.InternalError("Can't overwrite Methods of the common instance prototype");
    }
  }
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
      this.model.callBack(this, 'beforeValidation');
      this.model.callBack(this, 'beforeValidationOnCreate');
      var valid = this.validate();
      this.model.callBack(this, 'afterValidation');
      this.model.callBack(this, 'afterValidationOnCreate');

      if (valid) {
        this.model.callBack(this, 'beforeSave');
        this.model.callBack(this, 'beforeCreate');
        this.data = c.insert(this.data);
        this.state = 'clean'
        this.model.callBack(this, 'afterCreate');
        this.model.callBack(this, 'afterSave');
        return true;
      } else {
        return false;
      }
    case 'dirty':
      this.model.callBack(this, 'beforeValidation');
      this.model.callBack(this, 'beforeValidationOnUpdate');
      var valid = this.validate();
      this.model.callBack(this, 'afterValidation');
      this.model.callBack(this, 'afterValidationOnUpdate');

      if (valid) {
        this.model.callBack(this, 'beforeSave');
        this.model.callBack(this, 'beforeUpdate');
        this.data = c.update({'_id': this.data._id}, this.data, true, true);
        this.state = 'clean'
        this.model.callBack(this, 'afterUpdate');
        this.model.callBack(this, 'afterSave');
        return true;
      } else {
        return false;
      }
    case 'clean':
      return false;
    case 'removed':
      return false;
  }
}

CommonInstancePrototype.remove = function() {
  this.model.callBack(this, 'beforeRemove');
  if (this.state != 'new') this.model.collection().remove({'_id' : this.data['_id']});
  this.state = 'removed';
  this.model.callBack(this, 'afterRemove');
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
CommonInstancePrototype.set = function(prop, value) {
  if (typeof prop == "string" || prop instanceof String) {
    if (prop != '_id' && prop != "_ns") this.data[prop] = value;
  } else {
    var newData = prop, overwrite = value;
    delete(newData['_id']); //TODO: Ooops, hier wird auch aus dem Original gelöscht, baad
    delete(newData['_ns']);
    if (overwrite == true){
      newData._id = this.data._id;
      newData._ns = this.data._ns;
      this.data = newData;
    } else {
      for (var p in newData) {
        this.data[p] = newData[p];
      }      
    }
  }
  if (this.state == 'clean') this.state = 'dirty';
}

/**
 * Access a property of this instance by name.
 */
CommonInstancePrototype.get = function(property) {
  return this.data[property];
}

/**
 * Erase a property of this instance.
 */
CommonInstancePrototype.erase = function(property) {
  delete(this.data[property]);
  if (this.state == 'clean' )this.state = 'dirty';
}

/**
 * Validates this instance based on the validation functions in
 * the 'validations' property of the model's specializaition.
 * Provide an array with functions there which are executed in this instance's context
 * in their present order.
 *
 * Inside a validation function, push to this.errors to make the validation fail.
 * Push a string to give an error message for the entire object, or push an array
 * containing a data property and the error message for this property to explain why
 * exactly the validation failed.
 *
 * @returns True or False, indicating if any of the executed validations added anything to the errors object.
 */
CommonInstancePrototype.validate = function() {
  this.errors = [];
  var s = this.model.specialization;
  if (s.validations instanceof Array) {
    for (var i=0; i < s.validations.length; i++) {
      s.validations[i].apply(this)
    };
  }
  return (this.errors.length < 1);
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
var newInstance = function(_instancePrototype, _data, _state) {
  var instance = Support.clone(_instancePrototype);
  instance.data  = _data  || {};
  //TODO: New nur ohne id
  instance.state = _state || 'new';
  instance.errors = [];
  instance.associationCache = {};
  return instance;
}

//////////////////////////////////////////////////////////////////////////////
// Associations //////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/**
 * Creates a belongs-to association to be stored in the specialization.associations
 * under the associations name.
 * Pass the model you want to associate with. Actually returns a initialization
 * function that gets called upon intitialization of the InstancePrototype and augments
 * it with accessors for the association.
 */
exports.Model.belongs_to = function(model, options) {
  var foreignKey = model.name + "_id"
  
  // this gets called in the context of the Instance Prototype, creating the
  // accessor functions
  return function(assocName) {
    //create set Function
    /**
     * Sets the association to an object or an id.
     * Pass in null to remove the association.
     */
    this['set' + Support.capitalize(assocName)] = function(idOrInstance) {
      if (idOrInstance == null) {
        this.erase(foreignKey);
        delete(this.associationCache[assocName]);
      } else if (idOrInstance.toString().match(/^[abcdef\d]+$/)) {
        this.set(foreignKey, idOrInstance.toString());
      } else {
        if (idOrInstance.state != 'removed') {
          this.set(foreignKey, idOrInstance.get('_id'));
          this.associationCache[assocName] = idOrInstance;
        }
      }
    }
    
    //create get Function
    /**
     * Returns the instance referenced by the association.
     */
    this['get' + Support.capitalize(assocName)] = function(skipCache) {
      if (!this.associationCache[assocName] || (skipCache == true)) {
        if (this.get(foreignKey) == null) return null;
        this.associationCache[assocName] = model.find(this.get(foreignKey));
      }
      return this.associationCache[assocName];
    }
    
    //install save callback
    var callback = function() {
      var assoc = this['get' + Support.capitalize(assocName)]();
      if (assoc) assoc.save();
    }
    
    this.model.installCallback('beforeSave', callback);
  }
}

/**
 * Creates a belongs-to association to be stored in the specialization.associations
 * under the associations name.
 * Pass the model you want to associate with. Actually returns a initialization
 * function that gets called upon intitialization of the InstancePrototype and augments
 * it with accessors for the association.
 */
exports.Model.has_many = function(model, options) {
  // this gets called in the context of the Instance Prototype, creating the
  // accessor functions
  return function(assocName) {
    var ownKey = this.model.name + "_id"

    //create get Function
    this['get' + Support.capitalize(assocName) ] = function() {
      var ref = {};
      ref[ownKey] = this.get('_id');
      return model.all(ref);
    }
    
    //create add Function
    this['addTo' + Support.capitalize(assocName) ] = function(objects) {
      if (!(objects instanceof Array)) objects = [objects];
      for (var i=0; i < objects.length; i++) {
        objects[i].set(ownKey, this.get('_id'));
        objects[i].save();
      };
    }
    
    
  }
}