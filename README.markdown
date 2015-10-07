Kupo
==============================================================================

*Kupo* is a Javascript-based web development framework.

It's not meant as a general purpose framework but to support web applications
driven by clientside javascript. It acts primarily as an adapter to an object
database that also provides RPC functionality.

The *Kupo* software package is not meant for productive use. Right now it is
just a proof-of-concept implementation supporting my diploma thesis.

Requirements
------------------------------------------------------------------------------

*Kupo* should run on all Unix systems. It was tested with MacOS X 10.5.7 and
Debian 5.0. To use *Kupo* you need to have a running MongoDB Server >= 0.9.6
on your machine. (<http://www.mongodb.org>). You also should have [git][git]
installed.

[git]: http://www.git-scm.com/

Install
------------------------------------------------------------------------------

To install *Kupo*, just place the source directory somewhere and make sure the
correct versions of the [Jack][jack] and [Narwhal][narwhal] frameworks are in
place under the `packages` directory. The best way to install *Kupo* is to
clone the repository using git:

1. `git clone git://github.com/janv/kupo.git`
2. `cd kupo`
3. `git submodule update --init`

[jack]: http://github.com/janv/jack/master
[narwhal]: http://github.com/janv/narwhal/master

After having installed *Kupo*, run it using the `./start` script

Overview
------------------------------------------------------------------------------

### Environment

The Kupo framework lives in an environment created by the Rhino JavaScript
interpreter and the Narwhal/Jack framework. This environment influences how
the files are laid out and how certain tasks are achieved.


#### File Layout

The Kupo repository is laid out as a Narwhal package. The root directory
contains the application that is developed (a sample application at the
moment), all required frameworks are located as packages in the `packages`
directory, so they're automatically discovered by `narwhal`. These packages
are *Jack*, *Narwhal* itself and the Kupo framework.

The file `main.js` is executed by `narwhal` to run the package. `Main.js` runs
the `jackup` executable of the Jack framework, passing it the current
directory as a Jack application. Jack applications are initialized using the
file `jackconfig.js` in which a the app (a simple function adhering to the
Jack protocol) is exported in the `exports.app` variable.


#### Requiring modules in Narwhal

Narwhal implements the *SecurableModules* specification devised in the
*ServerJS* working group. This standard defines a mechanism for requiring
JavaScript source files (*modules*) in a secure way that keeps private
identifiers private and prevents accidential pollution of the global
namespace.

To load a file, the function `require` is used. `Require` provides the
`exports` variable to the module, runs the file and returns the contents of `exports`. In order to export
functionality, modules can simply manipulate this variable. All other
identifiers in the file are not exported and unaccessible from outside.

#### The example Jack application

The *app* defined in `jackconfig.js` is simply a delegation to Kupo's
dispatcher which acts inside the current app by using the global variable
`$KUPO_HOME` to locate files and sources.

### Controller

#### Dispatcher

The dispatcher's `handle` method adheres to the Jack protocol and acts as the
app for Jack to run in a Kupo application. Everything the dispatcher needs to
know to control the application is the `$KUPO_HOME` global variable pointing
to the root of the application.

The `handle` method is called for every incoming request. Inside, the
requested URL is analyzed. Based on the first part of the path, a model or
controller is looked up (via the `hasController`/`hasModel` methods),
instantiated (via the `requestInstance` method in the controller) and used to
handle the request.

First, the Dispatcher looks for a controller with the given name. If such a
controller does not exist, a model is looked up and handed to the generic
*ResourceController*. Looking up and loading controllers and models is done in
the Fetcher (and encapsulated in the dispatcher's
`fetch`/`hasModel`/`Controller` methods)

#### The Fetcher

The fetcher contains methods to locate the files in the current Kupo
application, load them and make them available to the dispatcher. Its main two
methods are `fetch` and `check`, both are encapsulated by four corresponding
methods which are exported. The `check` method checks for the presence of a
model/controller, the `fetch` method loads and returns them.

#### Controllers and inheritance

An application's controllers are located in
`app/controller/<controllername>.js`. A controller is a module in the
SecurableModules-sense. To declare a controller, the module has to define it
using `CustomController.define('<controllername>')`. The resulting object has
to be exported as a property of the exports object by the name
`<Controllername>Controller` (eg. `FooController`, the controller name has to
be capitalized).

To define actions on the created controller, the developer should create
functions in the controller's `actions` property. Inside these functions,
`this.request`, `this.cookies` and `this.session` are available to access
details of the request. The action should return a Jack response array
(`[<status>, <headers-object>, <array of strings for the body>]`).

The request object is created by Jack and defined in
`packages/jack/lib/jack/request.js`. The cookies object is created in Kupo's
`controller.js`. The Controller object defined in this file is a common
ancestor for both the ResourceController and the CustomControllers. It
contains a `handle` method which is called by the dispatcher to handle the
request. In `handle`, the request, cookies and session objects are set up
before the current controller instance's process method is called. To interact
with the cookie or the session object, simply add/remove/change its
properties. They're serialized into the HTTP response automatically.

`Controller.js` further exports the `JRPCRequest` constructor for JSON-RPC
Requests. The two methods `JRPCRequest.fromGET` and `JRPCRequest.fromPOST` are
the ones actually used to contruct JRPCRequests. `JRPCRequest` objects contain
four methods:

- `getMethodName()` returns the name of the method that should be called
- `getParameters()` returns the parameters for the call
- `getNamedParameters()` returns the parameters for the call as a JavaScript
  object
- `call()` is used on an object to call the requested method on the object,
  passing the provided parameters

`JRPCRequest` provides two additional helper methods:

- `buildResponse` takes a HTTP status code and a result object and constructs
  a Jack response array containing a JRPC reponse object.
- `buildError` works analogous and constructs a JRPC error response.


#### ResourceController

If the Dispatcher doesn't find a controller to handle a request, it looks for
a model with a matching name. If one is found, an instance of the
`ResourceController` is instantiated with it.

The ResourceController has a few standard ways to deal with requests. Its
`process` method analyzes the request to determine wether to treat the request
as a JSON-RPC request or as a simple GET request. The GET requests are
processed by the controller's `index` and `show` actions. First, it is made
sure that the `all`/`find` method of the model are callable, then they are
called and their result is sent to the client as a JRPCResponse. The actual
method call is surrounded by before/after filters defined on the model. They
are executed in the context of the controller by the model's `callBack`
method, so they have the opportunity to manipulate the request (via
`this.request`) or the response (via `this.collection`/`this.object`).

In all other cases, the ResourceController's `process` method constructs a
`JRPCRequest` object from the request and processes it in the `processJRPC`
method.


### Models

The models Kupo operates with are defined in `app/model/<modelname>.js`.
Their declaration is similar to to the controllers. To define a model,
`Model.define` is called, passing the model's name and an object (called the
`specialization` object internally) that describes the model. The
specialization object contains four properties:

- `instance` is an object containing several properties in itself:
  - `methods` is an object containing instance methods for instances of this
    model
  - `callables` is an array of method names that can be called remotely on the
    instance
- `callables` is an array of method names that can be called remotely on the
  model
- `callbacks` is an object containing several properties having certain names. 
  Each of these properties contains an array of functions that are executed at
  points in the instances lifecycle that is provided by the property's name.
  All possible execution points are given in `model.js`
- validations: an array of functions that are used to validate the instance
- associations: an object defining associations this model has to other models

Only one aspect of a model is defined outside of this specialization object
and that's class methods. Those are simply created as properties on the
defined model.


#### ClassPrototype

The `ClassPrototype` is defined in `model.js` and exported as `Model`. As its
name indicates, the ClassPrototype is a prototype for all model classes. It is
derived into concrete models via the `define` method. `Define` clones the
prototype, processes the specialization object and opens a connection to this
model's database collection. This connection is stored in a closure and can be
accessed by calling the `collection()` method on the model.

The `initSpecialization` method processes the specialization object to create
the model's `instancePrototype`. This instancePrototype is derived from the
`CommonInstancePrototype` and acts as a prototype for all instances of a
model. Most aspects in the specialization object however aren't actually
evaluated at this point but looked up later during the model's lifecycle.

The `all`, `find`, `makeNew` and `create` method in the ClassPrototype are
involved in aspects of object persistence and database connectivity. All of
them are described in model.js.


#### CommonInstancePrototype

The `CommonInstanceProtoype` is similar to the ClassPrototype. It contains
several initialization methods and persistence methods. All are described in
`model.js`. Here only some aspects will be listed that are missing from the
source documentation.

The `save` method, responsible for saving changes to an instance to the
database shows nicely how saving is performed depending on the instance's
state. The `state` property of the instance can take one of four values:

- New objects that haven't been saved to the database are 'new'.
- Objects that represent their (last known, concurrency issues aside) state in
  the database are 'clean'.
- Objects that have been changed since their last save or load operation are
  marked 'dirty'.
- Finally if an object is removed from the database, it's marked 'removed' and
  can't be saved anymore.

Depending on which state the instance was in, the callbacks are called on it.

Although an instance's underlying data is openly accessible in its `data`
property, it should not be changed there. Instead the CommonInstancePrototype
provides `get` and `set` methods to access the data. Using `set` ensures that
the instance's state does not become corrupted. Likewise, the `state` property
should never be overwritten manually. If an instance has to be marked `dirty`
for saving, the `taint` method should be used.

Validations are described in the DocComment for
`CommonInstancePrototype.validate`. Whenever an object isn't valid, it can't
be saved to the database anymore.

#### InstancePrototype

The last method of the CommonInstancePrototype is `newInstance`. Once an
instancePrototype has been derived from the CommonInstancePrototype,
`newInstance` creates actual model instances. Notice that this method should
never be called manually, it is only used internally by
`CommonInstancePrototype.makeNew`.

#### Associations

Associations provide automated construction and use of relationships between
models. To declare an association, create a property with the name of the
association in the `associations` object inside the `specialization` object
(examples are available in the test suite in
`packages/kupo/tests/association-tests.js`). The value of that property is an
association descriptor as returned by
`Association.belongs_to/belongs_to_many/has_one/has_many`. Each of these
associations is declared in a file in
`/packages/kupo/lib/kupo/model/associations/` and consists of two parts.

The Association Proxy is an object that is accessed under the assication name
on the final model instance (eg. `task.user`) and contains various methods to
manipulate the association.

The association generator returns an association descriptor object containing
two methods:  
`registerCallbacks` is called when the instancePrototype for a model is
derived from the CommonInstancePrototype. It installs a callback in the
instancePrototype that in turn executes a callback method in the association
proxy of the actual instance.  
`installProxy` is called whenever an instance of a model is created. It
initializes an AssociationProxy for the association and installs it in the
instance.

### MongoAdapter

The `MongoAdapter` provides access to a MongoDB database by wrapping MongoDB's
Java driver in Javascript using Rhino's Java interoperability.

`MongoAdapter.Connection` can be used to create a new database connection. A
default database connection is provided by `MongoAdapter.getConnection()`.
This method always returns the same connection, which by default connects to
the `kupo` database. To change the default connection call
`MongoAdapter.setConnection`.

Calling `getCollection` on a Connetion returns a new Mongo collection. These
are roughly corresponding to tables in SQL databases, so one collection is
used for every model in the app. Collections are never created explicitly,
they are simply accessed and the first write operation creates them.

For collection methods that return muliple items, a wrapper around the Mongo
Cursor has been written. It provides basic means to iterate over the items.
Mongo Cursors can not be rewound.

Whenever a single MongoDB object leaves the MongoAdapter, it is converted to a
JavaScript object using the `fromDoc` method at the end of `mongo_adapter.js`.
Similarly Javascript objects are converted to Mongo BasicDBObjects before
being processed by the Java driver's methods using the `createDoc`/`convert`
functions.


Tests
------------------------------------------------------------------------------

*Kupo* has tests. To run them you need to:

1. Start mongod using `./mongod --dbpath /path/to/kupo/db run`
2. Change to `/path/to/kupo/packages/kupo/tests`
3. Run `../../narwhal/bin/narwhal .`

The tests are covering the persistence and model aspects of *Kupo*, mainly
everything in mongo_adapter.js and model.js.


License
------------------------------------------------------------------------------

*Kupo* is licensed under the MIT License

Copyright (c) 2009 Jan Varwig

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.