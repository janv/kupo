var Support = require('kupo/support').Support;
var Common  = require('./common').Common;


var BelongsToProxy = function(instance, targetModel, assocName, options) {
  var foreignKey = (options || {}).foreignKey || (assocName + '_id');
  this.cache = null;
  this.beforeSaveCallbacks = [];
  
  this.set = function(idOrInstance){
    if (Common.isPlainKey(idOrInstance)) {
      instance.set(foreignKey, idOrInstance);      
    } else if (Common.isNewInstance(idOrInstance, targetModel.instancePrototype)) {
      this.beforeSaveCallbacks.push(function(){
        idOrInstance.save();
        instance.set(foreignKey, idOrInstance.id());
        //TODO Fehlerbehandlung
      });
      this.cache = idOrInstance;
      instance.taint()
    } else if (Common.isInstance(idOrInstance, targetModel.instancePrototype)) {
      instance.set(foreignKey, idOrInstance.id());     
    }
  };
  
  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      if (instance.get(foreignKey) == null) return null;
      this.cache = targetModel.find(instance.get(foreignKey));
    }
    return this.cache;
  };
  
  this.remove  = function(){
    instance.erase(foreignKey);
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
  
  this.beforeSave = function(){
    for (var i=0; i < this.beforeSaveCallbacks.length; i++) {
      this.beforeSaveCallbacks[i]();
    };
    this.beforeSaveCallbacks = [];
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
exports.belongsTo = function(targetModel, options) {
  return {
    installProxy : function(instance, assocName) {
      instance[assocName] = new BelongsToProxy(instance, targetModel, assocName, options);
    },
    
    registerCallbacks : function(instancePrototype, assocName) {
      instancePrototype.model.installCallback('beforeSave', function(){
        this[assocName].beforeSave();
      })
    }
  }
}