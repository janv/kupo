var generic = require('./project.js');

var Project = generic.Project;
Project.serveronly = function() {
  return "This should not be present on the client";
};
Project.spec.callables.push('serveronly');

exports.Project = Project;
