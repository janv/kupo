var jsDump = require('test/jsdump').jsDump;
var assert = require("test/assert");
require("kupo/mongo_adapter").MongoAdapter.setConnection("kupo_test");
var Model  = require("kupo/model").Model;

// Sample Model //////////////////////////////////////////////////////////////

var Project = Model.define('project',{
  instance: {
    callables: ['finish'],
    methods: {
      incrementA : function() {
        this.set('a', this.get('a')+1);
      }
    } 
  },
  callables: ['blubb'],
  callbacks: {
    beforeProcess: [function(){
      this.beforeProcessExecuted = true;
    }],
    afterProcess: [function(){
      this.afterProcessExecuted = true;
    }]
  }
});

Project.blubb = function(x) {
  return "This is the result of the blubb test-function which multiplies the argument by 3: " + ( 3 * x ).toString()
}

// Tests /////////////////////////////////////////////////////////////////////

exports.testDefinition = {
  testSimple : function() {
    var TestModel = Model.define('test',{});
  },
  
  testDefaultsCallable : function() {
    assert.isTrue(Project.rpcCallable('all'));
    assert.isTrue(Project.rpcCallable('find'));
  },
  
  testNonDefaultsNotCallable : function() {
    assert.isTrue(!Project.rpcCallable('bingobongo'));
  },
  
  testCustomCallables : function() {
    assert.isTrue(Project.rpcCallable('blubb'));    
  },
  
  testInitSetsCollectionAndSpecialization : function() {
    assert.isTrue(Project.collection().count() >= 0);
    assert.isEqual('blubb', Project.specialization.callables[0]);
  },
  
  testDefineSetsInstancePrototype : function() {
    assert.isTrue(typeof Project.instancePrototype == 'object');
    assert.isTrue(Project.instancePrototype.state == 'new');
  },
  
  testInstDefaultsCallable : function() {
    assert.isTrue(Project.instancePrototype.rpcCallable('update'));
  },
  
  testInstNonDefaultsNotCallable : function() {
    assert.isTrue(!Project.instancePrototype.rpcCallable('palimpalim'));
  },
  
  testInstCustomCallables : function() {
    assert.isTrue(Project.instancePrototype.rpcCallable('finish'));
  },
  
  testInstRefersSpecAndModel : function() {
    assert.isEqual(Project, Project.instancePrototype.model);
    assert.isEqual(Project.specialization.instance, Project.instancePrototype.instanceSpec);
  },
  
  testInstanceMethods : function() {
    var p = Project.makeNew({a:1})
    assert.isEqual('function', typeof p.incrementA);
    assert.isEqual(1, p.get('a'));
    p.incrementA();
    assert.isEqual(2, p.get('a'));
  }
}

exports.testControllerCallbacks = function() {
  var context = {};
  assert.isTrue(!context.beforeProcessExecuted);
  assert.isTrue(!context.afterProcessExecuted);
  Project.callBack(context, 'beforeProcess');
  assert.isTrue(context.beforeProcessExecuted);
  assert.isTrue(!context.afterProcessExecuted);
  Project.callBack(context, 'afterProcess');
  assert.isTrue(context.beforeProcessExecuted);
  assert.isTrue(context.afterProcessExecuted);
  // TODO  beforeFind afterFind beforeAll afterAll
}

exports.testNewInstances = {
  testIsNew : function() {
    var p = Project.makeNew();
    assert.isEqual('new', p.state);
  },
  
  testHasData : function() {
    var p = Project.makeNew();
    assert.isTrue(typeof p.data == "object");
    p = Project.makeNew({a:1});
    assert.isEqual(1, p.get('a'));
    p = Project.makeNew({_id:123});
    assert.isTrue(!null != p.get('_id'));
  }
  
}

exports.testPersistence = {
  
  setup : function() {
    Project.collection().drop();
  },

  testCreate : function() {
    //TODO: Data und state == clean und in der Datenbank
    var p = Project.create({a:1});
    assert.isEqual('clean', p.state);
    var r = Project.collection().findOne({});
    assert.isEqual(1, p.get('a'));
  },
  
  testSetSingle : function() {
    var p = Project.create({a:1});
    p.set('b', 2);
    assert.isEqual(1, p.get('a'));
    assert.isEqual(2, p.get('b'));
  },
  
  testSetObjectMerge : function() {
    var p = Project.create({a:1});
    p.set({b: 2, c: 3});
    assert.isEqual(1, p.get('a'));
    assert.isEqual(2, p.get('b'));
    assert.isEqual(3, p.get('c'));
  },
  
  testSetObjectOverwrite : function() {
    var p = Project.create({a:1});
    p.set({b: 2, c: 3}, true);
    assert.isEqual(undefined, p.get('a'));
    assert.isEqual(2, p.get('b'));
    assert.isEqual(3, p.get('c'));
  },
  
  testErase : function() {
    var p = Project.create({a:1, b:2});
    p.erase('a');
    assert.isEqual(undefined, p.get('a'));
    assert.isEqual(2, p.get('b'));
    assert.isEqual('dirty', p.state)
  },
  
  testIdRemainsSame : function() {
    var p = Project.create({a:1, b:2});
    var id1 = p.get('_id');
    p.set('a', 1);
    p.save();
    assert.isEqual(id1, p.get('_id'));
  },
  
  testNewSave : function() {
    //neu (state new) -> daten (new) -> speichern (clean)
    var p = Project.makeNew();
    assert.isEqual('new', p.state)
    p.set({a:1, b:2});
    assert.isEqual('new', p.state)
    p.save();    
    assert.isEqual('clean', p.state)
  },
  
  testChangeCycle : function() {
    //Laden (clean) -> Ändern (dirty) -> Speichern (clean) ==> Laden (clean, daten gleich)
    var p = Project.create({a:1, b:2});
    p = Project.find(p.get('_id'));
    assert.isEqual('clean', p.state);
    p.set('c', 3);
    assert.isEqual('dirty', p.state);
    p.save();
    assert.isEqual('clean', p.state);
    var p2 = Project.find(p.get('_id'));
    assert.isEqual('clean', p2.state);
    assert.isEqual(p.get('_id'), p2.get('_id'));
    assert.isEqual(p.get('a'), p2.get('a'));
    assert.isEqual(p.get('b'), p2.get('b'));
    assert.isEqual(p.get('c'), p2.get('c'));
  },
  
  testRemove : function() {
    //Laden -> Löschen (removed)
    var p = Project.create({a:1, b:2});
    p = Project.find(p.get('_id'));
    p.remove()
    assert.isEqual('removed', p.state);
    assert.isEqual(0, Project.collection().count())
  },
  
  testRemoveDirty : function() {
    //Laden -> Ändern (dirty) -> Löschen (deleted)
    var p = Project.create({a:1, b:2});
    p = Project.find(p.get('_id'));
    p.set('c', 3)
    assert.isEqual('dirty', p.state);
    p.remove()
    assert.isEqual('removed', p.state);
    assert.isEqual(0, Project.collection().count())
  },
  
  testSaveRemoved : function() {
    //Laden -> Ändern (dirty) -> Löschen (deleted) -> Speichern (deleted und keine speicheroperation)
    var p = Project.create({a:1, b:2});
    p = Project.find(p.get('_id'));
    p.set('c', 3)
    assert.isEqual('dirty', p.state);
    p.remove()
    assert.isEqual('removed', p.state);
    p.save();
    assert.isEqual('removed', p.state);
    assert.isEqual(0, Project.collection().count())
  },
  
  testRemoveNew : function() {
    var p = Project.makeNew({a:1, b:2});
    p.remove()
    assert.isEqual('removed', p.state);
    assert.isEqual(0, Project.collection().count())
  },
  
  testEditPreservesNew : function() {
    var p = Project.makeNew();
    assert.isEqual('new', p.state);
    p.set('a', 1);
    assert.isEqual('new', p.state);
  },
  
  testEditPreservesDirty : function() {
    var p = Project.create();
    assert.isEqual('clean', p.state);
    p.set('a', 1);
    assert.isEqual('dirty', p.state);
    p.set('b', 2);
    assert.isEqual('dirty', p.state);
  },
  
  testErasePreservesNew : function() {
    var p = Project.makeNew({a:1});
    assert.isEqual('new', p.state);
    p.erase('a');
    assert.isEqual('new', p.state);
  }
  
}


exports.testCallbacks = {

  setup : function() {
    this.callbacks = {}
    this.Foo = Model.define('foo',{
      callbacks : this.callbacks
    });
    this.Foo.collection().drop();
  },

  // Not Tested, Boring
  // testBeforeValidation : function() {
  //   //TODO Implement validation
  // },
  // 
  // testBeforeValidationOnCreate : function() {
  //   //TODO Implement validation
  // },
  // 
  // testBeforeValidationOnUpdate : function() {
  //   //TODO Implement validation
  // },
  // 
  // testAfterValidation : function() {
  //   //TODO Implement validation
  // },
  // 
  // testAfterValidationOnCreate : function() {
  //   //TODO Implement validation
  // },
  // 
  // testAfterValidationOnUpdate : function() {
  //   //TODO Implement validation
  // },

  testBeforeSave : function() {
    this.callbacks['beforeSave'] = [function() {
        this.set('b', 2);
        this.set('state', this.state);
      }];
    var p = this.Foo.makeNew({a:1});
    p.save();
    assert.isEqual(2, p.get('b'));
    assert.isEqual('new', p.get('state'));
  },

  testBeforeCreate : function() {
    this.callbacks['beforeCreate'] = [function() {
        this.set('b', 2);
        this.set('state', this.state);
      }];
    var p = this.Foo.create({a:1});
    assert.isEqual(2, p.get('b'));
    assert.isEqual('new', p.get('state'));
  },

  testBeforeUpdate : function() {
    this.callbacks['beforeUpdate'] = [function() {
        this.set('b', 2);
        this.set('state', this.state);
      }];
    var p = this.Foo.create({a:1});
    p.set('c', 3);
    p.save();
    assert.isEqual(2, p.get('b'));
    assert.isEqual('dirty', p.get('state'));
  },

  testAfterCreate : function() {
    var flag = false;
    this.callbacks['afterCreate'] = [function() {
        flag = (this.state == 'clean' && this.data._id != null);
      }];
    var p = this.Foo.create({a:1});
    p.save();
    assert.isTrue(flag);
  },

  testAfterUpdate : function() {
    this.callbacks['afterUpdate'] = [function() {
        flag = (this.state == 'clean' && this.data._id != null);
      }];
    var flag = false;
    var p = this.Foo.create({a:1});
    p.set('c', 3);
    p.save();
    assert.isTrue(flag);
  },

  testAfterSave : function() {
    this.callbacks['afterSave'] = [function() {
        flag = (this.state == 'clean' && this.data._id != null);
      }];
    var flag = false;
    var p = this.Foo.makeNew({a:1});
    p.save();
    assert.isTrue(flag);
  },

  testBeforeRemove : function() {
    this.callbacks['beforeRemove'] = [function() {
        flag = (this.state != 'removed' && this.data._id != null);
      }];
    var flag = false;
    var p = this.Foo.create({a:1});
    p.remove()
    assert.isTrue(flag);
  },

  testAfterRemove : function() {
    this.callbacks['afterRemove'] = [function() {
        flag = (this.state == 'removed' && this.data._id != null);
      }];
    var flag = false;
    var p = this.Foo.create({a:1});
    p.remove()
    assert.isTrue(flag);
  },

}

exports.testValidations = {
  setup : function() {
    this.validations = [];
    this.Foo = Model.define('foo',{
      validations : this.validations
    });
    this.Foo.collection().drop();
    this.foop = this.Foo.makeNew({a:1});
  },

  testExecute : function() {
    this.validations.push(function(){
      this.xxx = 123
    });
    this.foop.save()
    assert.isEqual(123, this.foop.xxx);
  },
  
  testPreventSaving : function() {
    this.validations.push(function(){
      this.errors.push("Something wrong");
    });
    this.foop.set('b', 2);
    assert.isTrue(!this.foop.save());
    assert.isEqual('new', this.foop.state);
    assert.isEqual("Something wrong", this.foop.errors[0]);
  },
  
  testInOrder : function() {
    var order = [];
    this.validations.push(function(){
      order.push(1);
    });
    this.validations.push(function(){
      order.push(2);
    });
    this.foop.validate();
    assert.isEqual(1, order[0]);
    assert.isEqual(2, order[1]);
  },
  
  testErrors : function() {}
}