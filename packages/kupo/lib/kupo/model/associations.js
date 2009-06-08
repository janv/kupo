var Associations = exports.Associations = {};

Associations.has_one          = require('kupo/model/has_one'        ).has_one;
Associations.has_many         = require('kupo/model/has_many'       ).has_many;
Associations.belongs_to       = require('kupo/model/belongs_to'     ).belongs_to;
Associations.belongs_to_many  = require('kupo/model/belongs_to_many').belongs_to_many;
