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
 * o DO NOT OVERWRITE
 */
var Model = exports.Model = function(_name, _specialization){
  // The Class Prototype
  var m  = {"defaultCallables" : ['all', 'find'] };
  m.name = _name;
  
  m.Instance = new InstanceConstructor(_specialization, m);
  
  /**
   * Returns true if the named function is remotely callable on the instance
   *
   * Follows a predefined pattern first, extends this pattern through definitions
   * in the instance part of the specialization or can be completely overwritten
   * to implement special behavior.
   */
  m.rpcCallable = function(name) {
    for (var i=0; i < m.defaultCallables.length; i++) {
      if (m.defaultCallables[i] == name) return true;
    };
    if (_specialization.callables && _specialization.callables instanceof Array) {
      for (var i=0; i < _specialization.callables.length; i++) {
        if (_specialization.callables[i] == name) return true;
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
  m.callBack = function(context, _callback){
    if (_specialization.callbacks
        && _specialization.callbacks[_callback]) {
      var callbacks = _specialization.callbacks[_callback];
      for (var i=0; i < callbacks.length; i++) {
        callbacks[i].apply(context)
      };
    }
  };
  
  /**
   * Pushes a callback to the end of one of the callback chains
   *
   * @param name Name of the callback chain, eg. 'afterSave'
   * @param fun  The callback-function to add
   */
  m.installCallback = function(name, fun) {
    if (!_specialization.callbacks) {
      _specialization.callbacks = {};
    }
    if (_specialization.callbacks[name]) {
      _specialization.callbacks[name].push(fun);
    } else {
      _specialization.callbacks[name] = [fun];
    }  
  }
  
  // register AssociationCallbacks
  for (var a in _specialization.associations) {
    _specialization.associations[a].registerCallbacks(m, a);
  }

  
  return m;
}

var InstanceConstructor = exports.InstanceConstructor = function(_specialization, _model) {
  //The instancePrototype
  var ip = {
    "defaultCallables" : ['update'], //TODO DefaultCallables sollten nicht zugreifbar sein
    "errors" : [],
    "state" : 'new' // new, clean, dirty, removed
  };
  
  var instanceSpec = ((_specialization || {}).instance || {});
  
  ip.model = _model;
  
  /**
   * Called during instance initialization
   *
   * Executes installProxy methods of every associations.
   *
   * Call only on Instance Prototype, otherwise the associations are installed on the
   * Common Instance prototype
   * 
   * @private
   */
  ip.installAssociationProxies = function(instance) { //TODO nach unten in die closure verschieben?
    for (var a in _specialization.associations) {
      _specialization.associations[a].installProxy(instance, a);
    }
  }
  
  //add Methods to instance Prototype
  var methods = (instanceSpec.methods || {});
  for (var m in methods) {
    if (ip[m] == undefined) ip[m] = methods[m];
  }
  
  /**
   * Returns true if the named function is remotely callable on the instance
   *
   * Follows a predefined pattern first, extends this pattern through definitions
   * in the instance part of the specialization or can be completely overwritten
   * to implement special behavior.
   */
  ip.rpcCallable = function(name) {
    for (var i=0; i < ip.defaultCallables.length; i++) {
      if (ip.defaultCallables[i] == name) return true;
    };
    if (instanceSpec.callables && instanceSpec.callables instanceof Array) {
      for (var i=0; i < instanceSpec.callables.length; i++) {
        if (instanceSpec.callables[i] == name) return true;
      };
    }
    return false;
  }
  
  // PERSISTENCE METHODS
  
  /**
   * Set properties of this instance and save it.
   *
   * @see set
   */
  ip.update = function(propData, value) {
    this.set(propData, value);
    this.save();
  }

  /**
   * Set properties of this instance. Either provide name and value or just an
   * object containing names an values of properties you want to update.
   */
  ip.set = function(prop, value) {
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
    this.taint();
  }
  
  /**
   * Access a property of this instance by name.
   */
  ip.get = function(property) {
    return this.data[property];
  }
  
  /**
   * Access _id property of this instance.
   */
  ip.id = function() {
    return this.data['_id'];
  }

  /**
   * Mark this instance as dirty, indicating that it should be saved.
   */
  ip.taint = function() {
    if (this.state == 'clean') this.state = 'dirty';
  }

  /**
   * Erase a property of this instance.
   */
  ip.erase = function(property) {
    delete(this.data[property]);
    this.taint();
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
  ip.validate = function() {
    this.errors = [];
    var s = _specialization;
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
   * @param {Object} _data The data describing the objects properties, from the database
   * @param {String} _state A flag describing the state of the object: new, clean, dirty, deleted
   *
   * @private
   * @constructor
   */
  var constructor = function(data, state) {
    this.data = data   || {};
    this.state = state || 'new';
    //TODO: New nur ohne id
    this.errors = [];
    
    // this.getData(){return data;};
    // this.setData(x){data = x;};
    // this.getState(){return state;};
    // this.setState(x){state = x};
    
    this.installAssociationProxies(this);
  }
  constructor.prototype = ip;
  
  return constructor;
}