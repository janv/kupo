var Support = require('kupo/support').Support;
var Common  = require('./common').Common;

var HasOneProxy = function(instance, targetModel, assocName, options) {
  // Eigentlich so, statt instance.model.name aber lookup im belongs to
  var foreignKey = (options || {}).foreignKey || (instance.model.name + '_id');
  this.cache = null;
  this.callback = null;
  
  function searchRef(id) {
    var ref = {};
    ref[foreignKey] = id || instance.id();
    return ref;
  }
  
  this.set = function(idOrInstance){
    if (Common.isPlainKey(idOrInstance)) {
      var other = targetModel.find(searchRef(idOrInstance));
      if (other == null) return;
    } else if (Common.isInstance(idOrInstance, targetModel)) {
      var other = idOrInstance;
    } else {
      return;
    }
    
    var old = targetModel.find(searchRef());
    if (old) {
      old.erase(foreignKey);
      old.save();
    }

    if (instance.state != 'new') {
      other.set(foreignKey, instance.id());
      other.save();
    } else {
      this.callback = function() {
        other.set(foreignKey, instance.id());
        other.save();
      }
    }
    
    this.cache = other;
  };
  
  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      if (instance.get('_id') == null) return null;
      this.cache = targetModel.find(searchRef());
    }
    return this.cache;
  };
  
  this.remove  = function(){
    var old = this.get();
    if (old) {
      old.erase(foreignKey);
      old.save();
    }
    this.cache = null;
  };
  
  this.makeNew = function(p){
    var t = targetModel.makeNew(p);
    this.set(t);
    return t;
  };
  
  this.create = function(p){
    var t = targetModel.create(p);
    this.set(t);
    return t;
  };
  
  this.afterSave = function(){    
    if (this.callback) this.callback();
    this.callback = null;
  }
}


/**
 * Returns the association object that gets stored in the CommonInstanceProtoype
 *
 * The AssociationObject has 2 Functions:
 * - installProxy gets called in the constructor of a new instance,
 *   gets the instance and the associationName as a Parameter and installs the
 *   proxy in the instance;
 * - registerCallbacks gets called when the instancePrototype is created.
 *   it registers the associations callbacks in the instancePrototype.
 *   These callbacks can read the data of the AssociationProxy through the
 *   instance which contains the Proxy.
 *
 *  TODO: Put this text in model.js
 */
exports.hasOne = function(targetModel, options) {
  return {
    installProxy : function(instance, assocName) {
      instance[assocName] = new HasOneProxy(instance, targetModel, assocName, options);
    },
    
    registerCallbacks : function(instancePrototype, assocName) {
      instancePrototype.model.installCallback('afterSave', function(){
        this[assocName].afterSave();
      })
    }
  }
}
