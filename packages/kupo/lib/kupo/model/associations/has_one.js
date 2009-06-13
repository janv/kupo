var Support = require('kupo/support').Support;
var Common  = require('./common').Common;

/**
 * Proxy for a HasOne association
 *
 * This constructor creates a HasOne association proxy that can be attached to
 * a model instance.
 *
 * The HasMany association is a directed 1-1 association from a model A to a model B with
 * the foreign key being stored in the instances of model B.
 *
 * When you assign an object to a HasOne association, that object is automatically
 * saved (in order to update its foreign key).
 *
 * If the parent object (the one declaring the HasOne association) is unsaved
 * (state == new and doesn't have an id) then the child object is not saved
 * when it is added. It will automatically be saved when the parent is saved.
 *
 * @constructor
 * @param instance    The model instance this proxy operates on
 * @param targetModel The target model class of the association
 * @param assocName   The associations name
 * @param options     An object containing various options, currently only `foreignKey`
 */
var HasOneProxy = function(instance, targetModel, assocName, options) {
  // Should be a lookup in the matching belongsTo association, Too complicated
  var foreignKey = (options || {}).foreignKey || (instance.model.name + '_id');
  this.cache = null;
  this.callback = null;
  
  /** Helper that generates a reference object to perform searches for associated objects */
  function searchRef(id) {
    var ref = {};
    ref[foreignKey] = id || instance.id();
    return ref;
  }
  
  /**
   * Set the target of this association. Pass a model instance or just an ID.
   */
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
  
  /**
   * Retrieve the target of this association.
   * Pass true to skip the cache and retrieve the target directly from the database
   */
  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      if (instance.get('_id') == null) return null;
      this.cache = targetModel.find(searchRef());
    }
    return this.cache;
  };
  
  /**
   * Remove the association.
   */
  this.remove  = function(){
    var old = this.get();
    if (old) {
      old.erase(foreignKey);
      old.save();
    }
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
    
    registerCallbacks : function(model, assocName) {
      model.installCallback('afterSave', function(){
        this[assocName].afterSave();
      })
    }
  }
}
