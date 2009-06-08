var Support = require('kupo/support').Support;

/**
 * Creates a belongs-to association to be stored in the specialization.associations
 * under the associations name.
 * Pass the model you want to associate with. Actually returns a initialization
 * function that gets called upon intitialization of the InstancePrototype and augments
 * it with accessors for the association.
 */
exports.has_many = function(model, options) {
  // this gets called in the context of the Instance Prototype, creating the
  // accessor functions
  return function(assocName) {
    var ownKey = this.model.name + "_id"

    this.unsavedHasManyAssociations = [];
    this.unsavedHasManyCallbacks    = [];
    
    //create get Function
    this['get' + Support.capitalize(assocName) ] = function() {
      if (this.get('_id') != null) {
        var ref = {};
        ref[ownKey] = this.get('_id');
        var dbobjects = model.all(ref);
      } else {
        var dbobjects = [];
      }
      var arr = this.unsavedHasManyAssociations.concat(dbobjects);
      return arr;
    }
    
    // Working with these Callback generators to prevent a weird scoping bug
    // where changes in o in the loop would affect previously created callbacks
    function setCallback(ownKey, ob) {
      return function(host){ob.set(ownKey, host.get('_id'))};
    };
    function saveCallback(ob) {
      return function() {ob.save()};
    };
    
    //create add Function
    this['addTo' + Support.capitalize(assocName) ] = function(objects) {
      if (!(objects instanceof Array)) objects = [objects];
      for (var i=0; i < objects.length; i++) {
        var o = objects[i];
        if (o == null) continue;
        if (this.get('_id') != null) { // We have an id, assign it immediately
          o.set(ownKey, this.get('_id'));
        } else { // We don't have an id, defer assignment to afterSave
          this.unsavedHasManyCallbacks.push(setCallback(ownKey, o));
        }
        //TODO: Bei state == removed nen Fehler werfen
        this.unsavedHasManyCallbacks.push(saveCallback(o));
        this.unsavedHasManyAssociations.push(o);
      };
      if (this.unsavedHasManyCallbacks.length > 0) this.taint();
    }
    
    
    //create remove function
    this['removeFrom' + Support.capitalize(assocName) ] = function(objects) {
      if (!(objects instanceof Array)) objects = [objects];
      for (var i=0; i < objects.length; i++) {
        var o = objects[i];
        //remove from Database
        if (this.get('_id') != null && o.get(ownKey) == this.get('_id')) {
          var originalState = o.state;
          o.erase(ownKey);
          if (originalState == 'clean') o.save();
        }
        //remove from Cache
        for (var n=0; n < this.unsavedHasManyAssociations.length; n++) {
          if (this.unsavedHasManyAssociations[n] == o) this.unsavedHasManyAssociations.splice(i,1)
        };
      };
    }
    
    //install save callback
    var callback = function() {
      for (var i=0; i < this.unsavedHasManyCallbacks.length; i++) {
        this.unsavedHasManyCallbacks[i](this);
      };
      this.unsavedHasManyAssociations = [];
      this.unsavedHasManyCallbacks    = [];
    }
    
    this.model.installCallback('afterSave', callback);
  }
}
