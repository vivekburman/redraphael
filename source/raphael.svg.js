import {getArrayCopy} from './raphael.lib';

/**!
* RedRaphael 1.0.0 - JavaScript Vector Library SVG Module
* Copyright (c) 2012-2013 FusionCharts Technologies <http://www.fusioncharts.com>
*
* Raphael 2.1.0 - JavaScript Vector Library SVG Module
* Copyright (c) 2008-2012 Dmitry Baranovskiy <http://raphaeljs.com>
* Copyright © 2008-2012 Sencha Labs <http://sencha.com>
*
* Licensed under the MIT license.
*/
// Define _window as window object in case of indivual file inclusion.

export default function (R) {
    if (R.svg) {
        var has = "hasOwnProperty",
            tSpanStr = "tspan",
            vAignStr = "vertical-align",
            lineHeightStr = "line-height",
            fontSizeStr = 'font-size',
            fontFamilyStr = 'font-family',
            textStr = "text",
            rtlStr = 'rtl',
            arrayStr = 'array',
            middleStr = 'middle',
            IESplTspanAttr = {
                    visibility: "hidden",
                    "font-size": "0px"
                },
            Str = String,
            toFloat = parseFloat,
            toInt = parseInt,
            theMSG,
            randomPos = -100,
            isIE = /*@cc_on!@*/false || !!document.documentMode,
            math = Math,
            mmax = math.max,
            abs = math.abs,
            pow = math.pow,
            sqrt = math.sqrt,
            xlinkRegx = /^xlink\:/,
            separator = /[, ]+/,
            arrayShift = Array.prototype.shift,
            zeroStrokeFix = !!(/AppleWebKit/.test(R._g.win.navigator.userAgent) &&
                    (!/Chrome/.test(R._g.win.navigator.userAgent) ||
                    R._g.win.navigator.appVersion.match(/Chrome\/(\d+)\./)[1] < 29)),
            eve = R.eve,
            E = "",
            S = " ",
            xlink = "http://www.w3.org/1999/xlink",
            svgNSStr = "http://www.w3.org/2000/svg",
            typeStringSTR = "string",
            markers = {
                block: "M5,0 0,2.5 5,5z",
                classic: "M5,0 0,2.5 5,5 3.5,3 3.5,2z",
                diamond: "M2.5,0 5,2.5 2.5,5 0,2.5z",
                open: "M6,1 1,3.5 6,6",
                oval: "M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"
            },
            shapeRenderingAttrs = {
                speed: 'optimizeSpeed',
                crisp: 'crispEdges',
                precision: 'geometricPrecision'
            },
            markerCounter = {};

        R.cachedFontHeight = {};

        R.toString = function() {
            return  "Your browser supports SVG.\nYou are running Rapha\xebl " + this.version;
        };

        // Code commented as resources will now be referenced using relative urls.
        // @todo Remove once we have acertained that there are no issues in any environment.
        // Automatic gradient and other reference update on state change
        // R._url = (/msie/i.test(navigator.userAgent) && !window.opera) ?
        //     E : updateReferenceUrl();
        // if (R._url && R._g.win.history.pushState) {
        //     R._g.win.history.pushState = (function () {
        //         var fn = R._g.win.history.pushState;
        //         return function () {
        //             var ret = fn.apply(R._g.win.history, arguments);
        //             return updateReferenceUrl(), ret;
        //         };
        //     }());
        //     R._g.win.addEventListener("popstate", updateReferenceUrl, false);
        // }
        R._url = E;

        var updateGradientReference = function (element, newGradient) {
            var gradient = element.gradient;

            if (gradient) {
                if (gradient === newGradient) {
                    return; // no change
                }
                // else gradient is specified and it is not same as newGradient, implying a dereference
                gradient.refCount--;
                if (!gradient.refCount) {
                    gradient.parentNode.removeChild(gradient);
                }
                delete element.gradient;
            }

            if (newGradient) { // add new gradient
                element.gradient = newGradient;
                newGradient.refCount++;
            }
        };

        var $ = R._createNode = function(el, attr) {
            // Create the element
            if (typeof el == typeStringSTR) {
                el = R._g.doc.createElementNS(svgNSStr, el);
            } 
            // else {
                
            // }
            if (attr) {
                var key;
                for (key in attr)
                    if (attr[has](key)) {
                        if (xlinkRegx.test(key)) {
                            el.setAttributeNS(xlink, key.replace(xlinkRegx, E), attr[key]);
                        } else {
                            el.setAttribute(key, attr[key]);
                        }
                    }
            }
            return el;
        },
        gradientUnitNames = {
            userSpaceOnUse: 'userSpaceOnUse',
            objectBoundingBox: 'objectBoundingBox'
        },
        gradientSpreadNames = {
            pad: 'pad',
            redlect: 'reflect',
            repeat: 'repeat'
        },
        addGradientFill = function(element, gradient) {
            if (!element.paper || !element.paper.defs) {
                return 0;
            }

            var type = "linear",
                SVG = element.paper,
                id = R.getElementID((SVG.id + '-' + gradient).replace(/[\(\)\s%:,\xb0#]/g, "_")),
                fx = .5, fy = .5, r, cx, cy, units, spread,
                o = element.node,
                s = o.style,
                el = R._g.doc.getElementById(id);

            if (!el) {
                gradient = Str(gradient).replace(R._radial_gradient, function(all, opts) {
                    type = "radial";
                    opts = opts && opts.split(',') || [];
                    units = opts[5];
                    spread = opts[6];

                    var _fx = opts[0],
                        _fy = opts[1],
                        _r = opts[2],
                        _cx = opts[3],
                        _cy = opts[4],
                        shifted = (_fx && _fy),
                        dir,
                        sqx;

                    if (_r) {
                        r = /\%/.test(_r) ? _r : toFloat(_r);
                    }

                    if (units === gradientUnitNames.userSpaceOnUse) {
                        if (shifted) {
                            fx = _fx;
                            fy = _fy;
                        }
                        if (_cx && _cy) {
                            cx = _cx;
                            cy = _cy;
                            if (!shifted) {
                                fx = cx;
                                fy = cy;
                            }
                        }
                        return E;
                    }

                    if (shifted) {
                        fx = toFloat(_fx);
                        fy = toFloat(_fy);
                        dir = ((fy > .5) * 2 - 1);
                        (sqx = pow(fx - .5, 2)) + pow(fy - .5, 2) > .25 &&
                        (sqx < .25) && (fy = sqrt(.25 - sqx) * dir + .5) &&
                        fy !== .5 &&
                        (fy = fy.toFixed(5) - 1e-5 * dir);
                    }
                    if (_cx && _cy) {
                        cx = toFloat(_cx);
                        cy = toFloat(_cy);
                        dir = ((cy > .5) * 2 - 1);

                        (sqx = pow(cx - .5, 2)) + pow(cy - .5, 2) > .25 &&
                        (sqx < .25) && (cy = sqrt(.25 - sqx) * dir + .5) &&
                        cy !== .5 &&
                        (cy = cy.toFixed(5) - 1e-5 * dir);

                        if (!shifted) {
                            fx = cx;
                            fy = cy;
                        }
                    }

                    return E;
                });
                gradient = gradient.split(/\s*\-\s*/);
                if (type == "linear") {
                    var angle = gradient.shift(),
                        specs = angle.match(/\((.*)\)/),
                        vector,
                        max;

                    specs = specs && specs[1] && specs[1].split(/\s*\,\s*/);
                    angle = -toFloat(angle);
                    if (isNaN(angle)) {
                        return null;
                    }
                    if (specs && specs.length) {
                        if (specs[0] in gradientUnitNames) {
                            units = specs.shift();
                            (specs[0] in gradientSpreadNames) &&
                                (spread = specs.shift());
                        }
                        else {
                            specs[4] && (units = specs[4]);
                            specs[5] && (spread = specs[5]);
                        }

                        /** @todo apply angle rotation and validation */
                        vector = [
                            specs[0] || "0%", specs[1] || "0%",
                            specs[2] || "100%", specs[3] || "0%"
                        ];
                    }
                    else {
                        vector = [0, 0, math.cos(R.rad(angle)), math.sin(R.rad(angle))];
                        max = 1 / (mmax(abs(vector[2]), abs(vector[3])) || 1);
                        vector[2] *= max;
                        vector[3] *= max;
                        if (vector[2] < 0) {
                            vector[0] = -vector[2];
                            vector[2] = 0;
                        }
                        if (vector[3] < 0) {
                            vector[1] = -vector[3];
                            vector[3] = 0;
                        }
                    }
                }
                var dots = R._parseDots(gradient);
                if (!dots) {
                    return null;
                }

                el = $(type + "Gradient", {
                    id: id
                });
                el.refCount = 0;
                (units in gradientUnitNames) &&
                        el.setAttribute('gradientUnits', Str(units));
                (spread in gradientSpreadNames) &&
                        el.setAttribute('spreadMethod', Str(spread));
                if (type === "radial") {
                    (r !== undefined) && el.setAttribute('r', Str(r));

                    if (cx !== undefined && cy !== undefined) {
                        el.setAttribute('cx', Str(cx));
                        el.setAttribute('cy', Str(cy));
                    }
                    el.setAttribute('fx', Str(fx));
                    el.setAttribute('fy', Str(fy));
                }
                else {
                    $(el, {
                        x1: vector[0],
                        y1: vector[1],
                        x2: vector[2],
                        y2: vector[3]
                    });
                }

                for (var i = 0, ii = dots.length; i < ii; i++) {
                    el.appendChild($("stop", {
                        offset: dots[i].offset ? dots[i].offset : i ? "100%" : "0%",
                        "stop-color": dots[i].color || "#fff",
                        //add stop opacity information
                        "stop-opacity": dots[i].opacity === undefined ? 1 : dots[i].opacity
                    }));
                }
                SVG.defs.appendChild(el);
            }

            updateGradientReference(element, el);

            $(o, {
                fill: "url('" + R._url + "#" + id + "')",
                "fill-opacity": 1
            });

            s.fill = E;
            s.fillOpacity = 1;
            return 1;
        },
        updatePosition = function(o) {
            var bbox = o.getBBox(1);
            $(o.pattern, {
                patternTransform: o.matrix.invert() + " translate(" + bbox.x + "," + bbox.y + ")"
            });
        },
        addArrow = function(o, value, isEnd) {
            if (o.type == "path") {
                var values = Str(value).toLowerCase().split("-"),
                p = o.paper,
                se = isEnd ? "end" : "start",
                node = o.node,
                attrs = o.attrs,
                stroke = attrs["stroke-width"],
                i = values.length,
                type = "classic",
                from,
                to,
                dx,
                refX,
                attr,
                w = 3,
                h = 3,
                t = 5;
                while (i--) {
                    switch (values[i]) {
                        case "block":
                        case "classic":
                        case "oval":
                        case "diamond":
                        case "open":
                        case "none":
                            type = values[i];
                            break;
                        case "wide":
                            h = 5;
                            break;
                        case "narrow":
                            h = 2;
                            break;
                        case "long":
                            w = 5;
                            break;
                        case "short":
                            w = 2;
                            break;
                    }
                }
                if (type == "open") {
                    w += 2;
                    h += 2;
                    t += 2;
                    dx = 1;
                    refX = isEnd ? 4 : 1;
                    attr = {
                        fill: "none",
                        stroke: attrs.stroke
                    };
                } else {
                    refX = dx = w / 2;
                    attr = {
                        fill: attrs.stroke,
                        stroke: "none"
                    };
                }
                if (o._.arrows) {
                    if (isEnd) {
                        o._.arrows.endPath && markerCounter[o._.arrows.endPath]--;
                        o._.arrows.endMarker && markerCounter[o._.arrows.endMarker]--;
                    } else {
                        o._.arrows.startPath && markerCounter[o._.arrows.startPath]--;
                        o._.arrows.startMarker && markerCounter[o._.arrows.startMarker]--;
                    }
                } else {
                    o._.arrows = {};
                }
                if (type != "none") {
                    var pathId = "raphael-marker-" + type,
                    markerId = "raphael-marker-" + se + type + w + h + "-obj" + o.id;
                    if (!R._g.doc.getElementById(pathId)) {
                        p.defs.appendChild($($("path"), {
                            "stroke-linecap": "round",
                            d: markers[type],
                            id: pathId
                        }));
                        markerCounter[pathId] = 1;
                    } else {
                        markerCounter[pathId]++;
                    }
                    var marker = R._g.doc.getElementById(markerId),
                    use;
                    if (!marker) {
                        marker = $($("marker"), {
                            id: markerId,
                            markerHeight: h,
                            markerWidth: w,
                            orient: "auto",
                            refX: refX,
                            refY: h / 2
                        });
                        use = $($("use"), {
                            "xlink:href": "#" + pathId,
                            transform: (isEnd ? "rotate(180 " + w / 2 + " " + h / 2 + ") " : E) + "scale(" + w / t + "," + h / t + ")",
                            "stroke-width": (1 / ((w / t + h / t) / 2)).toFixed(4)
                        });
                        marker.appendChild(use);
                        p.defs.appendChild(marker);
                        markerCounter[markerId] = 1;
                    } else {
                        markerCounter[markerId]++;
                        use = marker.getElementsByTagName("use")[0];
                    }
                    $(use, attr);
                    var delta = dx * (type != "diamond" && type != "oval");
                    if (isEnd) {
                        from = o._.arrows.startdx * stroke || 0;
                        to = R.getTotalLength(attrs.path) - delta * stroke;
                    } else {
                        from = delta * stroke;
                        to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                    }
                    attr = {};
                    attr["marker-" + se] = "url('" + R._url + "#" + markerId + "')";
                    if (to || from) {
                        attr.d = R.getSubpath(attrs.path, from, to);
                    }
                    $(node, attr);
                    o._.arrows[se + "Path"] = pathId;
                    o._.arrows[se + "Marker"] = markerId;
                    o._.arrows[se + "dx"] = delta;
                    o._.arrows[se + "Type"] = type;
                    o._.arrows[se + typeStringSTR] = value;
                } else {
                    if (isEnd) {
                        from = o._.arrows.startdx * stroke || 0;
                        to = R.getTotalLength(attrs.path) - from;
                    } else {
                        from = 0;
                        to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                    }
                    o._.arrows[se + "Path"] && $(node, {
                        d: R.getSubpath(attrs.path, from, to)
                    });
                    delete o._.arrows[se + "Path"];
                    delete o._.arrows[se + "Marker"];
                    delete o._.arrows[se + "dx"];
                    delete o._.arrows[se + "Type"];
                    delete o._.arrows[se + typeStringSTR];
                }
                for (attr in markerCounter)
                    if (markerCounter[has](attr) && !markerCounter[attr]) {
                        var item = R._g.doc.getElementById(attr);
                        item && item.parentNode.removeChild(item);
                    }
            }
        },
        dasharray = {
            // In Firefox 37.0.1 the value of "stroke-dasharray" attribute `0` make the stroke/border invisible.
            // The actual issue is setting `none` as the value of `stroke-dasharray` attribute
            // redraphael internally changes the "none" value to "0", thus the stroke/border becomes invisible
            // To fix this issue now instead of setting the value as `0` for `stroke-dasharray` attribute
            // now using `none` string as none is a w3c standard value for stroke-dasharray
            "": ["none"],
            "none": ["none"],
            "-": [3, 1],
            ".": [1, 1],
            "-.": [3, 1, 1, 1],
            "-..": [3, 1, 1, 1, 1, 1],
            ". ": [1, 3],
            "- ": [4, 3],
            "--": [8, 3],
            "- .": [4, 3, 1, 3],
            "--.": [8, 3, 1, 3],
            "--..": [8, 3, 1, 3, 1, 3]
        },
        addDashes = function(o, value, params) {
            var predefValue = dasharray[Str(value).toLowerCase()],
                calculatedValues,
                width,
                butt,
                i,
                l,
                widthFactor;

            value = predefValue || ((value !== undefined) && [].concat(value));
            if (value) {

                width = o.attrs["stroke-width"] || 1;
                butt = {
                    round: width,
                    square: width,
                    butt: 0
                }[params["stroke-linecap"] || o.attrs["stroke-linecap"]] || 0;
                l = i = value.length;
                widthFactor = predefValue ? width : 1;

                if (value[0] == 'none') {
                    calculatedValues = value;
                }
                else {
                    calculatedValues = [];
                    while (i--) {
                        calculatedValues[i] = (value[i] * widthFactor + ((i % 2) ? 1 : -1) * butt);
                        calculatedValues[i] <= 0 && (calculatedValues[i] = 0.01 + (width <= 1 ? butt : 0));
                        if (isNaN(calculatedValues[i])) {
                        calculatedValues[i] = 0;
                    }
                    }
                }

                if (R.is(value, arrayStr)) {
                    $(o.node, {
                        "stroke-dasharray": calculatedValues.join(",")
                    });
                }
            }
        },

        setFillAndStroke = R._setFillAndStroke = function(o, params) {
            if (!o.paper.canvas) {
                return;
            }
            var node = o.node,
                attrs = o.attrs,
                paper = o.paper,
                s = node.style,
                vis = s.visibility,
                i,
                l;
            // Convert all the &lt; and &gt; to < and > and if there is any <br/> tag in between &lt; and &gt;
            // then converting them into <<br/> and ><br/> respectively.
            if (params && params.text && params.text.replace) {
                params.text = params.text.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                    .replace(/&<br\/>lt;|&l<br\/>t;|&lt<br\/>;/g, "<<br/>")
                    .replace(/&<br\/>gt;|&g<br\/>t;|&gt<br\/>;/g, "><br/>");
            }
            s.visibility = "hidden";
            if (o.type === "image") {
                LoadRefImage(o, params);
            }
            for (var att in params) {
                if (params[has](att)) {
                    if (!R._availableAttrs[has](att)) {
                        continue;
                    }
                    var value = params[att];
                    attrs[att] = value;
                    if (value === E) {
                        delete o.attrs[att];
                        node.removeAttribute(att);
                        continue;
                    }
                    switch (att) {
                        case "blur":
                            o.blur(value);
                            break;
                        case "href":
                        case "title":
                        case "target":
                            var pn = node.parentNode;
                            if (pn.tagName.toLowerCase() != "a") {
                                if (value == E) { break; }
                                var hl = $("a");
                                hl.raphael = true;
                                hl.raphaelid = node.raphaelid;
                                pn.insertBefore(hl, node);
                                hl.appendChild(node);
                                pn = hl;
                            }
                            if (att == "target") {
                                pn.setAttributeNS(xlink, "show", value == "blank" ? "new" : value);
                            } else {
                                pn.setAttributeNS(xlink, att, value);
                            }
                            node.titleNode = pn;
                            break;
                        case "cursor":
                            s.cursor = value;
                            break;
                        case "transform":
                            o.transform(value);
                            break;
                        case "rotation":
                            if (R.is(value, arrayStr)) {
                                o.rotate.apply(o, value);
                            }
                            else {
                                o.rotate(value);
                            }
                            break;
                        case "arrow-start":
                            addArrow(o, value);
                            break;
                        case "arrow-end":
                            addArrow(o, value, 1);
                            break;
                        case "clip-path":
                            var pathClip = true;
                        case "clip-rect":
                            var rect = !pathClip && Str(value).split(separator);
                            o._.clipispath = !!pathClip;
                            if (pathClip || rect.length == 4) {
                                o.clip && o.clip.parentNode.parentNode.removeChild(o.clip.parentNode);
                                var el = $("clipPath"),
                                rc = $(pathClip ? "path" : "rect");
                                el.id = R.getElementID(R.createUUID());
                                $(rc, pathClip ? {
                                    d: value ? attrs['clip-path'] = R._pathToAbsolute(value) : R._availableAttrs.path,
                                    fill: 'none'
                                } : {
                                    x: rect[0],
                                    y: rect[1],
                                    width: rect[2],
                                    height: rect[3],
                                    transform: o.matrix.invert()
                                });
                                el.appendChild(rc);
                                paper.defs.appendChild(el);
                                $(node, {
                                    "clip-path": "url('" + R._url +"#" + el.id + "')"
                                });
                                o.clip = rc;
                            }
                            if (!value) {
                                var path = node.getAttribute("clip-path");
                                if (path) {
                                    var clip = R._g.doc.getElementById(path.replace(/(^url\(#|\)$)/g, E));
                                    clip && clip.parentNode.removeChild(clip);
                                    $(node, {
                                        "clip-path": E
                                    });
                                    document.documentMode === 11 && node.removeAttribute('clip-path');
                                    delete o.clip;
                                }
                            }
                            break;
                        case "path":
                            if (o.type == "path") {
                                $(node, {
                                    d: value ? attrs.path = R._pathToAbsolute(value) : R._availableAttrs.path
                                });
                                o._.dirty = 1;
                                if (o._.arrows) {
                                    "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                    "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                                }
                            }
                            break;
                        case "width":
                            node.setAttribute(att, value);
                            o._.dirty = 1;
                            if (attrs.fx) {
                                att = "x";
                                value = attrs.x;
                            } else {
                                break;
                            }
                        case "x":
                            if (attrs.fx) {
                                value = -attrs.x - (attrs.width || 0);
                            }
                        case "rx":
                            if (att == "rx" && o.type == "rect") {
                                break;
                            }
                        case "cx":
                            node.setAttribute(att, value);
                            o.pattern && updatePosition(o);
                            o._.dirty = 1;
                            break;
                        case "height":
                            node.setAttribute(att, value);
                            o._.dirty = 1;
                            if (attrs.fy) {
                                att = "y";
                                value = attrs.y;
                            } else {
                                break;
                            }
                        case "y":
                            if (attrs.fy) {
                                value = -attrs.y - (attrs.height || 0);
                            }
                        case "ry":
                            if (att == "ry" && o.type == "rect") {
                                break;
                            }
                        case "cy":
                            node.setAttribute(att, value);
                            o.pattern && updatePosition(o);
                            o._.dirty = 1;
                            break;
                        case "r":
                            if (o.type == "rect") {
                                $(node, {
                                    rx: value,
                                    ry: value
                                });
                            } else {
                                node.setAttribute(att, value);
                            }
                            o._.dirty = 1;
                            break;
                        case "src":
                            if (o.type == "image") {
                                node.setAttributeNS(xlink, "href", value);
                            }
                            break;
                        case "stroke-width":
                            if (o._.sx != 1 || o._.sy != 1) {
                                value /= mmax(abs(o._.sx), abs(o._.sy)) || 1;
                            }
                            if (paper._vbSize) {
                                value *= paper._vbSize;
                            }
                            if (zeroStrokeFix && value === 0) {
                                value = 0.000001;
                            }
                            node.setAttribute(att, value);
                            if (attrs["stroke-dasharray"]) {
                                addDashes(o, attrs["stroke-dasharray"], params);
                            }
                            if (o._.arrows) {
                                "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                            }
                            break;
                        case "stroke-dasharray":
                            addDashes(o, value, params);
                            break;
                        case "fill":
                            var isURL = Str(value).match(R._ISURL);
                            if (isURL) {
                                el = $("pattern");
                                var ig = $("image");
                                el.id = R.getElementID(R.createUUID());
                                $(el, {
                                    x: 0,
                                    y: 0,
                                    patternUnits: "userSpaceOnUse",
                                    height: 1,
                                    width: 1
                                });
                                $(ig, {
                                    x: 0,
                                    y: 0,
                                    "xlink:href": isURL[1]
                                });
                                el.appendChild(ig);

                                (function(el) {
                                    R._preload(isURL[1], function() {
                                        var w = this.offsetWidth,
                                        h = this.offsetHeight;
                                        $(el, {
                                            width: w,
                                            height: h
                                        });
                                        $(ig, {
                                            width: w,
                                            height: h
                                        });
                                        paper.safari();
                                    });
                                })(el);
                                paper.defs.appendChild(el);
                                s.fill = "url('" + R._url + "#" + el.id + "')";
                                $(node, {
                                    fill: s.fill
                                });

                                o.pattern = el;
                                o.pattern && updatePosition(o);
                                break;
                            }
                            var clr = R.getRGB(value);
                            if (!clr.error) {
                                delete params.gradient;
                                delete attrs.gradient;
                                // !R.is(attrs.opacity, "undefined") &&
                                //     R.is(params.opacity, "undefined") &&
                                //     $(node, {
                                //         opacity: attrs.opacity
                                //     });
                                !R.is(attrs["fill-opacity"], "undefined") &&
                                    R.is(params["fill-opacity"], "undefined") &&
                                    $(node, {
                                        "fill-opacity": attrs["fill-opacity"]
                                    });
                                o.gradient && updateGradientReference(o);
                            }
                            else if ((o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value)) {
                                // The reason for this block of code is not known, hence it is commented out as it is causeing issues in 
                                // IE8 browser for gradient color
                                /*if ("opacity" in attrs || "fill-opacity" in attrs) {
                                    var gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                                    if (gradient) {
                                        var stops = gradient.getElementsByTagName("stop");
                                        $(stops[stops.length - 1], {
                                            "stop-opacity": ("opacity" in attrs ? attrs.opacity : 1) * ("fill-opacity" in attrs ? attrs["fill-opacity"] : 1)
                                        });
                                    }
                                }*/
                                attrs.gradient = value;
                                // attrs.fill = "none";
                                s.fill = E;
                                break;
                            }
                            if (clr[has]("opacity")) {
                                $(node, {
                                    "fill-opacity": (s.fillOpacity =
                                        (clr.opacity > 1 ? clr.opacity / 100 : clr.opacity))
                                });
                                o._.fillOpacityDirty = true;
                            }
                            else if (o._.fillOpacityDirty && R.is(attrs['fill-opacity'], "undefined") &&
                                    R.is(params["fill-opacity"], "undefined")) {
                                node.removeAttribute('fill-opacity');
                                s.fillOpacity = E;
                                delete o._.fillOpacityDirty;
                            }
                        case "stroke":
                            clr = R.getRGB(value);
                            node.setAttribute(att, clr.hex);
                            s[att] = clr.hex;
                            if (att == "stroke") { // remove stroke opacity when stroke is set to none
                                if (clr[has]("opacity")) {
                                    $(node, {
                                        "stroke-opacity": (s.strokeOpacity =
                                            (clr.opacity > 1 ? clr.opacity / 100 : clr.opacity))
                                    });
                                    o._.strokeOpacityDirty = true;
                                }
                                else if (o._.strokeOpacityDirty && R.is(attrs['stroke-opacity'], "undefined") &&
                                        R.is(params["stroke-opacity"], "undefined")) {
                                    node.removeAttribute('stroke-opacity');
                                    s.strokeOpacity = E;
                                    delete o._.strokeOpacityDirty;
                                }
                                if (o._.arrows) {
                                    "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                    "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                                }
                            }
                            break;
                        case "gradient":
                            (o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value);
                            break;
                        case 'line-height': // do not apply
                        case 'vertical-align': // do not apply
                            break;
                        case "visibility":
                            value === 'hidden' ? o.hide() : o.show();
                            break;
                        case "opacity":
                            // if (attrs.gradient && !attrs[has]("stroke-opacity")) {
                            //     $(node, {
                            //         "stroke-opacity": value > 1 ? value / 100 : value
                            //     });
                            // }
                            value = value > 1 ? value / 100 : value;
                            $(node, {
                                "opacity": value
                            });
                            s.opacity = value;
                            break;
                        // fall
                        case "fill-opacity":
                            // if (attrs.gradient) {
                            //     gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\([\'\"]#|[\'\"]\)$/g, E));
                            //     if (gradient) {
                            //         stops = gradient.getElementsByTagName("stop");
                            //         l = stops.length;
                            //         for (i = 0; i < l; i += 1) {
                            //           $(stops[i], {
                            //               "stop-opacity": value
                            //           });
                            //         }
                            //     }
                            //     break;
                            // }
                            value = value > 1 ? value / 100 : value;
                            $(node, {
                                "fill-opacity": value
                            });
                            s.fillOpacity = value;
                            break;
                        case "shape-rendering":
                            o.attrs[att] = value = shapeRenderingAttrs[value] || value || 'auto';
                            node.setAttribute(att, value);
                            node.style.shapeRendering = value;
                            break;
                        default:
                            att == fontSizeStr && (value = toInt(value, 10) + "px");
                            var cssrule = att.replace(/(\-.)/g, function(w) {
                                return w.substring(1).toUpperCase();
                            });
                            s[cssrule] = value;
                            o._.dirty = 1;
                            node.setAttribute(att, value);
                            break;
                    }
                }
            }
            (o.type === 'text' && !params["_do-not-tune"]) && tuneText(o, params);
            s.visibility = vis;
        },
        /*
        * Keeps the follower element in sync with the leaders.
        * First and second arguments represents the context(element) and the
        name of the callBack function respectively.
        * The callBack is invoked for indivual follower Element with the rest of
        arguments.
        */
        updateFollowers = R._updateFollowers = function () {
            var i,
                ii,
                followerElem,
                args = getArrayCopy(arguments),
                o = arrayShift.call(args),
                fnName = arrayShift.call(args);
            for (i = 0, ii = o.followers.length; i < ii; i++) {
                followerElem = o.followers[i].el;
                followerElem[fnName].apply(followerElem, args);
            }
        },
        leading = 1.2,
        tuneText = function(el, params) {
            if (el.type != textStr || !(params[has](textStr) || params[has]("font") ||
                    params[has](fontSizeStr) || params[has]("x") || params[has]("y") ||
                    params[has](lineHeightStr) || params[has](vAignStr))) {
                return;
            }
            var a = el.attrs,
                group = el.parent,
                node = el.node,
                fontSize,
                oldAttr = el._oldAttr = el._oldAttr || {tspanAttr: {}},
                lineHeight = toFloat(params[lineHeightStr] || a[lineHeightStr]),
                actualValign,
                direction = params.direction || a.direction || (group && group.attrs && group.attrs.direction) || oldAttr.direction || "initial",
                valign,
                nodeAttr = {},
                updateNode,
                tspanAttr = {},
                updateTspan,
                i,
                l,
                ii,
                // For rtl text in IE there is a blank tspan to fix RTL rendering issues in IE.
                // So there will twice the amount of tSpan
                j = !isIE && direction === rtlStr ? 2 : 1,
                texts,
                tempIESpan,
                tspan,
                updateAlignment,
                tspans,
                text;
            // If line height is not valid (0, NaN, undefuned), then derive it from fontSize
            if (!lineHeight) {
                fontSize = params.fontSize || params[fontSizeStr] || a[fontSizeStr] || (group && group.attrs && group.attrs.fontSize);
                fontSize = fontSize ?  fontSize.toString().replace(/px/, E) : 10;
                lineHeight = fontSize * leading;
            }

            if (params[has]("x") && oldAttr.tspanAttr.x != params.x){ // X change
                // If the x is getting changed, then node and the tspan both needs to be updated
                oldAttr.tspanAttr.x = tspanAttr.x = nodeAttr.x = a.x;
                updateNode = true;
                updateTspan = true;
            }
            if (params[has]("y") && oldAttr.y != params.y) { // Y change
                oldAttr.y = nodeAttr.y = a.y;
                updateNode = true;
            }

            if (lineHeight != oldAttr.lineHeight) { // lineHeight change
                oldAttr.lineHeight = oldAttr.tspanAttr.dy = tspanAttr.dy = lineHeight;
                updateTspan = true;
                updateAlignment = true;
                oldAttr.baseLineDiff = lineHeight * 0.75; //Aprox calculation
            }

            if (params[has](vAignStr)) { // vAlign change
                actualValign = a[has](vAignStr) ? a[vAignStr] : middleStr;
                valign = actualValign === 'top' ? 0 : (actualValign === 'bottom' ? -1 : -0.5);
                if (valign != oldAttr.valign) {
                    oldAttr.valign = valign;
                    updateAlignment = true;
                }
            }

            // If the text was RTL earlier and now changed or vice versa
            if (!isIE && direction != oldAttr.direction) {
                // remove all tspans
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }
                // reset the tspan count as well
                oldAttr.lineCount = 0;
            }
            oldAttr.direction = direction;

            // If the containing text got changed
            if (params[has](textStr)) {
                // If the text is an arra then join with <br>
                text = R.is(params.text, arrayStr) ? params.text.join('<br>') : params.text;
                // If it is a new text applied
                if (text !==  oldAttr.text) {
                    oldAttr.text = a.text = text;
                    texts = Str(text).split(/\n|<br\s*?\/?>/ig);
                    l = texts.length;
                    if (oldAttr.lineCount != l) {
                        oldAttr.lineCount = l;
                        updateAlignment = true;
                    }
                    tspans = node.getElementsByTagName(tSpanStr);
                    for (i = 0; i < l; i++) {
                        if (tspan = tspans[i * j]) { // If already there is a tspan then remove the text
                            tspan.innerHTML = E;
                            if(updateTspan) { // If update required, update here
                                $(tspan, tspanAttr);
                            }
                        } else { // Else create a new span
                            tspan = $(tSpanStr, oldAttr.tspanAttr);
                            node.appendChild(tspan);
                            // Special fix for RTL texts in IE-SVG browsers
                            if (!isIE && direction === rtlStr) {
                                tempIESpan = $(tSpanStr, IESplTspanAttr);
                                tempIESpan.appendChild(R._g.doc.createTextNode("i"));
                                node.appendChild(tempIESpan);
                            }
                        }
                        // If it is a blank line, preserve it
                        if (!texts[i]) {
                            tspan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve");
                            texts[i] = " ";
                        }
                        tspan.appendChild(R._g.doc.createTextNode(texts[i]));
                    }

                    ii = l * j;
                    // If there are already more tspan than required, then remove the extra tspans
                    if (tspans.length > ii) {
                        for (i = tspans.length - 1; i >= ii; i -= 1) {
                            node.removeChild(tspans[i]);
                        }
                    }
                    // Already attributes are getting updated here
                    updateTspan = false;
                }
            }

            // the tspans needs to be updated
            if (updateTspan) {
                tspans = node.getElementsByTagName(tSpanStr); // @note: don't count on tspan, rather store the previous count
                ii = tspans.length;

                for (i = 0; i < ii; i += j) {
                    $(tspans[i], tspanAttr);
                }
            }

            // Update the node's attribute
            if (updateNode){
                $(node, nodeAttr);
            }
            // Update the dy of the first tspan according to the v-alignment
            if (updateAlignment) {
                tspan = node.getElementsByTagName(tSpanStr)[0];
                tspan && $(tspan, {
                    dy: oldAttr.baseLineDiff + (oldAttr.lineCount * oldAttr.lineHeight * oldAttr.valign)
                });
            }
        },
        Element = function(node, svg, group/*, dontAppend*/) {
            var o = this,
                parent = group || svg;

            /*!dontAppend && */parent.canvas && parent.canvas.appendChild(node);

            o.node = o[0] = node;
            node.raphael = true;
            node.raphaelid = o.id = R._oid++;

            o.matrix = R.matrix();
            o.realPath = null;

            o.attrs = o.attrs || {};
            o.followers = o.followers || [];

            o.paper = svg;
            o.ca = o.customAttributes = o.customAttributes ||
                new svg._CustomAttributes();

            o._ = {
                transform: [],
                sx: 1,
                sy: 1,
                deg: 0,
                dx: 0,
                dy: 0,
                dirty: 1
            };

            o.parent = parent;
            !parent.bottom && (parent.bottom = o);

            o.prev = parent.top;
            parent.top && (parent.top.next = o);
            parent.top = o;
            o.next = null;
        },
        elproto = R.el;

        Element.prototype = elproto;
        elproto.constructor = Element;

        R._engine.getNode = function (el) {
            var node = el.node || el[0].node;
            return node.titleNode || node;
        };
        R._engine.getLastNode = function (el) {
            var node = el.node || el[el.length - 1].node;
            return node.titleNode || node;
        };

        elproto.rotate = function(deg, cx, cy) {
            var o = this,
                bbox;
            if (o.removed) {
                return o;
            }
            updateFollowers(o, 'rotate', deg, cx, cy);
            deg = Str(deg).split(separator);
            if (deg.length - 1) {
                cx = toFloat(deg[1]);
                cy = toFloat(deg[2]);
            }
            deg = toFloat(deg[0]);
            (cy == null) && (cx = cy);
            if (cx == null || cy == null) {
                bbox = o.getBBox(1);
                cx = bbox.x + bbox.width / 2;
                cy = bbox.y + bbox.height / 2;
            }
            o.transform(o._.transform.concat([["r", deg, cx, cy]]));
            return o;
        };

        elproto.scale = function(sx, sy, cx, cy) {
            var o = this,
                bbox;
            if (o.removed) {
                return o;
            }
            updateFollowers(o, 'scale', sx, sy, cx, cy);
            sx = Str(sx).split(separator);
            if (sx.length - 1) {
                sy = toFloat(sx[1]);
                cx = toFloat(sx[2]);
                cy = toFloat(sx[3]);
            }
            sx = toFloat(sx[0]);
            (sy == null) && (sy = sx);
            (cy == null) && (cx = cy);
            if (cx == null || cy == null) {
                bbox = o.getBBox(1);
            }
            cx = cx == null ? bbox.x + bbox.width / 2 : cx;
            cy = cy == null ? bbox.y + bbox.height / 2 : cy;
            o.transform(o._.transform.concat([["s", sx, sy, cx, cy]]));
            return o;
        };

        elproto.translate = function(dx, dy) {
            var o = this;
            if (o.removed) {
                return o;
            }
            updateFollowers(o, 'translate', dx, dy);
            dx = Str(dx).split(separator);
            if (dx.length - 1) {
                dy = toFloat(dx[1]);
            }
            dx = toFloat(dx[0]) || 0;
            dy = +dy || 0;
            o.transform(o._.transform.concat([["t", dx, dy]]));
            return o;
        };

        elproto.transform = function(tstr) {
            var o = this,
                _ = o._,
                sw;

            if (tstr == null) {
                return _.transform;
            }
            R._extractTransform(o, tstr);

            o.clip && !_.clipispath && $(o.clip, {
                transform: o.matrix.invert()
            });
            o.pattern && updatePosition(o);
            o.node && $(o.node, {
                transform: o.matrix
            });

            if (_.sx != 1 || _.sy != 1) {
                sw = o.attrs["stroke-width"];
                sw && o.attr({
                    "stroke-width": sw
                });
            }

            return o;
        };

        elproto.hide = function() {
            var o = this;
            updateFollowers(o, 'hide');
            !o.removed && o.paper.safari(o.node.style.display = "none");
            return o;
        };

        elproto.show = function() {
            var o = this;
            updateFollowers(o, 'show');
            !o.removed && o.paper.safari(o.node.style.display = E);
            return o;
        };

        elproto.remove = function() {
            if (this.removed || !this.parent.canvas) {
                return;
            }

            var o = this,
                node = R._engine.getNode(o),
                paper = o.paper,
                defs = paper.defs,
                i;

            paper.__set__ && paper.__set__.exclude(o);
            eve.unbind("raphael.*.*." + o.id);

            if (o.gradient && defs) {
                updateGradientReference(o);
            }
            while (i = o.followers.pop()) {
                i.el.remove();
            }
            while (i = o.bottom) {
                i.remove();
            }

            if (o._drag) {
                o.undrag();
            }

            if (o.events)  {
                while (i = o.events.pop()) {
                    i.unbind();
                }
            }

            o.parent.canvas.contains(node) && o.parent.canvas.removeChild(node);
            o.removeData();
            delete paper._elementsById[o.id]; // remove from lookup hash
            R._tear(o, o.parent);

            for (i in o) {
                o[i] = typeof o[i] === "function" ? R._removedFactory(i) : null;
            }

            o.removed = true;
        };
        /*
        * Recursively shows the element and stores the visibilties of its parents
        * in a tree structure for future restoration.
        * @param el - Element which is to shown recursively
        * @return Function - Function to restore the old visibility state.
        */
        function showRecursively(el) {
            var origAttrTree = {},
                currentEl = el,
                currentNode = origAttrTree,
                fn = function () {
                    var localEl = el,
                        localNode = origAttrTree;
                    while (localEl) {
                        if (localNode._doHide) {
                            localEl.hide();
                        }
                        localEl = localEl.parent;
                        localNode = localNode.parent;
                    }
                };
            while (currentEl) {
                if (currentEl.node && currentEl.node.style && currentEl.node.style.display === "none") {
                    currentEl.show();
                    currentNode._doHide = true;
                }
                currentEl = currentEl.parent;
                currentNode.parent = {};
                currentNode = currentNode.parent;
            }
            return fn;
        };

        elproto._getBBox = function() {
            var fn,
                o = this,
                node = o.node,
                bbox = {},
                a = o.attrs,
                align,
                hide,
                isText = (o.type === textStr);
            if (isIE && isText) {
                fn = showRecursively(o);
            }
            else {
                if (node.style.display === "none") {
                    o.show();
                    hide = true;
                }
            }

            try {
                bbox = node.getBBox();
                if (isText) {
                    // If bbox does not have x / y, which is possible in certain
                    // environments, we mathematically calculate these values by
                    // using x, y (adjusted using the values of text-anchor, and
                    // vertical-align attributes), of the element along with the
                    // width and height provided by the getBBox().
                    if (bbox.x === undefined) {
                        bbox.isCalculated = true;
                        align = a['text-anchor'];
                        bbox.x = (a.x || 0) - (bbox.width * ((align === "start") ?
                            0 : (align === middleStr) ? 0.5 : 1));
                    }

                    if (bbox.y === undefined) {
                        bbox.isCalculated = true;
                        align = a[vAignStr];
                        bbox.y = (a.y || 0) - (bbox.height * ((align === "bottom") ?
                            1 : (align === middleStr) ? 0.5 : 0));
                    }
                }

            } catch (e) {
            // Firefox 3.0.x plays badly here
            } finally {
                bbox = bbox || {};
            }
            isIE && isText ? fn && fn() : hide && o.hide();
            return bbox;
        };

        elproto.attr = function(name, value) {
            if (this.removed) {
                return this;
            }
            var todel = {},
                key,
                finalParam = {},
                i,
                ii,
                params,
                subkey,
                par,
                follower;
            // get all, return all applied attributes
            if (name == null) {
                var res = {};
                for (key in this.attrs)
                    if (this.attrs[has](key)) {
                        res[key] = this.attrs[key];
                    }
                res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
                res.transform = this._.transform;
                res.visibility = this.node.style.display === "none" ? "hidden" : "visible";
                return res;
            } else {
                if (value == null) {
                    if (R.is(name, "object")) { // Provided as an object
                        params = name;
                    } else if(R.is(name, typeStringSTR)) { // get one, return the value of the given attribute
                        if (name == "fill" && this.attrs.fill == "none" && this.attrs.gradient) {
                            return this.attrs.gradient;
                        }
                        if (name == "transform") {
                            return this._.transform;
                        }
                        if (name == "visibility") {
                            return this.node.style.display === "none" ? "hidden" : "visible";
                        }
                    
                        if (name in this.attrs) {
                            return this.attrs[name];
                        } else if (R.is(this.ca[name], "function")) {
                            return this.ca[name].def;
                        }
                        return R._availableAttrs[name];
                    }
                } else { // key value provided seperately
                    params = {};
                    params[name] = value;
                }
                
                if (!R.stopPartialEventPropagation) {
                    for (key in params) {
                        eve("raphael.attr." + key + "." + this.id, this, params[key], key);
                    }
                }
    
                // For each param
                for (key in params) {
                    // check if that is a Custom attribute or not
                    if (this.ca[key] && params[has](key) && R.is(this.ca[key], "function") && !this.ca['_invoked' + key]) {
    
                        this.ca['_invoked'+key] = true; // prevent recursion
                        par = this.ca[key].apply(this, [].concat(params[key]));
                        delete this.ca['_invoked'+key];
    
                        // If the custom attribute create another set of attribute to be updated
                        // Then add them in the attribute list
                        for (subkey in par) {
                            if (par[has](subkey)) {
                                finalParam[subkey] = par[subkey];
                            }
                        }
                        // Add the attribute in attrs
                        this.attrs[key] = params[key];
                    } else {
                        finalParam[key] = params[key];
                    }
                }
    
                setFillAndStroke(this, finalParam);
                
                for (i = 0, ii = this.followers.length; i < ii; i++) {
                    follower = this.followers[i];
                    (follower.cb && !follower.cb.call(follower.el, finalParam, this)) ||
                        follower.el.attr(finalParam);
                }
    
                return this;
            }
        };

        elproto.blur = function(size) {
            // Experimental. No Safari support. Use it on your own risk.
            var t = this;
            if (+size !== 0) {
                var fltr = $("filter"),
                blur = $("feGaussianBlur");
                t.attrs.blur = size;
                fltr.id = R.getElementID(R.createUUID());
                $(blur, {
                    stdDeviation: +size || 1.5
                });
                fltr.appendChild(blur);
                t.paper.defs.appendChild(fltr);
                t._blur = fltr;
                $(t.node, {
                    filter: "url('" + R._url + "#" + fltr.id + "')"
                });
            } else {
                if (t._blur) {
                    t._blur.parentNode.removeChild(t._blur);
                    delete t._blur;
                    delete t.attrs.blur;
                }
                t.node.removeAttribute("filter");
            }
        };

        /*\
        * Element.on
        [ method ]
        **
        * Bind handler function for a particular event to Element
        * @param eventType - Type of event
        * @param handler - Function to be called on the firing of the event
        \*/
        elproto.on = function(eventType, handler) {
            var elem = this,
            node,
            fn,
            oldEventType;
            if (this.removed) {
                return this;
            }

            if (eventType === 'dragstart') {
                this.drag(null, handler);
                return this;
            } else if (eventType === 'dragmove') {
                this.drag(handler);
                return this;
            } else if (eventType === 'dragend') {
                this.drag(null, null, handler);
                return this;
            }

            fn = handler;
            oldEventType = eventType;
            if (R.supportsTouch) {
                eventType = R._touchMap[eventType] ||
                    (eventType === 'click' && 'touchstart') || eventType;
                if (eventType !== oldEventType) {
                    // store the new listeners for removeEventListener
                    if (!elem._tempTouchListeners) {
                        elem._tempTouchListeners = {};
                    }
                    if (!elem._tempTouchListeners[oldEventType]) {
                        elem._tempTouchListeners[oldEventType] = [];
                    }
                    fn = function(e) {
                        e.preventDefault();
                        handler(e);
                    };
                    elem._tempTouchListeners[oldEventType].push({
                        oldFn: handler,
                        newFn: fn,
                        newEvt: eventType
                    })
                }
            }
            if (this._ && this._.RefImg) {
                node = this._.RefImg;
            } else {
                node = this.node;
            }
            if (node.addEventListener) {
                node.addEventListener(eventType, fn);
            }
            else {
                node['on'+ eventType] = fn;
            }
            return this;
        };

        /*\
        * Element.off
        [ method ]
        **
        * Remove handler function bind to an event of element
        * @param eventType - Type of event
        * @param handler - Function to be removed from event
        \*/
        elproto.off = function(eventType, handler) {
            var elem = this,
            fn,
            i,
            l,
            node,
            oldEventType;
            if (this.removed) {
                return this;
            }

            if (eventType === 'dragstart') {
                this.undragstart();
                return this;
            } else if (eventType === 'dragmove') {
                this.undragmove();
                return this;
            } else if (eventType === 'dragend') {
                this.undragend();
                return this;
            }

            fn = handler;
            oldEventType = eventType;

            if (R.supportsTouch && elem._tempTouchListeners && elem._tempTouchListeners[oldEventType]) {
                l = elem._tempTouchListeners[oldEventType].length;
                for (i = 0; i < l && oldEventType === eventType; i += 1) {
                    if (elem._tempTouchListeners[oldEventType][i] &&
                        elem._tempTouchListeners[oldEventType][i].oldFn === fn) {
                        eventType = elem._tempTouchListeners[oldEventType][i].newEvt;
                        fn = elem._tempTouchListeners[oldEventType][i].newFn;
                        elem._tempTouchListeners[oldEventType].splice(i, 1);
                    }
                }
            }
            if (this._ && this._.RefImg) {
                node = this._.RefImg;
            } else {
                node = this.node;
            }
            if (node.removeEventListener) {
                node.removeEventListener(eventType, fn);
            }
            else {
                node['on'+ eventType] = null;
            }
            return this;
        };

        R._engine.path = function(svg, attrs, group) {
            var el = $("path"),
                res = new Element(el, svg, group);

            res.type = "path";
            // Apply the attribute if provided
            attrs && res.attr(attrs);
            return res;
        };

        R._engine.group = function(svg, id, group) {
            var el = $("g"),
                res = new Element(el, svg, group);

            res.type = "group";
            res.canvas = res.node;
            res.top = res.bottom = null;
            res._id = id || E;
            id && el.setAttribute('class', 'raphael-group-' + res.id + '-' + id);
            return res;
        };

        R._engine.circle = function(svg, attrs, group) {
            var el = $("circle"),
                res = new Element(el, svg, group);

            res.type = "circle";
            // Apply the attribute if provided
            attrs && res.attr(attrs);
            return res;
        };
        R._engine.rect = function(svg, attrs, group) {
            var el = $("rect"),
                res = new Element(el, svg, group);

            res.type = "rect";
            attrs.rx = attrs.ry = attrs.r;
            // Apply the attribute if provided
            attrs && res.attr(attrs);
            return res;
        };
        R._engine.ellipse = function(svg, attrs, group) {
            var el = $("ellipse"),
                res = new Element(el, svg, group);

            res.type = "ellipse";
            // Apply the attribute if provided
            attrs && res.attr(attrs);
            return res;
        };
        function LoadRefImage (element, attrs) {
            var src = attrs.src,
                parent = element._.group,
                node = element.node,
                RefImg = element._.RefImg;

            if (!RefImg) {
                RefImg = element._.RefImg = new Image();
            }

            if (attrs.src === undefined) {
                return;
            }
            RefImg.src = src;
            element._.RefImg = RefImg;
        };
        R._engine.image = function(svg, attrs, group) {
            var el = $("image"),
                src = attrs.src,
                res = new Element(el, svg, group, true);

            res._.group = group || svg;
            res.type = "image";
            el.setAttribute("preserveAspectRatio", "none");
            // Apply the attribute if provided
            attrs && res.attr(attrs);
            return res;
        };
        R._engine.text = function(svg, attrs, group, css) {
            var el = $(textStr),
                res = new Element(el, svg, group);
            res.type = textStr;
            // Ideally this code should not be here as .css() is not a function of rapheal.
            css && res.css && res.css(css, undefined, true);
            // Apply the attribute if provided
            attrs && res.attr(attrs);
            return res;
        };

        R._engine.setSize = function(width, height) {
            this.width = width || this.width;
            this.height = height || this.height;
            this.canvas.setAttribute("width", this.width);
            this.canvas.setAttribute("height", this.height);
            if (this._viewBox) {
                this.setViewBox.apply(this, this._viewBox);
            }
            return this;
        };
        R._engine.create = function() {
            var con = R._getContainer.apply(0, arguments),
            container = con && con.container,
            x = con.x,
            y = con.y,
            width = con.width,
            height = con.height,
            paper;
            if (!container) {
                throw new Error("SVG container not found.");
            }
            var cnvs = $("svg"),
            css = "overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);"+
                "-webkit-user-select:none;-moz-user-select:-moz-none;-khtml-user-select:none;"+
                "-ms-user-select:none;user-select:none;-o-user-select:none;cursor:default;",
            css = css + "vertical-align:middle;",
            isFloating;
            x = x || 0;
            y = y || 0;
            width = width || 512;
            height = height || 342;
            $(cnvs, {
                height: height,
                version: 1.1,
                width: width,
                xmlns: svgNSStr
            });
            if (container == 1) {
                cnvs.style.cssText = css + "position:absolute;left:" + x + "px;top:" + y + "px";
                // Store body as the container
                container = R._g.doc.body;
                container.appendChild(cnvs);
                isFloating = 1;
            } else {
                cnvs.style.cssText = css + "position:relative";
                if (container.firstChild) {
                    container.insertBefore(cnvs, container.firstChild);
                } else {
                    container.appendChild(cnvs);
                }
            }
            paper = new R._Paper;
            paper.width = width;
            paper.height = height;
            paper.canvas = cnvs;
            // Store the container for further detachment and attachment
            paper.container = container;

            $(cnvs, {
                id: "raphael-paper-" + paper.id
            });
            paper.clear();
            paper._left = paper._top = 0;
            isFloating && (paper.renderfix = function() {
                });
            paper.renderfix();
            return paper;
        };
        R._engine.setViewBox = function(x, y, w, h, fit) {
            eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
            var size = mmax(w / this.width, h / this.height),
            top = this.top,
            aspectRatio = fit ? "meet" : "xMinYMin",
            vb,
            sw;
            if (x == null) {
                if (this._vbSize) {
                    size = 1;
                }
                delete this._vbSize;
                vb = "0 0 " + this.width + S + this.height;
            } else {
                this._vbSize = size;
                vb = x + S + y + S + w + S + h;
            }
            $(this.canvas, {
                viewBox: vb,
                preserveAspectRatio: aspectRatio
            });
            while (size && top) {
                sw = "stroke-width" in top.attrs ? top.attrs["stroke-width"] : 1;
                top.attr({
                    "stroke-width": sw
                });
                top._.dirty = 1;
                top._.dirtyT = 1;
                top = top.prev;
            }
            this._viewBox = [x, y, w, h, !!fit];
            return this;
        };

        /**
         * Function to remove the paper form the DOM tree
         */
        R.prototype.detachPaper = function () {
            if (this._detached !== false) {
                this.container.removeChild(this.canvas);
                this._detached = true;
            }
        }
        /**
         * Function to append the paper in the DOM tree
         * @note: This might change the order of the child elements.
         */
        R.prototype.attachPaper = function () {
            if (this._detached) {
                this.container.appendChild(this.canvas);
                this._detached = false;
            }
        }

        R.prototype.renderfix = function() {
            var cnvs = this.canvas,
            s = cnvs.style,
            pos;
            try {
                pos = cnvs.getScreenCTM() || cnvs.createSVGMatrix();
            } catch (e) {
                pos = cnvs.createSVGMatrix();
            }
            var left = -pos.e % 1,
            top = - pos.f % 1;
            if (left || top) {
                if (left) {
                    this._left = (this._left + left) % 1;
                    s.left = this._left + "px";
                }
                if (top) {
                    this._top = (this._top + top) % 1;
                    s.top = this._top + "px";
                }
            }
        };

        R.prototype._desc = function (txt) {
            var desc = this.desc;

            if (!desc) {
                this.desc = desc = $("desc");
                this.canvas.appendChild(desc);
            }
            else {
                while (desc.firstChild) {
                    desc.removeChild(desc.firstChild);
                }
            }
            desc.appendChild(R._g.doc.createTextNode(R.is(txt, typeStringSTR) ? txt : ("Created with Red Rapha\xebl " +
                R.version)));
        };

        R.prototype.clear = function() {
            var c;
            eve("raphael.clear", this);

            while (c = this.bottom) {
                c.remove();
            }

            c = this.canvas;
            while (c.firstChild) {
                c.removeChild(c.firstChild);
            }
            this.bottom = this.top = null;
            c.appendChild(this.desc = $("desc"));
            c.appendChild(this.defs = $("defs"));
        };

        R.prototype.remove = function() {
            var i;
            eve("raphael.remove", this);

            while (i = this.bottom) {
                i.remove();
            }

            this.defs && this.defs.parentNode.removeChild(this.defs);
            this.desc && this.desc.parentNode.removeChild(this.desc);
            this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
            for (i in this) {
                this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
            }
            this.removed = true;
        };
        // var setproto = R.st;
        // for (var method in elproto)
        //     if (elproto[has](method) && !setproto[has](method)) {
        //         setproto[method] = (function(methodname) {
        //             return function() {
        //                 var arg = arguments;
        //                 return this.forEach(function(el) {
        //                     el[methodname].apply(el, arg);
        //                 });
        //             };
        //         })(method);
        //     }
    }
}
