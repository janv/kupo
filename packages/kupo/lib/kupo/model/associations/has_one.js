var Support = require('kupo/support').Support;

/**
 * Creates a belongs-to association to be stored in the specialization.associations
 * under the associations name.
 * Pass the model you want to associate with. Actually returns a initialization
 * function that gets called upon intitialization of the InstancePrototype and augments
 * it with accessors for the association.
 */
exports.hasOne = function(model, options) {
  // this gets called in the context of the Instance Prototype, creating the
  // accessor functions
  return function(assocName) {
    var ownKey = this.model.name + "_id"
    
    this['get' + Support.capitalize(assocName)] = function(skipCache) {
      if (!this.associationCache[assocName] || (skipCache == true)) {
        if (this.get('_id') == null) return null;
        var ref = {}; ref[ownKey] = this.get('_id');
        this.associationCache[assocName] = model.find(ref);
      }
      return this.associationCache[assocName];
    }

    this['set' + Support.capitalize(assocName)] = function(idOrInstance) {
      if (idOrInstance == null) return;
      if (idOrInstance.toString().match(/^[abcdef\d]+$/)) {
        idOrInstance = model.findId(idOrInstance);
        if (idOrInstance == null) return;
      }
      if (this.get('_id') != null) {
        idOrInstance.set(ownKey, this.get('_id'));
      }
      this.associationCache[assocName] = idOrInstance;
      this.taint();
    }

    this['remove' + Support.capitalize(assocName)] = function() {
      if (this.associationCache[assocName]) {
        this.associationCache[assocName].erase(ownKey);
        this.associationCache[assocName].save();
      }
      delete(this.associationCache[assocName]);
      var ref = {}; ref[ownKey] = this.get('_id');
      var o = model.find(ref);
      if (o) {
        o.erase(ownKey);
        o.save();
      }
    }

    //install save callback
    var callback = function() {
      var assoc = this['get' + Support.capitalize(assocName)]();
      if (assoc) {
        if (assoc.get(ownKey) == null) assoc.set(ownKey, this.get('_id'));
        assoc.save();
      }
    }
    
    this.model.installCallback('afterSave', callback);
  }
  
}