var Support = require('kupo/support').Support;
var Common  = require('./common').Common;

/**
 * Proxy for a HasMany association
 *
 * This constructor creates a HasMany association proxy that can be attached to
 * a model instance.
 *
 * The HasMany association is a directed n-1 association from a model A to a model B with
 * the foreign keys being stored in the instances of model B.
 *
 * When you assign an object to a HasMany association, that object is automatically
 * saved (in order to update its foreign key). If you assign multiple objects in one statement,
 * then they are all saved.
 *
 * If the parent object (the one declaring the HasMany association) is unsaved
 * (state == new and doesn't have an id) then the child objects are not saved
 * when they are added. All unsaved members of the association will automatically
 * be saved when the parent is saved.
 *
 * @constructor
 * @param instance    The model instance this proxy operates on
 * @param targetModel The target model class of the association
 * @param assocName   The associations name
 * @param options     An object containing various options, currently only `foreignKey`
 */
var HasManyProxy = function(instance, targetModel, assocName, options) {
  // Should be a lookup in the matching belongsTo association, Too complicated
  var foreignKey = (options || {}).foreignKey || (instance.model.name + '_id');
  this.cache = null;
  this.newInstances = [];
  this.callbacks = [];
  
  /** Helper that generates a reference object to perform searches for associated objects */
  function searchRef(id) {
    var ref = {};
    ref[foreignKey] = id || instance.id();
    return ref;
  };
  
  /**
   * Adds objects to this association. Pass model instances or just IDs.
   * You can pass arrays or single instances
   */  
  this.add = function(objects) {
    if (!(objects instanceof Array)) objects = [objects];
    this.cache = null;
    for (var i=0; i < objects.length; i++) {
      var o = objects[i];
      if (Common.isPlainKey(o)) {
        var other = targetModel.find(searchRef(o));
        if (other == null) return;
      } else if (Common.isInstance(o, targetModel)) {
        var other = o;
      } else {
        continue;
      }

      if (instance.state != 'new') {
        other.set(foreignKey, instance.id());
        other.save();
      } else {
        this.newInstances.push(other);
        this.callbacks.push(function() {
          other.set(foreignKey, instance.id());
          other.save();
        }); //TODO mark the function with the instance, so removing removes both
      }
    };
    this.cache = null;
  };
  
  /**
   * Retrieves the objects in this association.
   * Pass true to skip the cache and retrieve the objects directly from the database
   */
  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      this.cache = instance.id() != null ? targetModel.all(searchRef()) : [];
      this.cache = this.cache.concat(this.newInstances);
    }
    return this.cache;
  };
  
  /**
   * Removes a single object from this association.
   * Pass a model instance or just an ID.
   */
  this.removeSingle = function(idOrInstance) {
    this.cache = null;
    if (Common.isPlainKey(idOrInstance)) {
      var old = targetModel.find(idOrInstance);
    } else if (Common.isInstance(idOrInstance, targetModel)) {
      var old = idOrInstance;
    } else {
      return;
    }

    if (old) {
      old.erase(foreignKey);
      old.save();
    }
    //TODO remove from newInstances aswell
  }
  
  /**
   * Removes several objects from this association.
   * Pass model instances or just IDs.
   * You can pass arrays or single instances
   */
  this.remove = function(objects){
    this.cache = null;
    if (!(objects instanceof Array)) objects = [objects];
    for (var i=0; i < objects.length; i++) {
      this.removeSingle(objects[i]);
    };
  };
  
  /**
   * Make a new instance and add it to the association
   */
  this.makeNew = function(p){
    var t = targetModel.makeNew(p);
    this.add(t);
    return t;
  };
  
  /**
   * Create an instance and add it to the association
   */
  this.create = function(p){
    var t = targetModel.create(p);
    this.add(t);
    return t;
  };
  
  /** @private */
  this.afterSave = function(){    
    if (this.callbacks.length > 0) {
      for (var i=0; i < this.callbacks.length; i++) {
        this.callbacks[i]();
      };
    }
    this.callbacks = [];
  }
}


/**
 * This function generates an association definition for this type of association
 */
exports.hasMany = function(targetModel, options) {
  return {
    installProxy : function(instance, assocName) {
      instance[assocName] = new HasManyProxy(instance, targetModel, assocName, options);
    },
    
    registerCallbacks : function(instancePrototype, assocName) {
      instancePrototype.model.installCallback('afterSave', function(){
        this[assocName].afterSave();
      })
    }
  }
}
