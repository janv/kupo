/**
 * Container object for all the different types of associations
 * Each one is a function that generates an association object which is used
 * to initialize the associations in the instancePrototype and instances.
 *
 * Each AssociationObject contains 2 functions:
 * - installProxy gets called in the constructor of a new instance,
 *   gets the instance and the associationName as a Parameter and installs the
 *   proxy in the instance;
 * - registerCallbacks gets called when the instancePrototype is created.
 *   it registers the associations callbacks in the instancePrototype.
 *   These callbacks can read the data of the AssociationProxy through the
 *   instance which contains the Proxy.
 */
var Associations = exports.Associations = {};

Associations.hasOne        = require('kupo/model/associations/has_one'        ).hasOne;
Associations.hasMany       = require('kupo/model/associations/has_many'       ).hasMany;
Associations.belongsTo     = require('kupo/model/associations/belongs_to'     ).belongsTo;
Associations.belongsToMany = require('kupo/model/associations/belongs_to_many').belongsToMany;
