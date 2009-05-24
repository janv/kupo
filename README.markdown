Kupo
==============================================================================

*Kupo* ist a Javascript-based web development framework.

It's not meant as a general purpose framework but to support web applications driven by clientside javascript. It acts primarily as an adapter to an object database that also provides RPC functionality.

The *Kupo* software package is not meant for productive use. Right now it is just a proof-of-concept implementation supporting my diploma thesis.

Requirements
------------------------------------------------------------------------------

*Kupo* should run on all Unix systems. It was tested with MacOS X 10.5.6. To use *Kupo* you need to have a running MongoDB Server on your machine. (<http://www.mongodb.org>). You also should have [git][git] installed.

[git]: http://www.git-scm.com/

Install
------------------------------------------------------------------------------

To install *Kupo*, just place the source directory somewhere and make sure the correct versions of the [Jack][jack] and [Narwhal][narwhal] frameworks are in place under the `packages` directory. The best way to install *Kupo* is to clone the repository using git:

1. `git clone git://github.com/janv/kupo.git`
2. `cd kupo`
3. `git submodule init`
3. `git submodule update`

[jack]: http://github.com/tlrobinson/jack/master
[narwhal]: http://github.com/tlrobinson/narwhal/master

After having installed *Kupo*, run it using the `./start` script

Overview
------------------------------------------------------------------------------

Requests are handled by the dispatcher's `handle` method which uses the fetcher to load a custom controller or model identified by the url. If no custom controller is found, a matching model is handed to the resource controller to for processing RPC calls. A variety of callbacks defined in the models can be used to influence request processing in the scope of the resource controller or the model's lifecycle.

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