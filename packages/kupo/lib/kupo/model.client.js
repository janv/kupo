var generic = require('./model.js');
var Support = require('kupo/support').Support;
var JRPCConnection = require('kupo/jrpc_connection').JRPCConnection;
require('object');

var ClassPrototype = exports.ClassPrototype = Object.create(generic.ClassPrototype);

ClassPrototype.wrap = function(objects) {
  klass = this;
  function wrapSingle(o) {
    return klass.makeInstance(o.data, o.state)
  }
  if (!(objects instanceof Array)) objects = [objects];
  for (var i=0; i < objects.length; i++) {
    objects[i] = wrapSingle(objects[i])
  };
  return objects;
}

/**
 * Pass a reference Object and returns a Mongo DBCursor
 *
 * @param ref A MongoDB reference object for QBE
 */
ClassPrototype.all = function(ref) {
  return this.wrap(this.connection.call('all', ref));
}

/**
 * Pass a reference Object and returns the first found object (or null)
 *
 * @param ref A MongoDB reference object for QBE
 */
ClassPrototype.find = function(ref) {
  return this.wrap(this.connection.call('find', ref));
}



var CommonInstancePrototype = exports.CommonInstancePrototype = Object.create(generic.CommonInstancePrototype)
/**
 * Save this object to the database
 *
 * @return true if the object was saved, false if it wasn't
 */
CommonInstancePrototype.save = function() {
  var c = this.model.connection;
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
        this.data = c.call('remote_create', this.data); // TODO Handle thrown errors correctly
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
        this.data = c.onId(this.id()).call('remote_update', this.data) // TODO Handle thrown errors correctly
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
  if (this.state != 'new') {
    this.model.connection.onID(this.id()).call('remove');
  }
  this.state = 'removed';
  this.model.callBack(this, 'afterRemove');
}

var InstancePrototype = InstancePrototype = function(model) {
  generic.InstancePrototype.call(this, model); //super call
}
InstancePrototype.prototype = CommonInstancePrototype;

var Model = exports.Model = function(_name, _spec) {
  generic.Model.call(this, _name, _spec) //super call
  this.instancePrototype = new InstancePrototype(this)
  this.connection = new JRPCConnection('/' + _name);
}
Model.prototype = ClassPrototype;

