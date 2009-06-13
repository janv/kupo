var generic = require('./model.js');

var Errors = require('kupo/errors').Errors;
var MongoAdapter = require('kupo/mongo_adapter').MongoAdapter
var Support = require('kupo/support').Support;

//Connection
var conn = MongoAdapter.getConnection();


var Model = exports.Model = function(_name, _specialization){
  var m = new generic.Model(_name, _specialization);

  // Overwrite Instance constructor with the server-specififc one
  m.Instance = new InstanceConstructor(_specialization, m);
  
  var collection = conn.getCollection(_name);
  m.collection = function() {return collection;}
  
  m.all = function(ref) {
    ref = ref || {};
    return collection.find(ref).map(function(o){
      return new m.Instance(o, 'clean');
    })
  }
  
  m.find = function(ref) {
    if (ref.toString().match(/^[abcdef\d]+$/)) {
      var result = collection.findId(ref);
    } else {
      var result = collection.findOne(ref);
    }
    if (result == null) {
      return result;
    } else {
      return new m.Instance(result, 'clean');
    }
  }
  
  m.makeNew = function(data) {
    data = data || {};
    delete(data['_id']);
    return new m.Instance(data, 'new');
  }
  
  m.create = function(data) {
    var i = m.makeNew(data);
    i.save();
    return i;
  }
  
  return m
  
}

var InstanceConstructor = exports.InstanceConstructor = function(_specialization, _model) {
  var constructor = new generic.InstanceConstructor(_specialization, _model);
  constructor.prototype.save = function() {
    var c = _model.collection();
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

  constructor.prototype.remove = function() {
    this.model.callBack(this, 'beforeRemove');
    if (this.state != 'new') this.model.collection().remove({'_id' : this.data['_id']});
    this.state = 'removed';
    this.model.callBack(this, 'afterRemove');
  }
  
  return constructor;
}