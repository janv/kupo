//Initialize global
global = window;

evalGlobal= {};
system = {
  global: global,
  evalGlobal: evalGlobal,
  platform: 'browser',
  platforms: ['browser', 'default'],
  print: console.debug,
  fs: {
      read: function(url) {
        var retval = null;
        $.ajax({url:url, async: false, success: function(data){
          retval = data
        }});
        return retval;
      },
      isFile: function(url) {
        var retval = null;
        $.ajax({url:url, async: false, complete: function(xhr, status){
          retval = (xhr.status == 200 && xhr.getResponseHeader("Content-Type") == 'application/x-javascript');
        }});
        return retval;
      }
  },
  prefix: '/js',
  evaluate: function (text, name, lineNo) {
    var x = null;
    return eval("x = function(require,exports,module,system,print){" + text + "\n// */\n}");
    return x;
  }
}

// Initialize global require

// equivalent to "var sandbox = require('sandbox');"
var sandboxPath = system.prefix + "/sandbox.js";
var sandboxFactory = system.evaluate(
    system.fs.read(sandboxPath),
    "sandbox.js",
    1
);
var sandbox = {};
var sandboxModule = {id: 'sandbox', path: sandboxPath};
sandboxFactory(
    null, // require
    sandbox, // exports
    sandboxModule, // module
    system, // system
    system.print // print
);

// construct the initial paths
var paths = [];
paths.push(system.prefix);

// create the primary Loader and Sandbox:
var loader = sandbox.MultiLoader({paths: paths, extensions : ["", ".client.js", ".js"]});
var modules = {system: system, sandbox: sandbox};
global.require = sandbox.Sandbox({loader: loader, modules: modules});


// App libraries

function demolog(msg) {
  $('#log').append("<p>" + msg + "</p>");
}

function demolog_replace(msg) {
  $('#log > p:last').replaceWith("<p>" + msg + "</p>");
}

function demoInit() {
  demolog("Requiring Project model");
  var Project = require('model/project').Project;
  demolog("Loading projects");
  var projects = Project.all();
  demolog_replace(projects.length + " Projects loaded");

  //load projects
  $('#available_projects').empty()
  $.each(projects, function(){
    var project = this;
    $("<li>"+project.get("name")+"</li>")
      .click(function(){loadProject(project)})
      .appendTo('#available_projects')
  })
}

function loadProject(project) {
  $('#project').slideUp();
  $('#project h2').html(project.get("name"));
  $('#project #description').html(project.get("description"));
  $('#project').slideDown();
  loadTasks(project);
  $('#new_task')
    .unbind('submit')
    .bind('submit', function(){
      try {
        var t = project.tasks.create(serializeForm($('#new_task')));
        if (t.errors.length == 0) {
          $('#new_task')[0].reset();
          loadTasks(project);
        } else {
          alertErrors(t)
        }
      } catch (e) {
        console.error(e)
      } finally {
        return false;      
      }
    })
}

function alertErrors(instance) {
  var e = "Error:\n"
  $.each(instance.errors, function() {
    if (this instanceof Array) {
      e = e + this[0] + ' ' + this[1] + "\n";
    } else {
      e = e + this;
    }
  })
  alert(e)  
}

function loadTasks(project) {
  demolog("Loading tasks");
  var tasks = project.tasks.get();
  demolog_replace(tasks.length + " Tasks loaded");
  $('#tasks').empty();
  $.each(tasks, function(){
    var task = this;
    var li = $("<li class=\""+ (task.isDone() ? "done" : '') +"\">"+task.get("title")+"<br/>"+task.get("description")+'</li>')
      .appendTo('#tasks');
    $('<br/><a href="#">delete</a>')
      .appendTo(li)
      .click(function(){
        try {
          task.remove();
          $(this).parent().remove();
        } catch (e) {
          console.debug("Error: %o", e);
        } finally {
          return false;
        }
      })
      li.append(" ")
      $('<a href="#">toggle</a>')
        .appendTo(li)
        .click(function(){
          try {
            task.toggle();
            li.toggleClass('done', task.isDone());
          } catch (e) {
            console.debug("Error: %o", e);
          } finally {
            return false;
          }
        })
  })
}

function serializeForm(form) {
  var retval = {};
  form.find("input, textarea").each(function() {
    if (this.name) retval[this.name] = this.value;
  })
  return retval;
}

$(demoInit);