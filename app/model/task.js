var Model = require('kupo/model').Model;
var Associations = require('kupo/model/associations').Associations;
var Project = require('./project.js').Project;
var Validations = require('kupo/model/validations').Validations;

var Task = new Model('task',{
  instance: {
    methods : {
      toggle : function() {
        this.update("done", !this.get('done'));
      },
      isDone : function() {
        return !!this.get('done');
      }
      
    }
  },
  associations: {
    "project" : Associations.belongsTo(Project)
  },
  validations: [Validations.validatesPresenceOf('project_id')]
});

exports.Task = Task;