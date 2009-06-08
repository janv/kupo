var Support = require('kupo/support').Support;
var Common  = require('./common').Common;

var HasManyProxy = function(instance, targetModel, assocName, options) {
  // Eigentlich so, statt instance.model.name aber lookup im belongs to
  var foreignKey = (options || {}).foreignKey || (instance.model.name + '_id');
  this.cache = null;
  this.newInstances = [];
  this.callbacks = [];
  
  function searchRef(id) {
    var ref = {};
    ref[foreignKey] = id || instance.id();
    return ref;
  };
  
  this.add = function(objects) {
    if (!(objects instanceof Array)) objects = [objects];
    this.cache = null;
    for (var i=0; i < objects.length; i++) {
      var o = objects[i];
      if (Common.isPlainKey(o)) {
        var other = targetModel.find(searchRef(o));
        if (other == null) return;
      } else if (Common.isInstance(o, targetModel.instancePrototype)) {
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
        })
      }
    };
    this.cache = null;
  };
  
  this.get = function(skipCache){
    if (!this.cache || (skipCache == true)) {
      this.cache = instance.id() != null ? targetModel.all(searchRef()) : [];
      this.cache = this.cache.concat(this.newInstances);
    }
    return this.cache;
  };
  
  this.removeSingle = function(idOrInstance) {
    this.cache = null;
    if (Common.isPlainKey(idOrInstance)) {
      var old = targetModel.find(idOrInstance);
    } else if (Common.isInstance(idOrInstance, targetModel.instancePrototype)) {
      var old = idOrInstance;
    } else {
      return;
    }

    if (old) {
      old.erase(foreignKey);
      old.save();
    }
  }
  
  this.remove = function(objects){
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




//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// var Support = require('kupo/support').Support;
// 
// /**
//  * Creates a belongs-to association to be stored in the specialization.associations
//  * under the associations name.
//  * Pass the model you want to associate with. Actually returns a initialization
//  * function that gets called upon intitialization of the InstancePrototype and augments
//  * it with accessors for the association.
//  */
// exports.hasMany = function(model, options) {
//   // this gets called in the context of the Instance Prototype, creating the
//   // accessor functions
//   return function(assocName) {
//     var ownKey = this.model.name + "_id"
// 
//     this.unsavedHasManyAssociations = [];
//     this.unsavedHasManyCallbacks    = [];
//     
//     //create get Function
//     this['get' + Support.capitalize(assocName) ] = function() {
//       if (this.get('_id') != null) {
//         var ref = {};
//         ref[ownKey] = this.get('_id');
//         var dbobjects = model.all(ref);
//       } else {
//         var dbobjects = [];
//       }
//       var arr = this.unsavedHasManyAssociations.concat(dbobjects);
//       return arr;
//     }
//     
//     // Working with these Callback generators to prevent a weird scoping bug
//     // where changes in o in the loop would affect previously created callbacks
//     function setCallback(ownKey, ob) {
//       return function(host){ob.set(ownKey, host.get('_id'))};
//     };
//     function saveCallback(ob) {
//       return function() {ob.save()};
//     };
//     
//     //create add Function
//     this['addTo' + Support.capitalize(assocName) ] = function(objects) {
//       if (!(objects instanceof Array)) objects = [objects];
//       for (var i=0; i < objects.length; i++) {
//         var o = objects[i];
//         if (o == null) continue;
//         if (this.get('_id') != null) { // We have an id, assign it immediately
//           o.set(ownKey, this.get('_id'));
//         } else { // We don't have an id, defer assignment to afterSave
//           this.unsavedHasManyCallbacks.push(setCallback(ownKey, o));
//         }
//         //TODO: Bei state == removed nen Fehler werfen
//         this.unsavedHasManyCallbacks.push(saveCallback(o));
//         this.unsavedHasManyAssociations.push(o);
//       };
//       if (this.unsavedHasManyCallbacks.length > 0) this.taint();
//     }
//     
//     
//     //create remove function
//     this['removeFrom' + Support.capitalize(assocName) ] = function(objects) {
//       if (!(objects instanceof Array)) objects = [objects];
//       for (var i=0; i < objects.length; i++) {
//         var o = objects[i];
//         //remove from Database
//         if (this.get('_id') != null && o.get(ownKey) == this.get('_id')) {
//           var originalState = o.state;
//           o.erase(ownKey);
//           if (originalState == 'clean') o.save();
//         }
//         //remove from Cache
//         for (var n=0; n < this.unsavedHasManyAssociations.length; n++) {
//           if (this.unsavedHasManyAssociations[n] == o) this.unsavedHasManyAssociations.splice(i,1)
//         };
//       };
//     }
//     
//     //install save callback
//     var callback = function() {
//       for (var i=0; i < this.unsavedHasManyCallbacks.length; i++) {
//         this.unsavedHasManyCallbacks[i](this);
//       };
//       this.unsavedHasManyAssociations = [];
//       this.unsavedHasManyCallbacks    = [];
//     }
//     
//     this.model.installCallback('afterSave', callback);
//   }
// }
