var jsDump = require('test/jsdump').jsDump;
var assert = require("test/assert");
require("kupo/mongo_adapter").MongoAdapter.setConnection("kupo_test");
var Model  = require("kupo/model").Model;

// Sample Model //////////////////////////////////////////////////////////////

exports.testBelongsTo = {
  setup : function() {
    this.User = Model.define('user', {});
    this.Task = Model.define('task', {
      associations : {
        "user" : Model.belongs_to(this.User)
      }
    });
    this.User.collection().drop();
    this.Task.collection().drop();
    this.u = this.User.create({'name': "Hans Wurst"});
  },
  
  testSetSaved : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    t.setUser(this.u);
    assert.isEqual(this.u.get('_id'), t.get('user_id'));
    assert.isTrue(t.save())
    assert.isEqual("Hans Wurst", t.getUser().get('name'));
  },
  
  testSetInvalidId : function() {
    this.u.remove();
    var t = this.Task.makeNew({'topic': 'Whatever'});
    
    t.setUser(this.u.get('_id'));
    assert.isTrue(null == t.getUser());
  },
  
  testSetRemoved : function() {
    this.u.remove();
    var t = this.Task.makeNew({'topic': 'Whatever'});
    
    t.setUser(this.u);
    assert.isTrue(null == t.getUser());
  },
  
  testSetUnsaved : function() {
    //auf ungespeichertes Objekt setzen
    var u = this.User.makeNew({'name': 'Gerda'});
    var t = this.Task.makeNew({'topic': 'Whatever'});
    
    t.setUser(u);
    assert.isEqual(u, t.getUser());
    assert.isTrue(t.save());
    assert.isEqual('clean', u.state);
  },
  
  testReset : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    t.setUser(this.u);
    t.save();
    var u = this.User.makeNew({'name': 'Gerda'});
    
    t.setUser(u);
    assert.isTrue(t.save());    
    assert.isEqual('clean', u.state);
    assert.isEqual(u, t.getUser());
  },
  
  testSetNull : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    t.setUser(null);

    assert.isTrue(t.save());    
    assert.isTrue(null == t.getUser());
    assert.isTrue(!t.data.hasOwnProperty('user_id'));
  },
  
  testSurvivesReload : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    t.setUser(this.u);
    t.save();
    
    t = this.Task.find({});
    assert.isEqual("Hans Wurst", t.getUser().get('name'));    
  },
  
  testDisallowWrongModels : function() {
    
  },
  
  testSkipCache : function() {
    
  }
    
}

exports.testHasMany = {
  setup : function() {
    this.Task = Model.define('task', {});
    this.User = Model.define('user', {
      associations : {
        "tasks" : Model.has_many(this.Task)
      }
    });
    // Bolt on the dependency, this is handled by require()'s circular dependency
    // solver in production
    Model.belongs_to(this.User).apply(this.Task.instancePrototype, ['user']);
    
    this.User.collection().drop();
    this.Task.collection().drop();
    this.u = this.User.create({'name': "Hans Wurst"});
  },
  
  testFindSimple : function() {
    var t1 = this.Task.makeNew({'topic': 'Topic1'});
    var t2 = this.Task.makeNew({'topic': 'Topic2'});
    t1.setUser(this.u); t2.setUser(this.u);
    t1.save();          t2.save();
    var tasks = this.u.getTasks();
    assert.isEqual(2, tasks.length);
    assert.isEqual('Topic1', tasks[0].get('topic'));
    assert.isEqual('Topic2', tasks[1].get('topic'));
  },
  
  testAddExisting : function() {
    var t = this.Task.create({'topic': 'Whatever'});
    this.u.addToTasks(t);
    assert.isEqual('clean', this.u.state);
    assert.isEqual(this.u.get('_id'), t.get('user_id'));
    assert.isEqual(this.u.get('_id'), this.u.getTasks()[0].get('user_id'));
  },
  
  testAddNew : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    this.u.addToTasks(t);
    assert.isEqual('clean', this.u.state);
    assert.isEqual(this.u.get('_id'), t.get('user_id'));
    assert.isEqual(this.u.get('_id'), this.u.getTasks()[0].get('user_id'));    
  },
  
  testAddNewtoNew : function() {
    
  },
  
  testAddExistingToNew : function() {
    
  },
  
  testRemoveExisting : function() {
    
  },
  
  testRemoveNew : function() {
    
  },
  
  testAddNull : function() {
    
  },
  
  testAddMultiple : function() {
    
  }
  
}

// exports.testHasOne = null;
// exports.testBelongsToMany = null;
