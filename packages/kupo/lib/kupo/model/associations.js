var Associations = exports.Associations = {};

Associations.hasOne        = require('kupo/model/has_one'        ).hasOne;
Associations.hasMany       = require('kupo/model/has_many'       ).hasMany;
Associations.belongsTo     = require('kupo/model/belongs_to'     ).belongsTo;
Associations.belongsToMany = require('kupo/model/belongs_to_many').belongsToMany;
