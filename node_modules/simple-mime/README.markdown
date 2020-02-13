# Mime

This is a small, simple mime database.  A common thing for node servers to do is serve static files over HTTP.
This requires, among other things, knowin the mime type you want to send.  Here is a simple module to make this easy.

## Install

If you use NPM, then install this via npm.  Also, please remember to put it as a dependency in your package.json file of your module that requires it.

    npm install simple-mime

If you choose to not use npm, or can't use it in your environment, then simply copy the single file `simple-mime.js` to somewhere you can require it.

## Usage

Simply load this library, configure your fallback mime type, and query it for the mime type of various filenames.

    var getMimeType = require('mime')('application/octect-stream');
    var file = "/bar/foo/baz.mp3";
    var type = getMimeType(file);

## Goal

You will probably not use this except as a dependency to your own module that deals with serving files over HTTP, or some other protocol that requires mime types.

This doesn't have as many features as the `mime` module in npm, but it's a lot simpler too.  The goal is that it's useful to someone.
