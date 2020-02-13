reproject [![Build status](https://travis-ci.org/perliedman/reproject.png)](https://travis-ci.org/perliedman/reproject) [![NPM version](https://badge.fury.io/js/reproject.png)](http://badge.fury.io/js/reproject)
=========

[![Greenkeeper badge](https://badges.greenkeeper.io/perliedman/reproject.svg)](https://greenkeeper.io/)

Transforms GeoJSON from one projection / CRS to another.

According to the latest [GeoJSON spec (RFC 7946)](https://tools.ietf.org/html/rfc7946#section-4), GeoJSON coordinates should be assumed to be in WGS84, but sometimes it's useful to use other CRS anyway, and the spec actually leaves some room for this:

> However, where all
> involved parties have a prior arrangement, alternative coordinate
> reference systems can be used without risk of data being
> misinterpreted.

Reproject lets you either explicitly specify a GeoJSON's CRS, or use the conventions from the earlier GeoJSON spec: [GeoJSON 2008](http://geojson.org/geojson-spec.html#coordinate-reference-system-objects).

## cli

install:

    $ npm install -g reproject

use:

    $ echo '{"type":"Point","coordinates":[319180, 6399862]}' | reproject --use-epsg-io --from=EPSG:3006 --to=EPSG:4326

Options:

* ```--from=crs-name``` is the CRS to convert the GeoJSON from; either a name from `crs-defs`, or a Proj4 CRS definition string
* ```--to=crs-name``` is the CRS to convert the GeoJSON to; either a name from `crs-defs`, or a Proj4 CRS definition string
* ```--use-epsg-io``` or ```--eio``` to use [epsg.io](https://epsg.io/) to look up
  any CRS definitions that aren't already known
* ```--use-spatialreference``` or ```--sr``` to use [spatialreference.org](http://spatialreference.org/) to look up
  any CRS definitions that aren't already known
* ```--crs-defs=file``` to provide a JSON dictionary of known CRS definitions. A sample file of CRS definitions, crs-defs.json, is supplied.
* ```--reverse``` to reverse the axis (swap x and y) before performing the reprojection

reproject can be used together with for example [wellknown](https://github.com/mapbox/wellknown/) and [geojsonio-cli](https://github.com/mapbox/geojsonio-cli/):

    $ echo "POINT(319180 6399862)" | wellknown | reproject --crs-defs=crs-defs.json --from=EPSG:3006 --to=EPSG:4326 | geojsonio

## usage

Installation is easy with npm:

    npm install reproject

It works well in the browser with for example [browserify](http://browserify.org/).

## api

### reproject(geojson, from, to, crss)

Reprojects the given GeoJSON from the CRS given in **from** to the CRS given in **to**.

The from and to arguments can either be a proj4 projection object, a string containing a CRS name, or a Proj4 CRS definition string. In
the case of a CRS name, the proj4 projection instance is looked up using the **crss** argument. **crss**
is assumed to be a dictionary of projection names to proj4 objects.

If from is left undefined or null, the CRS will be detected from the GeoJSON's crs property and looked up in the
**crss** dictionary.

### toWgs84(geojson, from, crss)

Shortcut equivalent to

```js
reproject(geojson, from, proj4.WGS84, crss)
```

For a fully automatic "convert almost any common projection to lat/lon", try this:

```js
var epsg = require('epsg');
toWgs84(geojson, undefined, epsg);
```

### detectCrs(geojson, crss)

Detects the CRS defined in the given GeoJSON and returns the corresponding proj4 projection instance from
crss. If no CRS is defined in the GeoJSON, or the defined CRS isn't present in **crss**, an error is thrown.

### reverse(geojson)

Reverses the axis order of the coordinates in the given GeoJSON, such that x becomes y and y becomes x.
