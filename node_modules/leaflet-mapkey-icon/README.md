<div style="text-align:center" align="center">
    <img width="50%" src="http://mapshakers.github.io/projects/leaflet-mapkey-icon/img/mapkeyIcons.svg" alt="mapkeyicons"/>
</div>

<div style="text-align:center" align="center">
    <img width="100%" src="http://mapshakers.github.io/projects/leaflet-mapkey-icon/img/leaflet-mapkeyicons.png" alt="mapkeyicons for leaflet"/>
</div>
mapkeyicons for leaflet
=====================
New dimension of markers for [Leaflet](http://leafletjs.com). It uses [mapkeyicons.com](http://mapkeyicons.com) also on github [mapshakers/mapkeyicons](https://github.com/mapshakers/mapkeyicons) .

*Compatible with Leaflet 0.6.0 or newer*

## Example
[Check out demo and examples!](http://mapshakers.github.io/projects/leaflet-mapkey-icon/)

## Getting started
Using leaflet-mapkey-icon plugin is very easy and comfortable.
### Usage
* Download and place files from ```dist``` folder to the same place in your project.
* Link javascript and style file in your HTML document:
```html
     <script src="...path-to-files.../L.Icon.Mapkey.js"></script>
     <link rel="stylesheet" href="...path-to-files.../MapkeyIcons.css" />
```
* Then use in simple way in javascript file:
```javascript
// Creating MapkeyIcon object
var mki = L.icon.mapkey({icon:"school",color:'#725139',background:'#f2c357',size:30}
// Append to marker:
L.marker([50,14.4],{icon:mki}).addTo(map);
```

### Options
| option          | Description            | Default Value | Possible  values                                     |
| --------------- | ---------------------- | ------------- | ---------------------------------------------------- |
| icon            | ID of icon             | 'mapkey'       | e.g. 'bar','school' [Check out mapkeyicons.com for icon names](http://www.mapkeyicons.com)   |
| size            | Size of icon in pixels | 26            | any number  |
| color           | Color of the icon      | 'white'       | any CSS color (e.g. 'red','rgba(20,160,90,0.5)', '#686868', ...) |
| background      | Color of the background| '#1F7499'     | any CSS color or false for no background |
| borderRadius    | Border radius of background in pixels  | '100%' (for circle icon) | any number (for circle size/2, for square 0.001)  | 
| hoverScale      | Number to scale icon on hover | 1.4 | any real number (best result in range 1 - 2, use 1 for no effect) |
| hoverEffect     | Toggle hover effect | true | true/false for switch on/off effect on hover |
| additionalCSS   | Additional CSS code to style icon | null | CSS code (e.g. "border:4px solid #aa3838;") | 
| hoverCSS       | CSS code to style icon on hover | null | CSS code (e.g. "'background-color:#992b00!important;color:#99defc!important;'") |
| htmlCode       | Use this instead of icon option | null | e.g. '&amp;#57347;','&amp;#xe003;' [Check out mapkeyicons.com for html code](http://www.mapkeyicons.com)  |
| boxShadow    | Switch on/off icon shadow | true | true/false | 

### License

**leaflet-mapkey-icon** is free software, and may be redistributed under the MIT-LICENSE.
