var Associations = exports.Associations = {};

Associations.hasOne        = require('kupo/model/associations/has_one'        ).hasOne;
Associations.hasMany       = require('kupo/model/associations/has_many'       ).hasMany;
Associations.belongsTo     = require('kupo/model/associations/belongs_to'     ).belongsTo;
Associations.belongsToMany = require('kupo/model/associations/belongs_to_many').belongsToMany;
