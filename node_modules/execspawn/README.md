#execspawn

> spawn stream for child_process.exec

## Installation

```sheel
npm install execspawn
```

## Documentation

```JavaScript
var execspawn = require('execspawn');

var cmd = execspawn('echo "hallo world";', {
  cwd: __dirname, // all the spawn options
  shell: '/bin/bash' // shell to execute the command with
});

// all the streams
cmd.stderr;
cmd.stdout;
cmd.stdin;
```

See node.js [documentation](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
for more info.

##License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
