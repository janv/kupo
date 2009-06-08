var Support = require('kupo/support').Support;
var Common  = require('./common').Common;


var BelongsToManyProxy = function(instance, targetModel, assocName, options) {
  var foreignKey = (options || {}).foreignKey || (assocName + '_ids');
  this.cache        = null;
  this.newIds       = [];
  this.newInstances = [];
  
  /** Merge new Ids into old ones */
  this.mergeNewIds = function() {
    var oldIds = instance.get(foreignKey) || [];
    var ids = oldIds.concat(this.newIds).sort();
    if (ids.length > 1) {
      for (var i = ids.length - 1; i >= 0; i--){
        if (ids[i-1] == ids[i]) ids.splice(id-1, 1);
      };
    }
    instance.set(foreignKey, ids);
    this.newIds = [];
  }
  
  this.add = function(objects) {
    if (!(objects instanceof Array)) objects = [objects];
    this.cache = null;

    // Gather new ids
    var newIds = [];
    for (var i=0; i < objects.length; i++) {
      var o = objects[i];
      if (Common.isPlainKey(o)) {
        this.newIds.push(o);
      } else if (Common.isNewInstance(o, targetModel)) {
        this.newInstances.push(o);
      } else if (Common.isInstance(o, targetModel)) {
        this.newIds.push(o.id());
      }
    };
    
    this.mergeNewIds();
  }

  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      if (instance.get(foreignKey) == null) return null;
      this.cache = targetModel.all({'_id' : { '$in' : instance.get(foreignKey)}});
      this.cache = this.cache.concat(this.newInstances);
    }
    return this.cache;
  };
  
  this.removeSingle = function(idOrInstance) {
    this.cache = null;
    if (Common.isNewInstance(idOrInstance, targetModel)) {
      for (var i = this.newInstances.length - 1; i >= 0; i--){
        if (this.newInstances[i] == idOrInstance) this.newInstances.splice(i, 1);
      };
      return;
    }
    
    if (Common.isPlainKey(idOrInstance)) {
      var id = idOrInstance;
    } else if (Common.isInstance(idOrInstance)) {
      var id = idOrInstance.id();
    } else {
      return;
    }
    
    var ids = instance.get(foreignKey);
    for (var i = ids.length - 1; i >= 0; i--){
      if (ids[i] == id) ids.splice(i, 1);
    };
    instance.set(foreignKey, ids);
  }
  
  this.remove  = function(objects){
    this.cache = null;
    if (!(objects instanceof Array)) objects = [objects];
    for (var i=0; i < objects.length; i++) {
      this.removeSingle(objects[i]);
    };
  };
  
  this.makeNew = function(p){
    var t = targetModel.makeNew(p);
    this.add(t);
    return t;
  };
  
  this.create = function(p){
    var t = targetModel.create(p);
    this.add(t);
    return t;
  };
  
  this.beforeSave = function(){
    for (var i=0; i < this.newInstances.length; i++) {
      this.newInstances[i].save();
      this.newIds.push(this.newInstances[i].id());
    };
    this.newInstances = [];
    this.mergeNewIds();
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
exports.belongsToMany = function(targetModel, options) {
  return {
    installProxy : function(instance, assocName) {
      instance[assocName] = new BelongsToManyProxy(instance, targetModel, assocName, options);
    },
    
    registerCallbacks : function(instancePrototype, assocName) {
      instancePrototype.model.installCallback('beforeSave', function(){
        this[assocName].beforeSave();
      })
    }
  }
}
