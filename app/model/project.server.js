var generic = require('./project.js');

var Project = exports.Project = generic.Project;
Project.serveronly = function() {
  return "This should not be present on the client";
}
Project.callables.push('serveronly')
print('SERVER project loaded');