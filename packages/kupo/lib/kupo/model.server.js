var generic = require('./model.js');

var Errors = require('kupo/errors').Errors;
var MongoAdapter = require('kupo/mongo_adapter').MongoAdapter
var Support = require('kupo/support').Support;

//Connection
var conn = MongoAdapter.getConnection();

var ClassPrototype = exports.ClassPrototype = Object.create(generic.ClassPrototype);

/**
 * Pass a reference Object and returns a Mongo DBCursor
 *
 * @param ref A MongoDB reference object for QBE
 */
ClassPrototype.all = function(ref) {
  var self = this;
  return this.collection().find(ref || {}).map(function(o){
    return self.makeInstance(o, 'clean');
  })
}

/**
 * Pass a reference Object and returns the first found object (or null)
 *
 * @param ref A MongoDB reference object for QBE
 */
ClassPrototype.find = function(ref) {
  if (typeof ref == 'object') {
    var result = this.collection().findOne(ref);
  } else { // ref.toString().match(/^[abcdef\d]+$/
    var result = this.collection().findId(ref);
  }
  if (result == null) {
    return result;
  } else {
    return this.makeInstance(result, 'clean');
  }
}

var CommonInstancePrototype = exports.CommonInstancePrototype = Object.create(generic.CommonInstancePrototype)
/**
 * Save this object to the database
 *
 * @return true if the object was saved, false if it wasn't
 */
CommonInstancePrototype.save = function() {
  var c = this.model.collection();
  switch (this.state) {
    case 'new':
      delete(this.data['_id']);
      this.model.callBack(this, 'beforeValidation');
      this.model.callBack(this, 'beforeValidationOnCreate');
      var valid = this.validate();
      this.model.callBack(this, 'afterValidation');
      this.model.callBack(this, 'afterValidationOnCreate');

      if (valid) {
        this.model.callBack(this, 'beforeSave');
        this.model.callBack(this, 'beforeCreate');
        this.data = c.insert(this.data);
        this.state = 'clean'
        this.model.callBack(this, 'afterCreate');
        this.model.callBack(this, 'afterSave');
        return true;
      } else {
        return false;
      }
    case 'dirty':
      this.model.callBack(this, 'beforeValidation');
      this.model.callBack(this, 'beforeValidationOnUpdate');
      var valid = this.validate();
      this.model.callBack(this, 'afterValidation');
      this.model.callBack(this, 'afterValidationOnUpdate');

      if (valid) {
        this.model.callBack(this, 'beforeSave');
        this.model.callBack(this, 'beforeUpdate');
        this.data = c.update({'_id': this.data._id}, this.data, true, true);
        this.state = 'clean'
        this.model.callBack(this, 'afterUpdate');
        this.model.callBack(this, 'afterSave');
        return true;
      } else {
        return false;
      }
    case 'clean':
      return false;
    case 'removed':
      return false;
  }
}

/**
 * Remove this Instance from the database
 */
CommonInstancePrototype.remove = function() {
  this.model.callBack(this, 'beforeRemove');
  if (this.state != 'new') this.model.collection().remove({'_id' : this.data['_id']});
  this.state = 'removed';
  this.model.callBack(this, 'afterRemove');
}

// Remoting callbacks ////////////////////////////////////////////////////////

/**
 * Creates a new instance from the data, saves it and returns the data of the
 * created instance (which might have been changed by model callbacks).
 *
 * Returns the new data or throws an error. Necessary to return the new data
 * back to the client or communicate errors.
 */
var remoteCreate = function() {
  if (this.target == this.model && this.jrpcRequest.getMethodName() == 'create') {
    var instance = this.result;
    if (instance.state == 'clean') {
      return instance.data;
    } else {
      throw new Errors.InternalError("The instance could not be saved", {description: instance.errors})
    }
  }
}

/**
 * Callback to handle Update call from the client.
 *
 * Returns the new data or throws an error. Necessary to return the new data
 * back to the client or communicate errors.
 */
var remoteUpdate = function() {
  if (this.target != this.model && this.jrpcRequest.getMethodName() == 'update') {
    var success = this.result;
    if (success) { 
      this.result = this.target.data;
    } else {
      throw new Errors.InternalError("The instance could not be saved", {description: this.target.errors})
    }
  }
}

// Prototypes ////////////////////////////////////////////////////////////////

var InstancePrototype = InstancePrototype = function(model) {
  generic.InstancePrototype.call(this, model); //super call
  
}
InstancePrototype.prototype = CommonInstancePrototype;

var Model = exports.Model = function(_name, _spec) {
  generic.Model.call(this, _name, _spec) //super call
  this.instancePrototype = new InstancePrototype(this)
  var collection = conn.getCollection(_name);
  this.collection = function() {return collection;}
  
  this.installCallback('afterProcess', remoteUpdate);
  this.installCallback('afterProcess', remoteCreate);
}
Model.prototype = ClassPrototype;
