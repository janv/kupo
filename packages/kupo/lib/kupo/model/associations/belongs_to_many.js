var Support = require('kupo/support').Support;
var Common  = require('./common').Common;

/**
 * Proxy for a BelongsToMany association
 *
 * This constructor creates a BelongsToMany association proxy that can be attached to
 * a model instance.
 *
 * The BelongsToMany association is a directed 1-n association from a model A to a model B with
 * the foreign keys being stored in an array in instances of model A.
 *
 * Adding an object to a BelongsToMany association does not automatically save
 * the object. It does not save the associated object either.
 * Adding a new object B (not stored in the DB, so it doesn't have an ID yet)
 * to the association in A, marks A as dirty and saves B as soon as A is saved.
 *
 * @constructor
 * @param instance    The model instance this proxy operates on
 * @param targetModel The target model class of the association
 * @param assocName   The associations name
 * @param options     An object containing various options, currently only `foreignKey`
 */
var BelongsToManyProxy = function(instance, targetModel, assocName, options) {
  var foreignKey = (options || {}).foreignKey || (assocName + '_ids');
  this.cache        = null;
  this.newIds       = [];
  this.newInstances = [];
  
  /**
   * Merge new Ids that have just been added into the list of foreign ids
   * in the object's data property
   *
   * @private
   */
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
  
  /**
   * Adds objects to this association. Pass model instances or just IDs.
   * You can pass arrays or single instances
   */
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

  /**
   * Retrieves the objects in this association.
   * Pass true to skip the cache and retrieve the objects directly from the database
   */
  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      if (instance.get(foreignKey) == null) return null;
      this.cache = targetModel.all({'_id' : { '$in' : instance.get(foreignKey)}});
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
  
  /**
   * Removes several objects from this association.
   * Pass model instances or just IDs.
   * You can pass arrays or single instances
   */
  this.remove  = function(objects){
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
 * This function generates an association definition for this type of association
 */
exports.belongsToMany = function(targetModel, options) {
  return {
    installProxy : function(instance, assocName) {
      instance[assocName] = new BelongsToManyProxy(instance, targetModel, assocName, options);
    },
    
    registerCallbacks : function(model, assocName) {
      model.installCallback('beforeSave', function(){
        this[assocName].beforeSave();
      })
    }
  }
}
