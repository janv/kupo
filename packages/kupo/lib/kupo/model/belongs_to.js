var Support = require('kupo/support').Support;

/**
 * Creates a belongs-to association to be stored in the specialization.associations
 * under the associations name.
 * Pass the model you want to associate with. Actually returns a initialization
 * function that gets called upon intitialization of the InstancePrototype and augments
 * it with accessors for the association.
 */
exports.belongs_to = function(model, options) {
  var foreignKey = model.name + "_id"
  
  // this gets called in the context of the Instance Prototype, creating the
  // accessor functions
  return function(assocName) {
    //create set Function
    /**
     * Sets the association to an object or an id.
     * Pass in null to remove the association.
     */
    this['set' + Support.capitalize(assocName)] = function(idOrInstance) {
      if (idOrInstance == null) {
        this.erase(foreignKey);
        delete(this.associationCache[assocName]);
      } else if (idOrInstance.toString().match(/^[abcdef\d]+$/)) {
        this.set(foreignKey, idOrInstance.toString());
      } else {
        if (idOrInstance.state != 'removed') {
          this.set(foreignKey, idOrInstance.get('_id'));
          this.associationCache[assocName] = idOrInstance;
        }
      }
    }
    
    //create get Function
    /**
     * Returns the instance referenced by the association.
     */
    this['get' + Support.capitalize(assocName)] = function(skipCache) {
      if (!this.associationCache[assocName] || (skipCache == true)) {
        if (this.get(foreignKey) == null) return null;
        this.associationCache[assocName] = model.find(this.get(foreignKey));
      }
      return this.associationCache[assocName];
    }
    
    //install save callback
    var callback = function() {
      var assoc = this['get' + Support.capitalize(assocName)]();
      if (assoc) assoc.save();
    }
    
    this.model.installCallback('beforeSave', callback);
  }
}
