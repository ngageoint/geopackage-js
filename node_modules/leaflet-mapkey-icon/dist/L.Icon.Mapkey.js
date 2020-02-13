L.Icon.Mapkey = L.DivIcon.extend({

    options: {
        size: 28,
        className: '',
        icon: 'mapkey',
        background: '#1F7499',
        color: '#fcfcf9',
        hoverScale: 1.4,
        borderRadius: null,
        additionalCSS: '',
        hoverEffect: true,
        hoverCSS: '',
        htmlCode: null,
        boxShadow: true,
    },
    initialize: function (options) {

        L.setOptions(this,options);


        this.options.borderRadius = this.options.borderRadius || this.options.size;

        this.options.iconSize = [this.options.size,this.options.size];
        var iconEl = document.createElement("div");
        var styleAttr = document.createAttribute("style");
        var classAttr = document.createAttribute("class");
        classAttr.value = 'leaflet-mki-'+new Date().getTime()+'-'+Math.round(Math.random()*100000)
        var style = [];
        style.push("height:"+(this.options.size)+"px");
        style.push("width:"+(this.options.size)+"px");
        style.push("line-height:"+(this.options.size)+"px");
        style.push("color:"+this.options.color);
        style.push("font-size:"+(this.options.size-8)+"px");
        style.push("border-radius:"+(this.options.borderRadius)+"px");
        style.push("text-align:center; transition-property:font-size||line-height||background||color;transition-duration: 0.2s;transition-timing-function: linear;");

        if (this.options.background){
            if (this.options.boxShadow){
                style.push("box-shadow: 2px 2px 10px 1px rgba(0, 0, 0, .8);");
            }
            style.push("background-color:"+this.options.background);
        }



        style.push(this.options.additionalCSS);
        styleAttr.value = style.join(';');

        iconEl.setAttributeNode(styleAttr);
        iconEl.setAttributeNode(classAttr);


        var mki = document.createElement("span");
        var classAttrSpan = document.createAttribute("class");
        classAttrSpan.value = "mki-intext mki-"+this.options.icon
        mki.setAttributeNode(classAttrSpan);

        if (this.options.htmlCode){
            var html = document.createElement("span");
            html.innerHTML = this.options.htmlCode;
            var classAttrSpan = document.createAttribute("class");
            classAttrSpan.value = "mki-intext";
            html.setAttributeNode(classAttrSpan);
            iconEl.appendChild(html);
            console.log(iconEl.outerHTML)
        } else {
            iconEl.appendChild(mki);
        }
        this.options.html = iconEl.outerHTML;
        this.options.className = 'leaflet-mki-blank';
        this.options.popupAnchor = [0,-this.options.size/2];


        /** hover and focus effect **/
        if (this.options.hoverEffect){

            var styleHover = [];
            var hoverScale = this.options.hoverScale;
            styleHover.push("height:"+this.options.size*hoverScale+"px!important");
            styleHover.push("width:"+this.options.size*hoverScale+"px!important");
            styleHover.push("margin-top:"+-1*(+this.options.size*hoverScale/2-this.options.size/2)+"px!important");
            styleHover.push("margin-left:"+-1*(+this.options.size*hoverScale/2-this.options.size/2)+"px!important");
            styleHover.push("line-height:"+(this.options.size*hoverScale)+"px!important");
            styleHover.push("font-size:"+(this.options.size*hoverScale-6*hoverScale)+"px!important");
            styleHover.push("border-radius:"+(this.options.borderRadius*hoverScale)+"px!important");
            styleHover.push(this.options.hoverCSS);
            var css='.'+classAttr.value+':hover,.'+classAttr.value+':focus{'+styleHover.join(";")+'}';
            style=document.createElement('style');
            if (style.styleSheet)
                style.styleSheet.cssText=css;
            else
                style.appendChild(document.createTextNode(css));
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        L.DivIcon.prototype.initialize.call(this, options);
    },
    onAdd : function (map) {
        L.DivIcon.prototype.onAdd.call(this, map);
    }
});

L.icon.mapkey = function (options) {
    return new L.Icon.Mapkey(options);
};