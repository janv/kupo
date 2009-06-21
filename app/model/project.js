var Model = require('kupo/model').Model;
var Associations = require('kupo/model/associations').Associations;
var Task = require('./task.js').Task;

var Project = new Model('project',{
  instance: {},
  callables: ['blubb'],
  associations: {
    "tasks" : Associations.hasMany(Task)
  }
});

Project.blubb = function(x) {
  return "This is the result of the blubb test-function which multiplies the argument by 3: " + ( 3 * x ).toString()
}

exports.Project = Project;