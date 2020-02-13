#!/usr/bin/env node

var geojsonStream = require('geojson-stream'),
    es = require('event-stream'),
    reproject = require('./'),
    proj4 = require('proj4'),
    fs = require('fs'),
    argv = require('minimist')(process.argv.slice(2)),
    useSpatialReference = argv["sr"] || argv["use-spatialreference"],
    useEpsgIo = argv["eio"] || argv["use-epsg-io"],
    http = require('http'),
    crss,
    fromCrs,
    toCrs;

try {
    crss = (argv['crs-defs'] ? loadJson(argv['crs-defs']) : {});
} catch (e) {
    process.exit(1);
}

for (var k in crss) {
    crss[k] = proj4(crss[k]);
}

lookupCrs(argv.from, function(crs) {
    fromCrs = crs;
    readStream();
});

lookupCrs(argv.to, function(crs) {
    toCrs = crs;
    readStream();
});

function readStream() {
    if ((fromCrs && toCrs) || (!argv.from && !argv.to)) {
        var inputStream = ((argv._[0] && fs.createReadStream(argv._[0])) || process.stdin)
        var parser = geojsonStream.parse()
            .on('header', handleHeader)
        var transformStream = es.mapSync(transform)
        var outputStream = geojsonStream.stringify()

        inputStream.pipe(parser)
        parser.pipe(transformStream)
        transformStream.pipe(outputStream)
        outputStream.pipe(process.stdout)
    }
}

function handleHeader(geojson) {
    if (geojson && geojson.type !== 'FeatureCollection') {
        // If top type isn't FeatureCollection, just transform the whole object in one pass and be done with it;
        // if we don't do this, geojson-stream will still output a FeatureCollection header, so the output
        // GeoJSON's structure will not match the input's.
        process.stdout.write(JSON.stringify(transform(geojson)));
        process.exit(0);
    }
}

function transform(geojson) {
    if (geojson) {
        var isGeomCol = geojson.type === 'GeometryCollection' && geojson.geometries;
        var isFeature = geojson.type === 'Feature' && geojson.geometry;
        var isGeometry = geojson.coordinates;

        if (isGeomCol || isFeature || isGeometry) {
            if (argv["reverse"]) {
                geojson = reproject.reverse(geojson);
            }

            return reproject.reproject(geojson, fromCrs, toCrs, crss);
        }
    }

    return geojson
}

function loadJson(f) {
    var data;
    try {
        data = fs.readFileSync(f, 'utf8');
    } catch (e) {
        console.log("Could not open file \"" + f + "\": " + e);
        throw e;
    }

    try {
        return JSON.parse(data);
    } catch (e) {
        console.log("Could not parse JSON from file \"" + f + "\": " + e);
        throw e;
    }
}

function lookupCrs(crsName, cb) {
    if (!crsName) {
        cb(null);
        return;
    }

    if (!crss[crsName]) {
        var proj;
        try {
            proj = proj4(crsName);
        } catch (e) {
            // Ok, go on with proj unset.
        }

        if (proj) {
            return cb(proj);
        }

        if (useSpatialReference) {
            var crsPath = crsName.toLowerCase().replace(':', '/');
            getCrs(crsName, "http://www.spatialreference.org/ref/"+ crsPath + "/proj4/", cb);
        } else if (useEpsgIo) {
            getCrs(crsName, "http://epsg.io/" + crsName.split(":")[1] + ".proj4", cb);
        } else {
            throw new Error("Could not find definition for CRS \"" + crsName + "\".");
        }
    } else {
        cb(crss[crsName]);
    }
}

function getCrs(crsName, url, cb) {
    var crsDef = '';
    http.get(url, function(res) {
        if (res.statusCode != 200) {
            throw new Error("spatialreference.org responded with HTTP " + res.statusCode +
                " when looking up \"" + crsName + "\".");
        }
        res.on('data', function(chunk) {
            crsDef += chunk;
        }).on('end', function() {
            crss[crsName] = proj4(crsDef);
            cb(crss[crsName]);
        });
    });
}