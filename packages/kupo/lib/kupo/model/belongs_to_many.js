var Support = require('kupo/support').Support;

exports.belongs_to_many = function(model, options) {
  var foreignKeys = model.name + "_ids"
  
  // this gets called in the context of the Instance Prototype, creating the
  // accessor functions
  return function(assocName) {
    //create set Function
    /**
     * Sets the association to an object or an id.
     * Pass in null to remove the association.
     */
    this['addTo' + Support.capitalize(assocName) ] = function(objects) {
      if (!(objects instanceof Array)) objects = [objects];

      // Gather new ids
      var newIds = [];
      for (var i=0; i < objects.length; i++) {
        var o = objects[i];
        if (o == null) continue;
        if (o instanceof Object && o.get('_id') != null) {
          newIds.push(o.get('_id'));
        } else {
          newIds.push(o)
        }
      };
      //Gather old ids
      var oldIds = this.get(foreignKeys) || [];
      //merge arrays and remove duplicates
      var ids = newIds.concat(oldIds).sort();
      if (ids.length > 1) {
        for (var i = ids.length - 1; i >= 0; i--){
          if (ids[i-1] == ids[i]) ids.splice(id-1, 1);
        };
      }
      
      this.set(foreignKeys, ids);
    }
    
    //create get Function
    /**
     * Returns the instance referenced by the association.
     */
    this['get' + Support.capitalize(assocName)] = function(skipCache) {
      if (!this.associationCache[assocName] || (skipCache == true)) {
        if (this.get(foreignKeys) == null) return [];
        this.associationCache[assocName] = model.all({'_id' : { '$in' : this.get(foreignKeys)}});
      }
      return this.associationCache[assocName];
    }
    
    this['removeFrom' + Support.capitalize(assocName) ] = function(objects) {
      if (!(objects instanceof Array)) objects = [objects];

      // Gather new ids
      var deleteIds = [];
      for (var i=0; i < objects.length; i++) {
        var o = objects[i];
        if (o == null) continue;
        if (o instanceof Object && o.get('_id') != null) {
          deleteIds.push(o.get('_id'));
        } else {
          deleteIds.push(o)
        }
      };

      //Gather old ids
      var ids = this.get(foreignKeys) || [];
      //merge arrays and remove duplicates
      for (var i = ids.length - 1; i >= 0; i--){
        for (var j = deleteIds.length - 1; j >= 0; j--){
          if (ids[i] == deleteIds[j]) ids.splice(i, 1);
        };
      };
      
      this.set(foreignKeys, ids);
    }
    
    //install save callback
    var callback = function() {
    }
    this.model.installCallback('beforeSave', callback);
  }  
}
