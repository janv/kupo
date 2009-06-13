var Model = exports.Model = function(_name, _specialization){
  var m  = {"defaultCallables" : ['all', 'find'] };
  m.name = _name;
  
  m.Instance = new InstanceConstructor(_specialization, m);
  
  m.rpcCallable = function(name) {
    for (var i=0; i < m.defaultCallables.length; i++) {
      if (m.defaultCallables[i] == name) return true;
    };
    if (_specialization.callables && _specialization.callables instanceof Array) {
      for (var i=0; i < _specialization.callables.length; i++) {
        if (_specialization.callables[i] == name) return true;
      };
    }
    return false;
  }

  m.callBack = function(context, _callback){
    if (_specialization.callbacks
        && _specialization.callbacks[_callback]) {
      var callbacks = _specialization.callbacks[_callback];
      for (var i=0; i < callbacks.length; i++) {
        callbacks[i].apply(context)
      };
    }
  };
  
  m.installCallback = function(name, fun) {
    if (!_specialization.callbacks) {
      _specialization.callbacks = {};
    }
    if (_specialization.callbacks[name]) {
      _specialization.callbacks[name].push(fun);
    } else {
      _specialization.callbacks[name] = [fun];
    }  
  }

  // register AssociationCallbacks
  for (var a in _specialization.associations) {
    _specialization.associations[a].registerCallbacks(m, a);
  }

  
  return m;
}

var InstanceConstructor = exports.InstanceConstructor = function(_specialization, _model) {
  var ip = {
    "defaultCallables" : ['update'], //TODO DefaultCallables sollten nicht zugreifbar sein
    "errors" : [],
    "state" : 'new' // new, clean, dirty, removed
  };
  
  var instanceSpec = ((_specialization || {}).instance || {});
  
  ip.model = _model;
  
  ip.installAssociationProxies = function(instance) { //TODO nach unten in die closure verschieben?
    for (var a in _specialization.associations) {
      _specialization.associations[a].installProxy(instance, a);
    }
  }
  
  //add Methods to instance Prototype
  var methods = (instanceSpec.methods || {});
  for (var m in methods) {
    if (ip[m] == undefined) ip[m] = methods[m];
  }
  
  ip.rpcCallable = function(name) {
    for (var i=0; i < ip.defaultCallables.length; i++) {
      if (ip.defaultCallables[i] == name) return true;
    };
    if (instanceSpec.callables && instanceSpec.callables instanceof Array) {
      for (var i=0; i < instanceSpec.callables.length; i++) {
        if (instanceSpec.callables[i] == name) return true;
      };
    }
    return false;
  }
  
  // PERSISTENCE METHODS
  
  ip.update = function(propData, value) {
    this.set(propData, value);
    this.save();
  }

  ip.set = function(prop, value) {
    if (typeof prop == "string" || prop instanceof String) {
      if (prop != '_id' && prop != "_ns") this.data[prop] = value;
    } else {
      var newData = prop, overwrite = value;
      delete(newData['_id']); //TODO: Ooops, hier wird auch aus dem Original gelöscht, baad
      delete(newData['_ns']);
      if (overwrite == true){
        newData._id = this.data._id;
        newData._ns = this.data._ns;
        this.data = newData;
      } else {
        for (var p in newData) {
          this.data[p] = newData[p];
        }      
      }
    }
    this.taint();
  }
  
  ip.get = function(property) {
    return this.data[property];
  }
  
  ip.id = function() {
    return this.data['_id'];
  }

  ip.taint = function() {
    if (this.state == 'clean') this.state = 'dirty';
  }

  ip.erase = function(property) {
    delete(this.data[property]);
    this.taint();
  }
  
  ip.validate = function() {
    this.errors = [];
    var s = _specialization;
    if (s.validations instanceof Array) {
      for (var i=0; i < s.validations.length; i++) {
        s.validations[i].apply(this)
      };
    }
    return (this.errors.length < 1);
  }
  
  var constructor = function(data, state) {
    this.data = data   || {};
    this.state = state || 'new';
    //TODO: New nur ohne id
    this.errors = [];
    
    // this.getData(){return data;};
    // this.setData(x){data = x;};
    // this.getState(){return state;};
    // this.setState(x){state = x};
    
    this.installAssociationProxies(this);
  }
  constructor.prototype = ip;
  
  return constructor;
}