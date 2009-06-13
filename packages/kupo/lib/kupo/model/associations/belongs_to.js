var Support = require('kupo/support').Support;
var Common  = require('./common').Common;

/**
 * Proxy for a BelongsTo association
 *
 * This constructor creates a BelongsTo association proxy that can be attached to
 * a model instance.
 *
 * The BelongsTo association is a directed 1-1 association from a model A to a model B with
 * the foreign key being stored in instances of model A.
 *
 * Assigning an object to a BelongsTo association does not automatically save
 * the object. It does not save the associated object either.
 * Assigning a new object B (not stored in the DB, so it doesn't have an ID yet)
 * to the association in A, marks A as dirty and saves B as soon as A is saved.
 *
 * @constructor
 * @param instance    The model instance this proxy operates on
 * @param targetModel The target model class of the association
 * @param assocName   The associations name
 * @param options     An object containing various options, currently only `foreignKey`
 */
var BelongsToProxy = function(instance, targetModel, assocName, options) {
  var foreignKey = (options || {}).foreignKey || (assocName + '_id');
  this.cache = null;
  this.beforeSaveCallbacks = [];
  
  /**
   * Set the target of this association. Pass a model instance or just an ID.
   */
  this.set = function(idOrInstance){
    if (Common.isPlainKey(idOrInstance)) {
      instance.set(foreignKey, idOrInstance);      
    } else if (Common.isNewInstance(idOrInstance, targetModel)) {
      this.beforeSaveCallbacks.push(function(){
        idOrInstance.save();
        instance.set(foreignKey, idOrInstance.id());
        //TODO Fehlerbehandlung
      });
      this.cache = idOrInstance;
      instance.taint()
    } else if (Common.isInstance(idOrInstance, targetModel)) {
      instance.set(foreignKey, idOrInstance.id());     
    }
  };
  
  /**
   * Retrieve the target of this association.
   * Pass true to skip the cache and retrieve the target directly from the database
   */
  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      if (instance.get(foreignKey) == null) return null;
      this.cache = targetModel.find(instance.get(foreignKey));
    }
    return this.cache;
  };
  
  /**
   * Remove the association.
   */
  this.remove  = function(){
    instance.erase(foreignKey);
    this.cache = null;
  };
  
  /**
   * Make a new instance and set it as the target of this association
   */
  this.makeNew = function(p){
    var t = targetModel.makeNew(p);
    this.set(t);
    return t;
  };
  
  /**
   * Create an instance and set it as the target of this association
   */
  this.create = function(p){
    var t = targetModel.create(p);
    this.set(t);
    return t;
  };
  
  /** @private */
  this.beforeSave = function(){
    for (var i=0; i < this.beforeSaveCallbacks.length; i++) {
      this.beforeSaveCallbacks[i]();
    };
    this.beforeSaveCallbacks = [];
  }
}

/**
 * This function generates an association definition for this type of association
 */
exports.belongsTo = function(targetModel, options) {
  return {
    installProxy : function(instance, assocName) {
      instance[assocName] = new BelongsToProxy(instance, targetModel, assocName, options);
    },
    
    registerCallbacks : function(model, assocName) {
      model.installCallback('beforeSave', function(){
        this[assocName].beforeSave();
      })
    }
  }
}