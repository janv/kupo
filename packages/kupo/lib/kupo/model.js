/**
 * The class prototype is the prototype for all model classes
 * It contains methods and data that are unspecific to any concrete class.
 */
var ClassPrototype = exports.ClassPrototype = {
  "defaultCallables" : ['all', 'find', 'remote_create'],
  
  /**
   * Returns true if the named function is remotely callable on the instance
   *
   * Follows a predefined pattern first, extends this pattern through definitions
   * in the instance part of the specialization or can be completely overwritten
   * to implement special behavior.
   */
  rpcCallable : function(name) {
    for (var i=0; i < this.defaultCallables.length; i++) {
      if (this.defaultCallables[i] == name) return true;
    };
    if (this.spec.callables && this.spec.callables instanceof Array) {
      for (var i=0; i < this.spec.callables.length; i++) {
        if (this.spec.callables[i] == name) return true;
      };
    }
    return false;
  },
  
  /**
   * Used to call callbacks defined in the model on
   * the instances. Do not call or overwrite.
   *
   * @private
   */
  callBack : function(context, _callback) {
    if (this.spec.callbacks
        && this.spec.callbacks[_callback]) {
      var callbacks = this.spec.callbacks[_callback];
      for (var i=0; i < callbacks.length; i++) {
        callbacks[i].apply(context)
      };
    }
  },
   
  /**
   * Pushes a callback to the end of one of the callback chains
   *
   * @param name Name of the callback chain, eg. 'afterSave'
   * @param fun  The callback-function to add
   */
  installCallback :  function(name, fun) {
    if (!this.spec.callbacks) {
      this.spec.callbacks = {};
    }
    if (this.spec.callbacks[name]) {
      this.spec.callbacks[name].push(fun);
    } else {
      this.spec.callbacks[name] = [fun];
    }  
  },
   
  /** Create a new Instance with initial data */
  makeNew : function(data) {
    data = data || {};
    delete(data['_id']);
    return this.makeInstance(data, 'new');
  },

  /** Create a new Instance with initial data and save it */
  create : function(data) {
    var i = this.makeNew(data);
    i.save();
    return i;
  },
   
  /**
   * Creates a model instance based on data object and a state flag.
   *
   * This is NOT supposed to be called by the user, it's only used internally to
   * manufacture instances. Do not call or override this method.
   *
   * @param {Object} _data The data describing the objects properties, from the database
   * @param {String} _state A flag describing the state of the object: new, clean, dirty, deleted
   *
   * @private
   */
  makeInstance : function(_data, _state) {
    var instance = Object.create(this.instancePrototype);
    instance.data  = _data  || {};
    //TODO: New nur ohne id
    instance.state = _state || 'new';
    instance.errors = [];
    //install Association Proxies;
    for (var a in this.spec.associations) {
      this.spec.associations[a].installProxy(instance, a);
    }
    
    return instance;
  }
  
}

/**
 * The Common Instance Prototype is the prototype for all model instances
 * It contains methods and data that are unspecific to any concrete model.
 */
var CommonInstancePrototype = exports.CommonInstancePrototype = {
  "defaultCallables" : ['remote_update', 'remove'],
  "errors" : [],
  "state" : 'new', // new, clean, dirty, removed

  /**
   * Returns true if the named function is remotely callable on the instance
   *
   * Follows a predefined pattern first, extends this pattern through definitions
   * in the instance part of the specialization or can be completely overwritten
   * to implement special behavior.
   */
  rpcCallable : function(name) {
    for (var i=0; i < this.defaultCallables.length; i++) {
      if (this.defaultCallables[i] == name) return true;
    };
    if (this.model.spec.instance.callables && this.model.spec.instance.callables instanceof Array) {
      for (var i=0; i < this.model.spec.instance.callables.length; i++) {
        if (this.model.spec.instance.callables[i] == name) return true;
      };
    }
    return false;
  },
  
  /**
   * Set properties of this instance. Either provide name and value or just an
   * object containing names an values of properties you want to update.
   */
  set : function(prop, value) {
    if (typeof prop == "string" || prop instanceof String) {
      if (prop != '_id' && prop != "_ns") this.data[prop] = value;
    } else {
      var newData   = prop,
          overwrite = value;
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
    this.taint();
  },
  
  /**
   * Set properties of this instance and save it.
   *
   * @see set
   */
  update : function(prop, value) {
    this.set(prop, value);
    return this.save();
  },

  /**
   * Access a property of this instance by name.
   */
  get : function(property) {
    return this.data[property];
  },

  /**
   * Access _id property of this instance.
   */
  id : function() {
    return this.data['_id'];
  },

  /**
   * Erase a property of this instance.
   */
  erase : function(property) {
    delete(this.data[property]);
    this.taint();
  },

  /**
   * Mark this instance as dirty, indicating that it should be saved.
   */
  taint : function() {
    if (this.state == 'clean') this.state = 'dirty';
  },
  
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
  validate : function() {
    this.errors = [];
    var s = this.model.spec;
    if (s.validations instanceof Array) {
      for (var i=0; i < s.validations.length; i++) {
        s.validations[i].apply(this)
      };
    }
    return (this.errors.length < 1);
  },
  
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
 *   Controller callbacks:
 *   - beforeProcess - Controller Callback
 *   - afterProcess  - Controller Callback
 *   Model lifecycle callbacks:
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
 * - validations:
 *   Array of functions that are used to validate the instance
 * - associations:
 *   Object containing Association-Name:Association-Definition pairs.
 *   The Association-Definition is an object containing 2 functions:
 *   - installProxy gets called in the constructor of a new instance,
 *     gets the instance and the associationName as a Parameter and installs the
 *     proxy in the instance;
 *   - registerCallbacks gets called when the instancePrototype is created.
 *     it registers the associations callbacks in the instancePrototype.
 *     These callbacks can read the data of the AssociationProxy through the
 *     instance which contains the Proxy.
 */
var Model = exports.Model = function(_name, _spec) {
  this.name = _name;
  this.spec = _spec;

  //aus model.spec register association callbacks
  for (var a in (this.spec.associations || {})) {
    this.spec.associations[a].registerCallbacks(this, a);
  }
  
  this.instancePrototype = new InstancePrototype(this)
}
Model.prototype = ClassPrototype;

/**
 * Used internally to create instance prototypes for models, basically just by
 * installing custom methods on the prototype
 * @private
 */
var InstancePrototype = exports.InstancePrototype = function(_model){
  //model verknüpfen
  this.model = _model;
  var instanceSpec = ((this.model.spec || {}).instance || {});
  
  // Add methods from spec
  for (var m in (instanceSpec.methods || {})) {
    if (CommonInstancePrototype[m] == undefined) this[m] = instanceSpec.methods[m];
    // else throw new Errors.InternalError("Can't overwrite Methods of the common instance prototype");
  }
  
}
InstancePrototype.prototype = CommonInstancePrototype;

