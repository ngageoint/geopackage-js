node-ninja
==========

## Goals

This is a fork of node-gyp, with the long term goal of removing the dependency on
GYP and targeting the Ninja build system instead.

The current version is different from node-gyp in these significant ways:

* It has better support for native stacks with multiple gyp files.

* It supports incremental builds when pre-building against multiple Node.js ABI versions, when using a package like `prebuild`.

* It is licensed under Mozilla Public License version 2.0.

* It uses the [C4](http://rfc.zeromq.org/spec:22) contribution process, meaning your patches will be accepted rapidly, if they conform to some basic rules.

## How to Contribute

* Be a node-ninja user.
* Read [CONTRIBUTING.md](CONTRIBUTING.md) for details.
* Fork https://github.com/codejockey/node-ninja to your own account.
* Solve small problems with minimal, neat solutions.
* Send us your pull requests, and we will merge them.

### Node.js native addon build tool

`node-ninja` is a cross-platform command-line tool written in Node.js for compiling
native addon modules for Node.js. It bundles the [gyp](https://code.google.com/p/gyp/)
project used by the Chromium team and takes away the pain of dealing with the
various differences in build platforms.

Multiple target versions of node are supported (i.e. `0.8`, `0.9`, `0.10`, ..., `1.0`,
etc.), regardless of what version of node is actually installed on your system
(`node-ninja` downloads the necessary development files for the target version).

#### Features:

 * Easy to use, consistent interface
 * Same commands to build your module on every platform
 * Supports multiple target versions of Node


Installation
------------

You can install with `npm`:

``` bash
$ npm install -g node-ninja
```

TODO: review this section, it is out of date.

You will also need to install:

  * On Unix:
    * `python` (`v2.7` recommended, `v3.x.x` is __*not*__ supported)
    * `make`
    * A proper C/C++ compiler toolchain, like [GCC](https://gcc.gnu.org)
  * On Mac OS X:
    * `python` (`v2.7` recommended, `v3.x.x` is __*not*__ supported) (already installed on Mac OS X)
    * [Xcode](https://developer.apple.com/xcode/download/)
      * You also need to install the `Command Line Tools` via Xcode. You can find this under the menu `Xcode -> Preferences -> Downloads`
      * This step will install `gcc` and the related toolchain containing `make`
  * On Windows:
    * Python ([`v2.7.10`][python-v2.7.10] recommended, `v3.x.x` is __*not*__ supported)
      * Make sure that you have a PYTHON environment variable, and it is set to drive:\path\to\python.exe not to a folder
    * Windows XP/Vista/7:
      * Microsoft Visual Studio C++ 2013 ([Express][msvc2013] version works well)
        * If the install fails, try uninstalling any C++ 2010 x64&x86 Redistributable that you have installed first
        * If you get errors that the 64-bit compilers are not installed you may also need the [compiler update for the Windows SDK 7.1]
    * Windows 7/8/10:
        * Install the latest version of npm (3.3.6 at the time of writing)
        * Install Python 2.7 from https://www.python.org/download/releases/2.7/ and make sure its on the System Path
        * Install Visual Studio Community 2015 Edition. (Custom Install, Select Visual C++ during the installation)
        * Set the environment variable GYP_MSVS_VERSION=2015
        * Run the command prompt as Administrator
        * $ npm install (--msvs_version=2015) <-- Shouldn't be needed if you have set GYP_MSVS_VERSION env
    * All Windows Versions
      * For 64-bit builds of node and native modules you will _**also**_ need the [Windows 7 64-bit SDK][win7sdk]
      * You may need to run one of the following commands if your build complains about WindowsSDKDir not being set, and you are sure you have already installed the SDK:

```
call "C:\Program Files\Microsoft SDKs\Windows\v7.1\bin\Setenv.cmd" /Release /x86
call "C:\Program Files\Microsoft SDKs\Windows\v7.1\bin\Setenv.cmd" /Release /x64
```

If you have multiple Python versions installed, you can identify which Python
version `node-ninja` uses by setting the '--python' variable:

```
node-ninja --python /path/to/python2.7
```

If `node-ninja` is called by way of `npm` *and* you have multiple versions of
Python installed, then you can set `npm`'s 'python' config key to the appropriate
value:

```
npm config set python /path/to/executable/python2.7
```

Note that OS X is just a flavour of Unix and so needs `python`, `make`, and C/C++.
An easy way to obtain these is to install XCode from Apple,
and then use it to install the command line tools (under Preferences -> Downloads).

How to Use
----------

To compile your native addon, first go to its root directory:

```
cd my_node_addon
```

The next step is to generate the appropriate project build files for the current
platform. Use `configure` for that:

```
node-ninja configure
```

__Note__: The `configure` step looks for the `binding.gyp` file in the current
directory to process. See below for instructions on creating the `binding.gyp` file.

Now you will have either a `Makefile` (on Unix platforms) or a `vcxproj` file
(on Windows) in the `build/` directory. Next invoke the `build` command:

```
node-ninja build
```

Now you have your compiled `.node` bindings file! The compiled bindings end up
in `build/Debug/` or `build/Release/`, depending on the build mode. At this point
you can require the `.node` file with Node and run your tests!

__Note:__ To create a _Debug_ build of the bindings file, pass the `--debug` (or
`-d`) switch when running either the `configure`, `build` or `rebuild` command.


The "binding.gyp" file
----------------------

The `binding.gyp` file describes the configuration to build your module in [a JSON-like format](https://gyp.gsrc.io/docs/LanguageSpecification.md). This file gets placed in the root of
your package, alongside the `package.json` file.

A barebones `gyp` file appropriate for building a node addon looks like:

``` python
# A minimal gyp file
{
  "targets": [
    {
      "target_name": "binding",
      "sources": [ "src/binding.cc" ],
    },
  ],
}
```

Note that the file format allows trailing commas, and `#` comments.

Commands
--------

`node-ninja` accepts the following commands:

| **Command**   | **Description**
|:--------------|:---------------------------------------------------------------
| `build`       | Invokes `make`/`msbuild.exe` and builds the native addon
| `clean`       | Removes the `build` directory if it exists
| `configure`   | Generates project build files for the current platform
| `rebuild`     | Runs `clean`, `configure` and `build` all in a row
| `install`     | Installs node development header files for the given version
| `list`        | Lists the currently installed node development file versions
| `remove`      | Removes the node development header files for the given version

`node-gyp` accepts the following command options:

| **Option**         | **Description**
|:-------------------|:------------------------------------------------
| `-j n`, `--jobs n` | For `build`: run parallel builds
| `--silly`, `--loglevel=silly` | Log all progress to console
| `--verbose`, `--loglevel=verbose` | Log most progress to console
| `--silent`, `--loglevel=silent` | Don't log anything
| `--debug`          | Make Debug build (default=Release)
| `--release`, `--no-debug` | Make Release build
| `--builddir x` | Build in this directory (default=build)

License
-------
Node-ninja is licensed under the Mozilla Public License version 2.0. See LICENSE.

Part of this code coming from node-gyp are licensed under the MIT license as follows:

Copyright (c) 2012 Nathan Rajlich &lt;nathan@tootallnate.net&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[python-v2.7.10]: https://www.python.org/downloads/release/python-2710/
[msvc2013]: https://www.microsoft.com/en-gb/download/details.aspx?id=44914
[win7sdk]: https://www.microsoft.com/en-us/download/details.aspx?id=8279
[compiler update for the Windows SDK 7.1]: https://www.microsoft.com/en-us/download/details.aspx?id=4422
