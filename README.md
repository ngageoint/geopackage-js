# GeoPackage Node

#### Current Refactor ####
This library is currently being refactored to remove the reliance on  [GeoPackage Java](http://ngageoint.github.io/geopackage-java/).  The goal of this refactor is to open and edit GeoPackage files in the browser and Node.  Cloning this project and opening the index.html file in your browser allows you to open a GeoPackage.  Support is currently limited to Web Mercator tiles that are split along XYZ lines, but this is currently being worked to no longer be a restriction.  The demo can also open all feature tables.  The demo is very raw at this point and is currently being worked on.

#### GeoPackage Node Library ####

The [GeoPackage Libraries](http://ngageoint.github.io/GeoPackage/) were developed at the [National Geospatial-Intelligence Agency (NGA)](http://www.nga.mil/) in collaboration with [BIT Systems](http://www.bit-sys.com/). The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the [MIT license](http://choosealicense.com/licenses/mit/).

### Pull Requests ###
If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the MIT license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.

### About ###

[GeoPackage Node](https://github.com/ngageoint/geopackage-node) uses [GeoPackage Java](http://ngageoint.github.io/geopackage-java/) which is a [GeoPackage Library](http://ngageoint.github.io/GeoPackage/) Java implementation of the Open Geospatial Consortium [GeoPackage](http://www.geopackage.org/) [spec](http://www.geopackage.org/spec/).  It is listed as an [OGC GeoPackage Implementation](http://www.geopackage.org/#implementations_nga) by the National Geospatial-Intelligence Agency.

The GeoPackage Java library provides the ability to read, create, and edit GeoPackage files.

### Usage ###

    var GeoPackage = require('geopackage');

    // var newGeoPackage = '...';
    // var existingGeoPackage = '...';

    // Create a new GeoPackage
    var geoPackage = new GeoPackage();
    geoPackage.createAndOpenGeoPackageFile(newGeoPackage, function(geoPackage) {
      // file is created and open
    });

    // Open a GeoPackage
    var geoPackage = new GeoPackage();
    geoPackage.openGeoPackageFile(existingGeoPackage, function(err) {
      // file is open
    });

    // Feature and tile tables
    var featureTableNameArray = geoPackage.getFeatureTables();
    var tileTableNameArray = geoPackage.getTileTables();

    // Query Features
    geoPackage.iterateFeaturesFromTable(featureTable, function(err, feature, callback) {
      // feature is GeoJSON
      // call the callback when you are done processing the feature
      callback();
    });

    // Query Tiles
    geoPackage.getTileFromTable(tileTableName, z, x, y, function(err, tileStream) {
      // do something with the tileStream which is a png stream
    });

### Installation ###

Will update when this is out on npm

### Dependencies ###

#### Remote ####

* [GeoPackage Core Java](https://github.com/ngageoint/geopackage-core-java) (The MIT License (MIT)) - GeoPackage Library
* [WKB](https://github.com/ngageoint/geopackage-wkb-java) (The MIT License (MIT)) - GeoPackage Well Known Binary Lib
* [OrmLite](http://ormlite.com/) (Open Source License) - Object Relational Mapping (ORM) Library
* [SQLite JDBC](https://bitbucket.org/xerial/sqlite-jdbc) (Apache License, Version 2.0) - SQLiteJDBC library
