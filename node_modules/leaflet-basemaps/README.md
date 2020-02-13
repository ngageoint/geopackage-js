# Leaflet.Basemaps

A tile driven basemaps control for Leaflet.

It allows you to create a user interface control for choosing the basemap used on the map, based on a tile from a the
underlying tile service.

See the [example](//consbio.github.io/Leaflet.Basemaps).

_Tested with Leaflet 1.1.0_

## Install

```
npm install leaflet-basemaps
```

## Usage

Include the CSS:

```
<link rel="stylesheet" href="L.Control.Basemaps.css" />
```

Include the JavaScript:

```
<script src="L.Control.Basemaps-min.js"></script>
```

The control expects a list of TileLayer instances, constructed in the [normal way](http://leafletjs.com/reference.html#tilelayer).

An optional `label` property can be added in the options for each basemap, and this will be used to populate the tooltip
(HTML `title` attribute) for that basemap.

Each basemap is represented using a tile from the underlying tile service. Choose the tile x, y, z that provides the
best looking representative basemap image for your application.

`TileLayer.WMS` layers can also be used, and tile coordinates will be converted to bounding boxes to request the preview thumbnail.

The preview shows an alternative basemap to the currently selected basemap to be more apparent as a toggle between basemaps.

Note: this automatically adds the first basemap in your list to the map during initialization, so you don't need to add that
TileLayer to your map.

Example usage:

```
var basemaps = [
    L.tileLayer('//{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0,
        label: 'Toner Lite'  // optional label used for tooltip
    }),
    L.tileLayer('//{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0,
        label: 'Toner'
    }),
    L.tileLayer('//{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        subdomains: 'abcd',
        maxZoom: 16,
        minZoom: 1,
        label: 'Watercolor'
    }),
    L.tileLayer.wms('https://firms.modaps.eosdis.nasa.gov/wms/viirs', {
        layers: 'NASA FIRMS',
        label: 'NASA Fire Hotspots'
    })
];

map.addControl(L.control.basemaps({
    basemaps: basemaps,
    tileX: 0,  // tile X coordinate
    tileY: 0,  // tile Y coordinate
    tileZ: 1   // tile zoom level
}));
```

### Toggle Mode

To enable toggling between 2 basemaps, simply provide only 2 basemaps.

See [toggle example](//consbio.github.io/Leaflet.Basemaps/examples/toggle.html).

### Alternative Basemap Icons

To use a different thumbnail for your basemap, simply provide `iconURL`.

See [example](//consbio.github.io/Leaflet.Basemaps/examples/alternative_icons.html).

`iconURL` can point to a tile image within that basemap, but at a different
zoom level, x, or y position than the default for the basemaps. Or it can point
to an arbitrary image. Just make sure that the target image is not too big.

Example:

```
L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    minZoom: 0,
    label: 'Toner',
    iconURL: '//stamen-tiles-a.a.ssl.fastly.net/toner/4/2/5.png'
}),
L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    subdomains: 'abcd',
    maxZoom: 16,
    minZoom: 1,
    label: 'Watercolor',
    iconURL: 'alt_icon.jpg'
})
```

## Development

-   `npm install`
-   `node_modules/.bin/gulp` (starts file watcher)
-   `node_modules/.bin/gulp build` ( builds minified version)

## Credits:

Developed and maintained with support from the [Peninsular Florida Landscape Conservation Cooperative](http://peninsularfloridalcc.org) and additional support from the [U.S. Forest Service Northwest Regional Climate Hub](http://www.fs.fed.us/climatechange/nrch/).

## Contributors:

-   [Brendan Ward](https://github.com/brendan-ward)
-   [Nik Molnar](https://github.com/nikmolnar)
-   [Kaveh Karimi](https://github.com/ka7eh)
