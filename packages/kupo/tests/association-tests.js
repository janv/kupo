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
    //TODO Implement
  },
  
  testSkipCache : function() {
    //TODO Implement
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
    assert.isEqual('dirty', this.u.state);
    assert.isEqual(this.u.get('_id'), t.get('user_id'));
    assert.isEqual(this.u.get('_id'), this.u.getTasks()[0].get('user_id'));
  },
  
  testAddNew : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    this.u.addToTasks(t);
    assert.isEqual('new', t.state);
    assert.isEqual('dirty', this.u.state);
    assert.isEqual(this.u.get('_id'), t.get('user_id'));
    assert.isEqual(this.u.get('_id'), this.u.getTasks()[0].get('user_id'));
  },
  
  testAddNewtoNew : function() {
    var u = this.User.makeNew({'name': 'Hans'});
    var t = this.Task.makeNew({'topic': 'Whatever'});
    u.addToTasks(t);
    assert.isEqual('new', u.state, "User is new");
    assert.isEqual('new', t.state, "Task is new");
    u.save()
    assert.isEqual('clean', u.state, "User is clean after saving");
    assert.isEqual('clean', t.state, "Task is clean after saving user");
    assert.isEqual(u.get('_id'), t.get('user_id'), "Task.user_id matches user._id");
    assert.isEqual(u.get('_id'), u.getTasks()[0].get('user_id'), "Task(from u.getTasks).user_id matches user._id");
  },
  
  testAddExistingToNew : function() {
    var u = this.User.makeNew({'name': 'Hans'});
    assert.isEqual(0, u.getTasks().length, "GetTasks returns 0 before creating a task");
    var t = this.Task.create({'topic': 'Whatever'});
    assert.isEqual(0, u.getTasks().length, "GetTasks returns 0 after creating a task");
    u.addToTasks(t);
    assert.isEqual('new', u.state, "User is still new after adding Task");
    assert.isEqual('clean', t.state, "Task is still clean after being added to user");
    assert.isEqual(1, u.getTasks().length, "GetTasks returns one task before saving");
    u.save()
    assert.isEqual('clean', u.state, "User is clean after saving");
    assert.isEqual('clean', t.state, "Task is clean after saving user");
    assert.isEqual(1, u.getTasks().length, "GetTasks returns one task after saving");
    assert.isEqual(u.get('_id'), u.getTasks()[0].get('user_id'), "Task(from u.getTasks).user_id matches user._id");
  },
  
  testRemoveExisting : function() {
    var t = this.Task.create({'topic': 'Whatever'});
    this.u.addToTasks(t);
    this.u.save();
    assert.isEqual(this.u.get('_id'), this.u.getTasks()[0].get('user_id'), "Task(from u.getTasks).user_id matches user._id");
    assert.isEqual(1, this.u.getTasks().length);
    this.u.removeFromTasks(t);
    assert.isTrue(null == t.get('user_id'));
    assert.isEqual('clean', t.state);
  },
  
  testRemoveNew : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    this.u.addToTasks(t);
    assert.isEqual(this.u.get('_id'), this.u.getTasks()[0].get('user_id'), "Task(from u.getTasks).user_id matches user._id");
    assert.isEqual(1, this.u.getTasks().length);
    this.u.removeFromTasks(t);
    assert.isEqual(0, this.u.getTasks().length);
    assert.isTrue(null == t.get('user_id'));
    assert.isEqual('new', t.state);
  },
  
  
  testAddNull : function() {
    this.u.addToTasks(null);
    assert.isEqual('clean', this.u.state);
    assert.isEqual(0, this.u.getTasks().length);
    this.u.save();
    assert.isEqual('clean', this.u.state);
  },
  
  testAddMultiple : function() {
    var t1 = this.Task.create({'topic': 'Topic1'});
    var t2 = this.Task.create({'topic': 'Topic2'});
    this.u.addToTasks([t1, t2]);
    assert.isEqual(this.u.get('_id'), t1.get('user_id'), "Task 1.user_id matches user._id");
    assert.isEqual(this.u.get('_id'), t2.get('user_id'), "Task 2.user_id matches user._id");
    assert.isEqual('dirty', this.u.state);
    assert.isEqual('dirty', t1.state);
    assert.isEqual('dirty', t2.state);
    this.u.save();
    assert.isEqual('clean', this.u.state, "u clean");
    assert.isEqual('clean', t1.state, "t1 clean");
    assert.isEqual('clean', t2.state, "t2 clean");
    var tasks = this.u.getTasks();
    assert.isEqual(2, tasks.length);
    assert.isEqual('Topic1', tasks[0].get('topic'));
    assert.isEqual('Topic2', tasks[1].get('topic'));
  }
  
}

exports.testHasOne = {
  setup : function() {
    this.Task = Model.define('task', {});
    this.User = Model.define('user', {
      associations : {
        "task" : Model.has_one(this.Task)
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
    var t = this.Task.makeNew({'topic': 'Whatever'});
    t.setUser(this.u);
    t.save();
    t = this.u.getTask();
    assert.isEqual('Whatever', t.get('topic'));
  },
  
  testAddExisting : function() {
    var t = this.Task.create({'topic': 'Whatever'});
    this.u.setTask(t);
    assert.isEqual('dirty', this.u.state);
    assert.isEqual('dirty', t.state);
    assert.isEqual(this.u.get('_id'), t.get('user_id'));
    assert.isTrue(null != this.u.getTask(), "User.getTask not null");
    this.u.save();
    assert.isEqual('clean', this.u.state, "User clean after save");
    assert.isEqual('clean', t.state, "Task clean after save");
    assert.isEqual(this.u.get('_id'), this.u.getTask().get('user_id'));
  },
  
  testAddNew : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    this.u.setTask(t);
    assert.isEqual('new', t.state);
    assert.isEqual('dirty', this.u.state);
    assert.isEqual(this.u.get('_id'), t.get('user_id'));
    assert.isEqual(this.u.get('_id'), this.u.getTask().get('user_id'));
    this.u.save();
    assert.isEqual('clean', t.state);
    assert.isEqual('clean', this.u.state);
  },
  
  testAddNewtoNew : function() {
    var u = this.User.makeNew({'name': 'Hans'});
    var t = this.Task.makeNew({'topic': 'Whatever'});
    u.setTask(t);
    assert.isEqual('new', u.state, "User is new");
    assert.isEqual('new', t.state, "Task is new");
    u.save()
    assert.isEqual('clean', u.state, "User is clean after saving");
    assert.isEqual('clean', t.state, "Task is clean after saving user");
    assert.isEqual(u.get('_id'), t.get('user_id'), "Task.user_id matches user._id");
    assert.isEqual(u.get('_id'), u.getTask().get('user_id'), "Task(from u.getTasks).user_id matches user._id");
  },
  
  testAddExistingToNew : function() {
    var u = this.User.makeNew({'name': 'Hans'});
    assert.isEqual(null, u.getTask(), "GetTask returning null before creating a task");
    var t = this.Task.create({'topic': 'Whatever'});
    assert.isEqual(null, u.getTask(), "GetTask returning null after creating a task");
    u.setTask(t);
    assert.isEqual('new', u.state, "User is still new after adding Task");
    assert.isEqual('clean', t.state, "Task is still clean after being added to user");
    assert.isTrue(null != u.getTask(), "GetTask returns task before saving");
    u.save()
    assert.isEqual('clean', u.state, "User is clean after saving");
    assert.isEqual('clean', t.state, "Task is clean after saving user");
    assert.isTrue(null != u.getTask(), "GetTask returns task after saving");
    assert.isEqual(u.get('_id'), u.getTask().get('user_id'), "Task(from u.getTasks).user_id matches user._id");
  },
  
  testRemoveExisting : function() {
    var t = this.Task.create({'topic': 'Whatever'});
    this.u.setTask(t);
    this.u.save();
    assert.isEqual(this.u.get('_id'), this.u.getTask().get('user_id'), "Task(from u.getTasks).user_id matches user._id");
    assert.isTrue(null != this.u.getTask(), "GetTask returns task after saving");
    this.u.removeTask();
    assert.isTrue(undefined == t.get('user_id'), "user_id removed from task");
    assert.isTrue(null == this.u.getTask(), "GetTask returns null after removing");
    assert.isEqual('clean', t.state);
  },
  
  testRemoveNew : function() {
    var t = this.Task.makeNew({'topic': 'Whatever'});
    this.u.setTask(t);
    assert.isEqual(this.u.get('_id'), this.u.getTask().get('user_id'), "Task(from u.getTasks).user_id matches user._id");
    assert.isTrue(null != this.u.getTask(), "GetTask returns task after saving");
    this.u.removeTask();
    assert.isTrue(undefined == t.get('user_id'), "user_id removed from task");
    assert.isTrue(null == this.u.getTask(), "GetTask returns null after removing");
    assert.isEqual('clean', t.state);
  },
  
  testSetNull : function() {
    this.u.setTask(null);
    assert.isEqual('clean', this.u.state);
    assert.isEqual(null, this.u.getTask());
    this.u.save();
    assert.isEqual('clean', this.u.state);
  }
}

// exports.testBelongsToMany = null;
