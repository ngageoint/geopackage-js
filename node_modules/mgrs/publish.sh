#!/bin/bash

# get current version
VERSION=$(npm ls --json=true mgrs | grep version | awk '{ print $2}'| sed -e 's/^"//'  -e 's/"$//')

# Build
git checkout -b build
npm run build
git add dist -f
git commit -m "build $VERSION"

# Tag and push
git tag $VERSION
git push --tags git@github.com:proj4js/mgrs.git $VERSION

# Publish
npm publish

# Cleanup
git checkout master
git branch -D build
