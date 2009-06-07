var Errors = require('kupo/errors').Errors;
var JSON   = require('json');

var Mongo         = Packages.com.mongodb.Mongo;
var BasicDBObject = Packages.com.mongodb.BasicDBObject;
var BasicDBList   = Packages.com.mongodb.BasicDBList;


var MongoAdapter = exports.MongoAdapter = {};

/**
 * Create a connection to a database with a given name
 *
 * @constructor
 */
MongoAdapter.Connection = function(_database) {
  this.mongo = new Mongo(_database);
}

MongoAdapter.Connection.prototype = {
  /** Return a new collection from the database with the given name */
  getCollection : function(_collection) {
    return new Collection(this.mongo.getCollection(_collection));
  }
}

// To be returned by getConnection in a closure
var name = "kupo"
var conn = null;

/** Return the global database connection */
MongoAdapter.getConnection = function(){
  conn = conn || new MongoAdapter.Connection(name); //TODO: global konfigurieren und speichern
  return conn;
}

/**
 * Re-initialize the global database connection with a new database name
 */
MongoAdapter.setConnection = function(_name){
  name = _name;
  conn = null;
}


/**
 * A Wrapper around a MongoDB Collection
 * @class
 */
var Collection = function(_mongoCollection) {
  this.mongoCollection = _mongoCollection
}

Collection.prototype = {
  
  /**
   * Drop the collection from the Database
   */
  drop : function() {
    this.mongoCollection.drop();
  },
  
  /**
   * Insert an object into the collection
   * Inserts either a single object or an array
   *
   * @return The object (or an array of objects) extended by the Mongo properties _id and _ns
   */
  insert : function(o) {
    if (arguments.length > 1) o = Array.prototype.slice.call(arguments);
    if (o instanceof Array){
      var r = [];
      for (var i=0; i < o.length; i++) {
        r.push(fromDoc(this.mongoCollection.insert(createDoc(o[i]))));
      };
      return r;
    } else {
      return fromDoc(this.mongoCollection.insert(createDoc(o)));
    }
  },
  
  /**
   * Update an object in this collection
   * 
   * @param {Object} finder A finder object used to find the record to be updated
   * @param {Object} object An object with which to update the record
   * @param {boolean} upsert A flag indicating wether the object should be inserted if none is found to be updated
   * @param {boolean} apply  A flag indicating wether the object should be equipped with _id if it is inserted
   */
  update : function(finder, object, upsert, apply) {
    if (upsert === undefined) upsert = true;
    if (apply === null || apply === undefined) apply = true;
    return fromDoc(this.mongoCollection.update(createDoc(finder), createDoc(object), upsert, apply));
  },
  
  /**
   * Remove an object from this collection
   * @param {Object} finder A finder object used to find the record to be updated
   */
  remove : function(finder) {
    this.mongoCollection.remove(createDoc(finder));
  },
  
  /**
   * Perform a simple database query
   *
   * @param {Object} ref Query used to search, pass null to return all records
   * @return Cursor over the results
   */
  find : function(ref) {
    if (ref == null) {
      var cursor = this.mongoCollection.find();
    } else {
      var cursor =  this.mongoCollection.find(createDoc(ref));
    }    
    return new Cursor(cursor);
  },
  
  /**
   * Perform a simple database query for a single record
   *
   * @param {Object} ref Query used to search, pass null to return all records
   * @return The resulting object
   */
  findOne : function(ref) {
    var r = this.mongoCollection.findOne(createDoc(ref))
    if (r == null) {
      return null;
    } else {
      return fromDoc(r);
    }
  },

  /**
   * Perform a simple database query for a single record by id
   *
   * @param {Number} id The id of the desired object
   * @return The resulting object
   */
  findId : function(id) {
    return this.findOne({"_id" : id})
  },

  /**
   * Save an object to the database, regardless of wether it's new or not
   * Performs implicit upsert
   *
   * @param {Object} o The object to insert
   * @return The object
   */
  save : function(o) {
    return fromDoc(this.mongoCollection.save(createDoc(o)))    
  },
  
  /**
   * Count objects in the database
   *
   * @param {Object} ref The ref defining which records to count
   * @return The amount of records matching ref
   */
  count : function(ref) {
    if (ref == null) {
      return this.mongoCollection.getCount();
    } else {
      return this.mongoCollection.getCount(createDoc(ref));
    }
  }
}

/**
 * A Wrapper around a Mongo Database Cursor
 * @class
 */
var Cursor = function(_mongoCursor) {
  this.mongoCursor = _mongoCursor;
}

Cursor.prototype = {
  /** True if there are records remaining in the cursor */
  hasNext : function() {
    return this.mongoCursor.hasNext();
  },

  /** Returns the next record and advances the pointer */  
  next    : function() {
    return fromDoc(this.mongoCursor.next());
  },
  
  /** Returns the current record */
  curr    : function() {
    return fromDoc(this.mongoCursor.curr());
  },
  
  /** Returns the number of elements in the cursor */
  length  : function() {
    return this.mongoCursor.length();
  },
  
  /**
   * Transforms the Cursor into an array
   * Only implemented for convenience, not very fast.
   */
  toArray : function() {
    var a = []
    while(this.mongoCursor.hasNext()){
      a.push(fromDoc(this.mongoCursor.next()));
    }
    return a;
  },
  
  /**
   * Takes a function, and maps the elements of this Cursor to an array with it.
   */
  map : function(mapFun){
    var a = []
    while(this.mongoCursor.hasNext()){
      a.push(mapFun(fromDoc(this.mongoCursor.next())));
    }
    return a;    
  }
}

/**
 * Creates a BasicDBObject Document for the Mongo Java Adapter to store
 * Prevents types different from true object to be converted
 *
 * @param {Object} obj A Javascript object
 * @param {BasicDBObject} A Mongo BasicDBObject
 * @private
 */
var createDoc = function(obj) {
  if (typeof obj == 'object' && obj instanceof Object) {
    return convert(obj);
  } else {
	  throw new Errors.InternalError("Only objects can be be serialized into BSON objects, you tried " + JSON.stringify(obj));
  }
}

/**
 * Performs the actual work behind createDoc
 *
 * @param {Object} obj A Javascript object
 * @return {BasicDBObject} A Mongo BasicDBObject
 * @private
 */
var convert = exports.convert = function(obj) {
  if (typeof(obj) == 'string' || obj instanceof String) {
    if (obj.match(/^[0-9a-f]{24}$/i)) return new Packages.com.mongodb.ObjectId(obj);
    return obj;
  }
  
  if (typeof(obj) == 'number' || obj instanceof Number) {
    return new java.lang.Double(obj);
  }
  
  if (typeof(obj) == 'boolean' || obj instanceof Boolean) {
    return new java.lang.Boolean(obj);
  }
  
  if (typeof(obj) == 'function') {
    throw new Errors.InternalError("Functions can not be serialized into BSON objects");
  }
  
  if (obj === null) {
    return null;
  }
  
  if (obj instanceof Date) {
    return java.util.Date(obj)
  }
  
  if (obj instanceof Array) {
    var arr = new BasicDBList();
    for (var i=0; i < obj.length; i++) {
      arr.put(i, arguments.callee(obj[i]));
    };
    return arr;
  }
  
  if (obj instanceof Object) {
    var o = new BasicDBObject();
    for (var p in obj) {
      o.put(p, arguments.callee(obj[p]));
    }
    return o;
  }
  return null;
}

/**
 * Convert a MongoDB document to Javascript
 * Kinda slow because it uses the JSON parser to get the object.
 *
 * @param {BasicDBObject} doc A Mongo BasicDBObject
 * @return {Object} A plain Javascript object 
 * @private
 */
var fromDoc = function(doc) {
  return JSON.parse(String(doc.toString())); //TODO too simple
}