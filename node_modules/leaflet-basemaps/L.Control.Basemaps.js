L.Control.Basemaps = L.Control.extend({
    _map: null,
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Event,
    options: {
        position: "bottomright",
        tileX: 0,
        tileY: 0,
        tileZ: 0,
        layers: [] // list of basemap layer objects, first in list is default and added to map with this control
    },
    basemap: null,
    onAdd: function(map) {
        this._map = map;
        var container = L.DomUtil.create("div", "basemaps leaflet-control closed");

        // disable events
        L.DomEvent.disableClickPropagation(container);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(container);
        }

        this.options.basemaps.forEach(function(d, i) {
            var basemapClass = "basemap";

            if (i === 0) {
                this.basemap = d;
                this._map.addLayer(d);
                basemapClass += " active";
            } else if (i === 1) {
                basemapClass += " alt";
            }
            var url;
            if (d.options.iconURL) {
                url = d.options.iconURL;
            } else {
                var coords = { x: this.options.tileX, y: this.options.tileY };
                url = L.Util.template(
                    d._url,
                    L.extend(
                        {
                            s: d._getSubdomain(coords),
                            x: coords.x,
                            y: d.options.tms ? d._globalTileRange.max.y - coords.y : coords.y,
                            z: this.options.tileZ
                        },
                        d.options
                    )
                );

                if (d instanceof L.TileLayer.WMS) {
                    // d may not yet be initialized, yet functions below expect ._map to be set
                    d._map = map;

                    // unfortunately, calling d.getTileUrl() does not work due to scope issues
                    // have to replicate some of the logic from L.TileLayer.WMS

                    // adapted from L.TileLayer.WMS::onAdd
                    var crs = d.options.crs || map.options.crs;
                    var wmsParams = L.extend({}, d.wmsParams);
                    var wmsVersion = parseFloat(wmsParams.version);
                    var projectionKey = wmsVersion >= 1.3 ? "crs" : "srs";
                    wmsParams[projectionKey] = crs.code;

                    // adapted from L.TileLayer.WMS::getTileUrl
                    var coords2 = L.point(coords);
                    coords2.z = this.options.tileZ;
                    var tileBounds = d._tileCoordsToBounds(coords2);
                    var nw = crs.project(tileBounds.getNorthWest());
                    var se = crs.project(tileBounds.getSouthEast());
                    var bbox = (wmsVersion >= 1.3 && crs === L.CRS.EPSG4326
                        ? [se.y, nw.x, nw.y, se.x]
                        : [nw.x, se.y, se.x, nw.y]
                    ).join(",");

                    url +=
                        L.Util.getParamString(wmsParams, url, d.options.uppercase) +
                        (d.options.uppercase ? "&BBOX=" : "&bbox=") +
                        bbox;
                }
            }

            var basemapNode = L.DomUtil.create("div", basemapClass, container);
            var imgNode = L.DomUtil.create("img", null, basemapNode);
            imgNode.src = url;
            if (d.options && d.options.label) {
                imgNode.title = d.options.label;
            }

            L.DomEvent.on(
                basemapNode,
                "click",
                function() {
                    // intercept open click on mobile devices and show options
                    if (this.options.basemaps.length > 2 && L.Browser.mobile) {
                        if (L.DomUtil.hasClass(container, "closed")) {
                            L.DomUtil.removeClass(container, "closed");
                            return;
                        }
                    }

                    //if different, remove previous basemap, and add new one
                    if (d != this.basemap) {
                        map.removeLayer(this.basemap);
                        map.addLayer(d);
                        d.bringToBack();
                        map.fire("baselayerchange", d);
                        this.basemap = d;

                        L.DomUtil.removeClass(container.getElementsByClassName("basemap active")[0], "active");
                        L.DomUtil.addClass(basemapNode, "active");

                        var altIdx = (i + 1) % this.options.basemaps.length;
                        L.DomUtil.removeClass(container.getElementsByClassName("basemap alt")[0], "alt");
                        L.DomUtil.addClass(container.getElementsByClassName("basemap")[altIdx], "alt");

                        L.DomUtil.addClass(container, "closed");
                    }
                },
                this
            );
        }, this);

        if (this.options.basemaps.length > 2 && !L.Browser.mobile) {
            L.DomEvent.on(
                container,
                "mouseenter",
                function() {
                    L.DomUtil.removeClass(container, "closed");
                },
                this
            );

            L.DomEvent.on(
                container,
                "mouseleave",
                function() {
                    L.DomUtil.addClass(container, "closed");
                },
                this
            );
        }

        this._container = container;
        return this._container;
    }
});

L.control.basemaps = function(options) {
    return new L.Control.Basemaps(options);
};
