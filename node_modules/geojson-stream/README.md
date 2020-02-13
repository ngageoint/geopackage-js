# geojson-stream

[![Greenkeeper badge](https://badges.greenkeeper.io/tmcw/geojson-stream.svg)](https://greenkeeper.io/)
[![build status](https://secure.travis-ci.org/tmcw/geojson-stream.svg)](http://travis-ci.org/tmcw/geojson-stream)

Stream features into and out of [GeoJSON](http://geojson.org/) objects
and Feature Collections. Little more than [JSONStream](https://github.com/dominictarr/JSONStream)
with pre-filled settings.

## usage

    npm install --save geojson-stream

## api

### `geojsonStream.stringify()`

Returns a transform stream that accepts GeoJSON Feature objects and emits
a stringified FeatureCollection.

### `geojsonStream.parse(mapFunc)`

Returns a transform stream that accepts a GeoJSON FeatureCollection as a stream
and emits Feature objects.

`mapFunc(feature, index)` is an optional function which takes a `Feature`, and its zero-based index in the `FeatureCollection` and returns either a `Feature`, or null/undefined 
if the feature should be omitted from output.

## example

```
const geojsonStream = require('geojson-stream');
const fs = require('fs');
const out = fs.createWriteStream('buildings-with-id.geojson');
fs
    .createReadStream(`buildings.geojson`)
    .pipe(geojsonStream.parse((building, index) => {
        if (building.geometry.coordinates === null) {
            return null;
        }
        building.id = index;
        return building;
    }))
    .pipe(geojsonStream.stringify())
    .pipe(out);
```