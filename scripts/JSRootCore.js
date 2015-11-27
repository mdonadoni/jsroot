/// @file JSRootCore.js
/// Core methods of JavaScript ROOT

/// @namespace JSROOT
/// Holder of all JSROOT functions and classes

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {

      var dir = "scripts", ext = "";
      var scripts = document.getElementsByTagName('script');
      for (var n in scripts) {
         if (scripts[n]['type'] != 'text/javascript') continue;
         var src = scripts[n]['src'];
         if ((src == null) || (src.length == 0)) continue;
         var pos = src.indexOf("scripts/JSRootCore.");
         if (pos>=0) {
            dir = src.substr(0, pos+8);
            if (src.indexOf("scripts/JSRootCore.min.js")==pos) ext = ".min";
            break;
         }
      }

      var paths = {
            'd3'                   : dir+'d3.v3.min',
            'jquery'               : dir+'jquery.min',
            'jquery-ui'            : dir+'jquery-ui.min',
            'touch-punch'          : dir+'touch-punch.min',
            'rawinflate'           : dir+'rawinflate'+ext,
            'MathJax'              : 'https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_SVG&amp;delayStartupUntil=configured',
            'THREE'                : dir+'three.min',
            'THREE_ALL'            : dir+'jquery.mousewheel'+ext,
            'three.extra'          : dir+'three.extra'+ext,
            'JSRootCore'           : dir+'JSRootCore'+ext,
            'JSRootMath'           : dir+'JSRootMath'+ext,
            'JSRootInterface'      : dir+'JSRootInterface'+ext,
            'JSRootIOEvolution'    : dir+'JSRootIOEvolution'+ext,
            'JSRootPainter'        : dir+'JSRootPainter'+ext,
            'JSRootPainter.more'   : dir+'JSRootPainter.more'+ext,
            'JSRootPainter.jquery' : dir+'JSRootPainter.jquery'+ext,
            'JSRoot3DPainter'      : dir+'JSRoot3DPainter'+ext
         };

      // check if modules are already loaded
      for (var module in paths)
        if (requirejs.defined(module))
           delete paths[module];

      // configure all dependencies
      requirejs.config({
       paths: paths,
       shim: {
         'touch-punch': { deps: ['jquery'] },
         'three.extra': { deps: ['THREE'] },
         'THREE_ALL': { deps: ['jquery', 'jquery-ui', 'THREE', 'three.extra'] },
         'MathJax': {
             exports: 'MathJax',
             init: function () {
                MathJax.Hub.Config({ TeX: { extensions: ["color.js"] }});
                MathJax.Hub.Register.StartupHook("SVG Jax Ready",function () {
                   var VARIANT = MathJax.OutputJax.SVG.FONTDATA.VARIANT;
                   VARIANT["normal"].fonts.unshift("MathJax_SansSerif");
                   VARIANT["bold"].fonts.unshift("MathJax_SansSerif-bold");
                   VARIANT["italic"].fonts.unshift("MathJax_SansSerif");
                   VARIANT["-tex-mathit"].fonts.unshift("MathJax_SansSerif");
                });
                MathJax.Hub.Startup.onload();
                return MathJax;
             }
          }
       }
    });

      // AMD. Register as an anonymous module.
      define( factory );
   } else {

      if (typeof JSROOT != 'undefined')
         throw new Error("JSROOT is already defined", "JSRootCore.js");

      JSROOT = {};

      // Browser globals
      factory(JSROOT);
   }
} (function(JSROOT) {

   JSROOT.version = "dev 27/11/2015";

   JSROOT.source_dir = "";
   JSROOT.source_min = false;

   JSROOT.id_counter = 0;

   JSROOT.touches = ('ontouchend' in document); // identify if touch events are supported

   JSROOT.browser = {};

   JSROOT.browser.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
   JSROOT.browser.isFirefox = typeof InstallTrigger !== 'undefined';
   JSROOT.browser.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
   JSROOT.browser.isChrome = !!window.chrome && !JSROOT.browser.isOpera;
   JSROOT.browser.isIE = false || !!document.documentMode;
   JSROOT.browser.isWebKit = JSROOT.browser.isChrome || JSROOT.browser.isSafari;

   JSROOT.function_list = []; // do we really need it here?

   JSROOT.MathJax = 0; // indicate usage of mathjax 0 - off, 1 - on

   JSROOT.BIT = function(n) { return 1 << (n); }

   // TH1 status bits
   JSROOT.TH1StatusBits = {
         kNoStats       : JSROOT.BIT(9),  // don't draw stats box
         kUserContour   : JSROOT.BIT(10), // user specified contour levels
         kCanRebin      : JSROOT.BIT(11), // can rebin axis
         kLogX          : JSROOT.BIT(15), // X-axis in log scale
         kIsZoomed      : JSROOT.BIT(16), // bit set when zooming on Y axis
         kNoTitle       : JSROOT.BIT(17), // don't draw the histogram title
         kIsAverage     : JSROOT.BIT(18)  // Bin contents are average (used by Add)
   };

   JSROOT.EAxisBits = {
         kTickPlus      : JSROOT.BIT(9),
         kTickMinus     : JSROOT.BIT(10),
         kAxisRange     : JSROOT.BIT(11),
         kCenterTitle   : JSROOT.BIT(12),
         kCenterLabels  : JSROOT.BIT(14),
         kRotateTitle   : JSROOT.BIT(15),
         kPalette       : JSROOT.BIT(16),
         kNoExponent    : JSROOT.BIT(17),
         kLabelsHori    : JSROOT.BIT(18),
         kLabelsVert    : JSROOT.BIT(19),
         kLabelsDown    : JSROOT.BIT(20),
         kLabelsUp      : JSROOT.BIT(21),
         kIsInteger     : JSROOT.BIT(22),
         kMoreLogLabels : JSROOT.BIT(23),
         kDecimals      : JSROOT.BIT(11)
   };

   // wrapper for console.log, avoids missing console in IE
   // if divid specified, provide output to the HTML element
   JSROOT.console = function(value, divid) {
      if ((divid!=null) && (typeof divid=='string') && ((typeof document.getElementById(divid))!='undefined'))
         document.getElementById(divid).innerHTML = value;
      else
      if ((typeof console != 'undefined') && (typeof console.log == 'function'))
         console.log(value);
   }

   // This is part of the JSON-R code, found on
   // https://github.com/graniteds/jsonr
   // Only unref part was used, arrays are not accounted as objects
   // Should be used to reintroduce objects references, produced by TBufferJSON
   JSROOT.JSONR_unref = function(value, dy) {
      var c, i, k, ks;
      if (!dy) dy = [];

      switch (typeof value) {
      case 'string':
          if ((value.length > 5) && (value.substr(0, 5) == "$ref:")) {
             c = parseInt(value.substr(5));
             if (!isNaN(c) && (c < dy.length)) {
                value = dy[c];
             }
          }
          break;

      case 'object':
         if (value !== null) {

            if (Object.prototype.toString.apply(value) === '[object Array]') {
               for (i = 0; i < value.length; i++) {
                  value[i] = this.JSONR_unref(value[i], dy);
               }
            } else {

               // account only objects in ref table
               if (dy.indexOf(value) === -1) {
                  dy.push(value);
               }

               // add methods to all objects, where _typename is specified
               if ('_typename' in value) this.addMethods(value);

               ks = Object.keys(value);
               for (i = 0; i < ks.length; i++) {
                  k = ks[i];
                  value[k] = this.JSONR_unref(value[k], dy);
               }
            }
         }
         break;
      }

      return value;
   }

   JSROOT.debug = 0;

   // This should be similar to the jQuery.extend method
   // Just copy (not clone) all fields from source to the target object
   JSROOT.extend = function(tgt, src, map) {
      if (!map) map = { obj:[], clones:[] };

      if (typeof src != 'object') return src;

      if (src == null) return null;

      var i = map.obj.indexOf(src);
      if (i>=0) return map.clones[i];

      // process array
      if (Object.prototype.toString.apply(src) === '[object Array]') {
         if ((tgt==null) || (Object.prototype.toString.apply(tgt) != '[object Array]')) {
            tgt = [];
            map.obj.push(src);
            map.clones.push(tgt);
         }

         for (i = 0; i < src.length; i++)
            tgt.push(JSROOT.extend(null, src[i], map));

         return tgt;
      }

      if ((tgt==null) || (typeof tgt != 'object')) {
         tgt = {};
         map.obj.push(src);
         map.clones.push(tgt);
      }

      for (var k in src)
         tgt[k] = JSROOT.extend(tgt[k], src[k], map);

      return tgt;
   }

   // Instead of jquery use JSROOT.extend function
   JSROOT.clone = function(obj) {
      return JSROOT.extend(null, obj);
   }

   JSROOT.parse = function(arg) {
      if ((arg==null) || (arg=="")) return null;
      var obj = JSON.parse(arg);
      if (obj!=null) obj = this.JSONR_unref(obj);
      return obj;
   }

   JSROOT.GetUrlOption = function(opt, url, dflt) {
      // analyzes document.URL and extracts options after '?' mark
      // following options supported ?opt1&opt2=3
      // In case of opt1 empty string will be returned, in case of opt2 '3'
      // If option not found, null is returned (or provided default value)

      if ((opt==null) || (typeof opt != 'string') || (opt.length==0)) return dflt;

      if (!url) url = document.URL;

      var pos = url.indexOf("?");
      if (pos<0) return dflt;
      url = url.slice(pos+1);

      while (url.length>0) {

         if (url==opt) return "";

         pos = url.indexOf("&");
         if (pos < 0) pos = url.length;

         if (url.indexOf(opt) == 0) {
            if (url.charAt(opt.length)=="&") return "";

            // replace several symbols which are known to make a problem
            if (url.charAt(opt.length)=="=")
               return url.slice(opt.length+1, pos).replace(/%27/g, "'").replace(/%22/g, '"').replace(/%20/g, ' ').replace(/%3C/g, '<').replace(/%3E/g, '>').replace(/%5B/g, '[').replace(/%5D/g, ']');
         }

         url = url.slice(pos+1);
      }
      return dflt;
   }

   JSROOT.ParseAsArray = function(val) {
      // parse string value as array.
      // It could be just simple string:  "value"
      //  or array with or without string quotes:  [element], ['eleme1',elem2]

      var res = [];

      if (typeof val != 'string') return res;

      val = val.trim();
      if (val=="") return res;

      // return as array with single element
      if ((val.length<2) || (val[0]!='[') || (val[val.length-1]!=']')) {
         res.push(val); return res;
      }

      // try to parse ourself
      var arr = val.substr(1, val.length-2).split(","); // remove brackets

      for (var i in arr) {
         var sub = arr[i].trim();
         if ((sub.length>1) && (sub[0]==sub[sub.length-1]) && ((sub[0]=='"') || (sub[0]=="'")))
            sub = sub.substr(1, sub.length-2);
         res.push(sub);
      }
      return res;
   }

   JSROOT.GetUrlOptionAsArray = function(opt, url) {
      // special handling of URL options to produce array
      // if normal option is specified ...?opt=abc, than array with single element will be created
      // one could specify normal JSON array ...?opt=['item1','item2']
      // but also one could skip quotes ...?opt=[item1,item2]
      // one could collect values from several options, specifying
      // options names via semicolon like opt='item;items'

      var res = [];

      while (opt.length>0) {
         var separ = opt.indexOf(";");
         var part = separ>0 ? opt.substr(0, separ) : opt;
         if (separ>0) opt = opt.substr(separ+1); else opt = "";

         var val = this.GetUrlOption(part, url, null);
         res = res.concat(JSROOT.ParseAsArray(val));
      }
      return res;
   }

   JSROOT.findFunction = function(name) {
      var func = window[name];
      if (typeof func == 'function') return func;
      var separ = name.lastIndexOf(".");
      if (separ<0) return null;
      var namespace = name.slice(0, separ);
      name = name.slice(separ+1);
      if (namespace=="JSROOT") func = this[name]; else
      if (namespace=="JSROOT.Painter") { if ('Painter' in this) func = this['Painter'][name]; } else
      if (window[namespace]) func = window[namespace][name];
      return (typeof func == 'function') ? func : null;
   }

   JSROOT.CallBack = function(func, arg1, arg2) {
      // generic method to invoke callback function
      // func either normal function or container like
      // { obj: object_pointer, func: name of method to call }
      // { _this: object pointer, func: function to call }
      // arg1, arg2 are optional arguments of the callback

      if (func == null) return;

      if (typeof func == 'string') func = JSROOT.findFunction(func);

      if (typeof func == 'function') return func(arg1,arg2);

      if (typeof func != 'object') return;

      if (('obj' in func) && ('func' in func) &&
         (typeof func.obj == 'object') && (typeof func.func == 'string') &&
         (typeof func.obj[func.func] == 'function')) return func.obj[func.func](arg1, arg2);

      if (('_this' in func) && ('func' in func) &&
         (typeof func.func == 'function')) return func.func.call(func._this, arg1, arg2);
   }

   JSROOT.NewHttpRequest = function(url, kind, user_call_back) {
      // Create asynchronous XMLHttpRequest object.
      // One should call req.send() to submit request
      // kind of the request can be:
      //  "bin" - abstract binary data (default)
      //  "text" - returns req.responseText
      //  "object" - returns JSROOT.parse(req.responseText)
      //  "xml" - returns res.responseXML
      //  "head" - returns request itself, uses "HEAD" method
      // Result will be returned to the callback functions
      // Request will be set as this pointer in the callback
      // If failed, request returns null

      var xhr = new XMLHttpRequest();

      function callback(res) {
         // we set pointer on request when calling callback
         if (typeof user_call_back == 'function') user_call_back.call(xhr, res);
      }

      var pthis = this;

      if (window.ActiveXObject) {

         xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            if (xhr.status != 200 && xhr.status != 206) {
               // error
               return callback(null);
            }

            if (kind == "xml") return callback(xhr.responseXML);
            if (kind == "text") return callback(xhr.responseText);
            if (kind == "object") return callback(pthis.parse(xhr.responseText));
            if (kind == "head") return callback(xhr);

            var filecontent = new String("");
            var array = new VBArray(xhr.responseBody).toArray();
            for (var i = 0; i < array.length; i++) {
               filecontent = filecontent + String.fromCharCode(array[i]);
            }

            callback(filecontent);
            filecontent = null;
         }

         xhr.open(kind == 'head' ? 'HEAD' : 'GET', url, true);

      } else {

         xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            if (xhr.status != 200 && xhr.status != 206) {
               return callback(null);
            }

            if (kind == "xml") return callback(xhr.responseXML);
            if (kind == "text") return callback(xhr.responseText);
            if (kind == "object") return callback(pthis.parse(xhr.responseText));
            if (kind == "head") return callback(xhr);

            var HasArrayBuffer = ('ArrayBuffer' in window && 'Uint8Array' in window);
            var Buf, filecontent;
            if (HasArrayBuffer && 'mozResponse' in xhr) {
               Buf = xhr.mozResponse;
            } else if (HasArrayBuffer && xhr.mozResponseArrayBuffer) {
               Buf = xhr.mozResponseArrayBuffer;
            } else if ('responseType' in xhr) {
               Buf = xhr.response;
            } else {
               Buf = xhr.responseText;
               HasArrayBuffer = false;
            }

            if (HasArrayBuffer) {
               filecontent = new String("");
               var bLen = Buf.byteLength;
               var u8Arr = new Uint8Array(Buf, 0, bLen);
               for (var i = 0; i < u8Arr.length; i++) {
                  filecontent = filecontent + String.fromCharCode(u8Arr[i]);
               }
               delete u8Arr;
            } else {
               filecontent = Buf;
            }

            callback(filecontent);

            filecontent = null;
         }

         xhr.open(kind == 'head' ? 'HEAD' : 'GET', url, true);

         if (kind == "bin") {
            var HasArrayBuffer = ('ArrayBuffer' in window && 'Uint8Array' in window);
            if (HasArrayBuffer && 'mozResponseType' in xhr) {
               xhr.mozResponseType = 'arraybuffer';
            } else if (HasArrayBuffer && 'responseType' in xhr) {
               xhr.responseType = 'arraybuffer';
            } else {
               //XHR binary charset opt by Marcus Granado 2006 [http://mgran.blogspot.com]
               xhr.overrideMimeType("text/plain; charset=x-user-defined");
            }
         }
      }
      return xhr;
   }

   JSROOT.loadScript = function(urllist, callback, debugout) {
      // dynamic script loader using callback
      // (as loading scripts may be asynchronous)
      // one could specify list of scripts or style files, separated by semicolon ';'
      // one can prepend file name with '$$$' - than file will be loaded from JSROOT location
      // This location can be set by JSROOT.source_dir or it will be detected automatically
      // by the position of JSRootCore.js file, which must be loaded by normal methods:
      // <script type="text/javascript" src="scripts/JSRootCore.js"></script>

      function completeLoad() {
         if ((urllist!=null) && (urllist.length>0))
            return JSROOT.loadScript(urllist, callback, debugout);

         if (debugout)
            document.getElementById(debugout).innerHTML = "";

         JSROOT.CallBack(callback);
      }

      if ((urllist==null) || (urllist.length==0))
         return completeLoad();

      var filename = urllist;
      var separ = filename.indexOf(";");
      if (separ>0) {
         filename = filename.substr(0, separ);
         urllist = urllist.slice(separ+1);
      } else {
         urllist = "";
      }

      var isrootjs = false;
      if (filename.indexOf("$$$")==0) {
         isrootjs = true;
         filename = filename.slice(3);
         if ((filename.indexOf("style/")==0) && JSROOT.source_min &&
             (filename.lastIndexOf('.css')==filename.length-3) &&
             (filename.indexOf('.min.css')<0))
            filename = filename.slice(0, filename.length-4) + '.min.css';
      }
      var isstyle = filename.indexOf('.css') > 0;

      if (isstyle) {
         var styles = document.getElementsByTagName('link');
         for (var n in styles) {
            if ((styles[n]['type'] != 'text/css') || (styles[n]['rel'] != 'stylesheet')) continue;

            var href = styles[n]['href'];
            if ((href == null) || (href.length == 0)) continue;

            if (href.indexOf(filename)>=0) return completeLoad();
         }

      } else {
         var scripts = document.getElementsByTagName('script');

         for (var n in scripts) {
            if (scripts[n]['type'] != 'text/javascript') continue;

            var src = scripts[n]['src'];
            if ((src == null) || (src.length == 0)) continue;

            if ((src.indexOf(filename)>=0) && (src.indexOf("load=")<0)) {
               // avoid wrong decision when script name is specified as more argument
               return completeLoad();
            }
         }
      }

      if (isrootjs && (JSROOT.source_dir!=null)) filename = JSROOT.source_dir + filename;

      var element = null;

      JSROOT.console("loading " + filename + " ...", debugout);

      if (isstyle) {
         element = document.createElement("link");
         element.setAttribute("rel", "stylesheet");
         element.setAttribute("type", "text/css");
         element.setAttribute("href", filename);
      } else {
         element = document.createElement("script");
         element.setAttribute('type', "text/javascript");
         element.setAttribute('src', filename);
      }

      if (element.readyState) { // Internet Explorer specific
         element.onreadystatechange = function() {
            if (element.readyState == "loaded" || element.readyState == "complete") {
               element.onreadystatechange = null;
               completeLoad();
            }
         }
      } else { // Other browsers
         element.onload = function() {
            element.onload = null;
            completeLoad();
         }
      }

      document.getElementsByTagName("head")[0].appendChild(element);
   }

   JSROOT.AssertPrerequisites = function(kind, callback, debugout) {
      // one could specify kind of requirements
      // 'io' for I/O functionality (default)
      // '2d' for 2d graphic
      // 'jq' jQuery and jQuery-ui
      // 'jq2d' jQuery-dependend part of 2d graphic
      // '3d' for 3d graphic
      // 'simple' for basic user interface
      // 'load:' list of user-specific scripts at the end of kind string

      var jsroot = this;

      if ((typeof kind != 'string') || (kind == ''))
         return jsroot.CallBack(callback);

      if (kind=='shift') {
         var req = jsroot.doing_assert.shift();
         kind = req._kind;
         callback = req._callback;
         debugout = req._debug;
      } else
      if (jsroot.doing_assert != null) {
         // if function already called, store request
         return jsroot.doing_assert.push({_kind:kind, _callback:callback, _debug: debugout});
      } else {
         jsroot.doing_assert = [];
      }

      if (kind.charAt(kind.length-1)!=";") kind+=";";

      var ext = jsroot.source_min ? ".min" : "";

      var need_jquery = false;

      // file names should be separated with ';'
      var mainfiles = "", extrafiles = ""; // scripts for direct loadin
      var modules = [];  // modules used for require.js

      if (kind.indexOf('io;')>=0) {
         mainfiles += "$$$scripts/rawinflate" + ext + ".js;" +
                      "$$$scripts/JSRootIOEvolution" + ext + ".js;";
         modules.push('JSRootIOEvolution');
      }

      if (kind.indexOf('2d;')>=0) {
         if (!('_test_d3_' in jsroot)) {
            if (typeof d3 != 'undefined') {
               jsroot.console('Reuse existing d3.js ' + d3.version + ", required 3.4.10", debugout);
               jsroot['_test_d3_'] = 1;
            } else {
               mainfiles += '$$$scripts/d3.v3.min.js;';
               jsroot['_test_d3_'] = 2;
            }
         }
         modules.push('JSRootPainter');
         mainfiles += '$$$scripts/JSRootPainter' + ext + ".js;";
         extrafiles += '$$$style/JSRootPainter' + ext + '.css;';
      }

      if (kind.indexOf('jq;')>=0) need_jquery = true;

      if (kind.indexOf('math;')>=0)  {
         mainfiles += '$$$scripts/JSRootMath' + ext + ".js;";
         modules.push('JSRootMath');
      }

      if (kind.indexOf('more2d;')>=0) {
         mainfiles += '$$$scripts/JSRootPainter.more' + ext + ".js;";
         modules.push('JSRootPainter.more');
      }

      if (kind.indexOf('jq2d;')>=0) {
         mainfiles += '$$$scripts/JSRootPainter.jquery' + ext + ".js;";
         modules.push('JSRootPainter.jquery');
         need_jquery = true;
      }

      if (kind.indexOf("3d;")>=0) {
         need_jquery = true;
         mainfiles += "$$$scripts/jquery.mousewheel" + ext + ".js;" +
                      "$$$scripts/three.min.js;" +
                      "$$$scripts/three.extra" + ext + ".js;" +
                      "$$$scripts/JSRoot3DPainter" + ext + ".js;";
         modules.push('JSRoot3DPainter');
      }

      if (kind.indexOf("mathjax;")>=0) {
         if (typeof MathJax == 'undefined') {
            mainfiles += "https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_SVG," +
                          jsroot.source_dir + "scripts/mathjax_config.js;";
         }
         if (JSROOT.MathJax == 0) JSROOT.MathJax = 1;
         modules.push('MathJax');
      }

      if (kind.indexOf("simple;")>=0) {
         need_jquery = true;
         mainfiles += '$$$scripts/JSRootInterface' + ext + ".js;";
         extrafiles += '$$$style/JSRootInterface' + ext + '.css;';
         modules.push('JSRootInterface');
      }

      if (need_jquery && (JSROOT.load_jquery==null)) {
         var has_jq = (typeof jQuery != 'undefined'), lst_jq = "";

         if (has_jq)
            jsroot.console('Reuse existing jQuery ' + jQuery.fn.jquery + ", required 2.1.1", debugout);
         else
            lst_jq += "$$$scripts/jquery.min.js;";
         if (has_jq && typeof $.ui != 'undefined')
            jsroot.console('Reuse existing jQuery-ui ' + $.ui.version + ", required 1.11.0", debugout);
         else {
            lst_jq += '$$$scripts/jquery-ui.min.js;';
            extrafiles += '$$$style/jquery-ui' + ext + '.css;';
         }

         if (JSROOT.touches) {
            lst_jq += '$$$scripts/touch-punch.min.js;';
            modules.push('touch-punch');
         }

         modules.splice(0,0, 'jquery', 'jquery-ui');
         mainfiles = lst_jq + mainfiles;

         jsroot.load_jquery = true;
      }

      var pos = kind.indexOf("user:");
      if (pos<0) pos = kind.indexOf("load:");
      if (pos>=0) extrafiles += kind.slice(pos+5);

      var load_callback = function() {
         if (jsroot.doing_assert && jsroot.doing_assert.length==0) jsroot.doing_assert = null;
         jsroot.CallBack(callback);
         if (jsroot.doing_assert && (jsroot.doing_assert.length>0)) {
            jsroot.AssertPrerequisites('shift');
         }
      }

      if ((typeof define === "function") && define.amd && (modules.length>0)) {
         jsroot.console("loading " + modules + " with require.js", debugout);
         require(modules, function() {
            jsroot.loadScript(extrafiles, load_callback, debugout);
         });
      } else {
         jsroot.loadScript(mainfiles + extrafiles, load_callback, debugout);
      }
   }

   // function can be used to open ROOT file, I/O functionality will be loaded when missing
   JSROOT.OpenFile = function(filename, callback) {
      JSROOT.AssertPrerequisites("io", function() {
         new JSROOT.TFile(filename, callback);
      });
   }

   // function can be used to draw supported ROOT classes,
   // required functionality will be loaded automatically
   // if painter pointer required, one should load '2d' functionlity itself
   JSROOT.draw = function(divid, obj, opt) {
      JSROOT.AssertPrerequisites("2d", function() {
         JSROOT.draw(divid, obj, opt);
      });
   }

   JSROOT.BuildSimpleGUI = function(user_scripts, andThen) {

      var jsroot = this;

      if (typeof user_scripts == 'function') {
         andThen = user_scripts;
         user_scripts = null;
      }

      var debugout = null;
      var nobrowser = jsroot.GetUrlOption('nobrowser')!=null;
      var requirements = "io;2d;";

      if (document.getElementById('simpleGUI')) {
         debugout = 'simpleGUI';
         if ((jsroot.GetUrlOption('json')!=null) &&
             (jsroot.GetUrlOption('file')==null) &&
             (jsroot.GetUrlOption('files')==null)) requirements = "2d;";
      } else
      if (document.getElementById('onlineGUI')) { debugout = 'onlineGUI'; requirements = "2d;"; } else
      if (document.getElementById('drawGUI')) { debugout = 'drawGUI'; requirements = "2d;"; nobrowser = true; }

      if (user_scripts == 'check_existing_elements') {
         user_scripts = null;
         if (debugout == null) return;
      }

      if (!nobrowser) requirements += 'jq2d;simple;';

      if (user_scripts == null) user_scripts = jsroot.GetUrlOption("autoload");
      if (user_scripts == null) user_scripts = jsroot.GetUrlOption("load");

      if (user_scripts != null)
         requirements += "load:" + user_scripts + ";";

      this.AssertPrerequisites(requirements, function() {
         var func = jsroot.findFunction(nobrowser ? 'JSROOT.BuildNobrowserGUI' : 'BuildSimpleGUI');
         jsroot.CallBack(func);
         jsroot.CallBack(andThen);
      }, debugout);
   }

   JSROOT.addFormula = function(obj) {
      var formula = obj['fTitle'];
      formula = formula.replace('abs(', 'Math.abs(');
      formula = formula.replace('sin(', 'Math.sin(');
      formula = formula.replace('cos(', 'Math.cos(');
      formula = formula.replace('exp(', 'Math.exp(');
      var code = obj['fName'] + " = function(x) { return " + formula + " };";
      eval(code);
      var sig = obj['fName']+'(x)';

      var pos = JSROOT.function_list.indexOf(sig);
      if (pos >= 0) {
         JSROOT.function_list.splice(pos, 1);
      }
      JSROOT.function_list.push(sig);
   }

   JSROOT.Create = function(typename, target) {
      var obj = target;
      if (obj == null)
         obj = { _typename: typename };

      if (typename == 'TObject')
         JSROOT.extend(obj, { fUniqueID: 0, fBits: 0x3000008 });
      else
      if (typename == 'TNamed')
         JSROOT.extend(obj, { fUniqueID: 0, fBits: 0x3000008, fName: "", fTitle: "" });
      else
      if ((typename == 'TList') || (typename == 'THashList'))
         JSROOT.extend(obj, { name: typename, arr : [], opt : [] });
      else
      if (typename == 'TAttAxis') {
         JSROOT.extend(obj, { fNdivisions: 510, fAxisColor: 1,
            fLabelColor: 1, fLabelFont: 42, fLabelOffset: 0.005, fLabelSize: 0.035, fTickLength: 0.03,
            fTitleOffset: 1, fTitleSize: 0.035, fTitleColor: 1, fTitleFont : 42 });
      } else
      if (typename == 'TAxis') {
         JSROOT.Create("TNamed", obj);
         JSROOT.Create("TAttAxis", obj);
         JSROOT.extend(obj, { fNbins: 0, fXmin: 0, fXmax: 0, fXbins : [], fFirst: 0, fLast: 0,
                              fBits2: 0, fTimeDisplay: false, fTimeFormat: "", fLabels: null });
      } else
      if (typename == 'TAttLine') {
         JSROOT.extend(obj, { fLineColor: 1, fLineStyle : 1, fLineWidth : 1 });
      } else
      if (typename == 'TAttFill') {
         JSROOT.extend(obj, { fFillColor: 0, fFillStyle : 0 } );
      } else
      if (typename == 'TAttMarker') {
         JSROOT.extend(obj, { fMarkerColor: 1, fMarkerStyle : 1, fMarkerSize : 1. });
      } else
      if (typename == 'TBox') {
         JSROOT.Create("TObject", obj);
         JSROOT.Create("TAttLine", obj);
         JSROOT.Create("TAttFill", obj);
         JSROOT.extend(obj, { fX1: 0, fY1: 0, fX2: 1, fY2: 1 });
      } else
      if (typename == 'TPave') {
         JSROOT.Create("TBox", obj);
         JSROOT.extend(obj, { fX1NDC : 0., fY1NDC: 0, fX2NDC: 1, fY2NDC: 1,
                              fBorderSize: 0, fInit: 1, fShadowColor: 1,
                              fCornerRadius: 0, fOption: "blNDC", fName: "title" });
      } else
      if (typename == 'TAttText') {
         JSROOT.extend(obj, { fTextAngle: 0, fTextSize: 0, fTextAlign: 22, fTextColor: 1, fTextFont: 42});
      } else
      if (typename == 'TPaveText') {
         JSROOT.Create("TPave", obj);
         JSROOT.Create("TAttText", obj);
         JSROOT.extend(obj, { fLabel: "", fLongest: 27, fMargin: 0.05, fLines: JSROOT.Create("TList") });
      } else
      if (typename == 'TPaveStats') {
         JSROOT.Create("TPaveText", obj);
         JSROOT.extend(obj, { fOptFit: 0, fOptStat: 0, fFitFormat: "", fStatFormat: "", fParent: null });
      } else
      if (typename == 'TObjString') {
         JSROOT.Create("TObject", obj);
         JSROOT.extend(obj, { fString: ""});
      } else
      if (typename == 'TH1') {
         JSROOT.Create("TNamed", obj);
         JSROOT.Create("TAttLine", obj);
         JSROOT.Create("TAttFill", obj);
         JSROOT.Create("TAttMarker", obj);

         JSROOT.extend(obj, {
            fNcells : 0,
            fXaxis: JSROOT.Create("TAxis"),
            fYaxis: JSROOT.Create("TAxis"),
            fZaxis: JSROOT.Create("TAxis"),
            fBarOffset : 0, fBarWidth : 1000, fEntries : 0.,
            fTsumw : 0., fTsumw2 : 0., fTsumwx : 0., fTsumwx2 : 0.,
            fMaximum : -1111., fMinimum : -1111, fNormFactor : 0., fContour : [],
            fSumw2 : [], fOption : "",
            fFunctions : JSROOT.Create("TList"),
            fBufferSize : 0, fBuffer : [], fBinStatErrOpt : 0 });
      } else
      if (typename == 'TH1I' || typename == 'TH1F' || typename == 'TH1D' || typename == 'TH1S' || typename == 'TH1C') {
         JSROOT.Create("TH1", obj);
         JSROOT.extend(obj, { fArray: [] });
      } else
      if (typename == 'TH2') {
         JSROOT.Create("TH1", obj);
         JSROOT.extend(obj, { fScalefactor: 1., fTsumwy: 0.,  fTsumwy2: 0, fTsumwxy : 0});
      } else
      if (typename == 'TH2I' || typename == 'TH2F' || typename == 'TH2D' || typename == 'TH2S' || typename == 'TH2C') {
         JSROOT.Create("TH2", obj);
         JSROOT.extend(obj, { fArray: [] });
      } else
      if (typename == 'TGraph') {
         JSROOT.Create("TNamed", obj);
         JSROOT.Create("TAttLine", obj);
         JSROOT.Create("TAttFill", obj);
         JSROOT.Create("TAttMarker", obj);
         JSROOT.extend(obj, { fFunctions: JSROOT.Create("TList"), fHistogram: JSROOT.CreateTH1(),
                              fMaxSize: 0, fMaximum:0, fMinimum:0, fNpoints: 0, fX: [], fY: [] });
      }

      JSROOT.addMethods(obj, typename);
      return obj;
   }

   // obsolete functions, can be removed by next JSROOT release
   JSROOT.CreateTList = function() { return JSROOT.Create("TList"); }
   JSROOT.CreateTAxis = function() { return JSROOT.Create("TAxis"); }

   JSROOT.CreateTH1 = function(nbinsx) {
      var histo = JSROOT.Create("TH1I");
      JSROOT.extend(histo, { fName: "dummy_histo_" + this.id_counter++, fTitle: "dummytitle" });

      if (nbinsx!=null) {
         histo['fNcells'] = nbinsx+2;
         for (var i=0;i<histo['fNcells'];i++) histo['fArray'].push(0);
         JSROOT.extend(histo['fXaxis'], { fNbins: nbinsx, fXmin: 0,  fXmax: nbinsx });
      }
      return histo;
   }

   JSROOT.CreateTH2 = function(nbinsx, nbinsy) {
      var histo = JSROOT.Create("TH2I");
      JSROOT.extend(histo, { fName: "dummy_histo_" + this.id_counter++, fTitle: "dummytitle" });

      if ((nbinsx!=null) && (nbinsy!=null)) {
         histo['fNcells'] = (nbinsx+2) * (nbinsy+2);
         for (var i=0;i<histo['fNcells'];i++) histo['fArray'].push(0);
         JSROOT.extend(histo['fXaxis'], { fNbins: nbinsx, fXmin: 0, fXmax: nbinsx });
         JSROOT.extend(histo['fYaxis'], { fNbins: nbinsy, fXmin: 0, fXmax: nbinsy });
      }
      return histo;
   }

   JSROOT.CreateTGraph = function(npoints) {
      var graph = JSROOT.Create("TGraph");
      JSROOT.extend(graph, { fBits: 0x3000408, fName: "dummy_graph_" + this.id_counter++, fTitle: "dummytitle" });

      if (npoints>0) {
         graph['fMaxSize'] = graph['fNpoints'] = npoints;
         for (var i=0;i<npoints;i++) {
            graph['fX'].push(i/npoints);
            graph['fY'].push(i/npoints);
         }

         graph['fHistogram'] = JSROOT.CreateTH1(npoints);
         graph['fHistogram'].fTitle = graph.fTitle;

         graph['fHistogram']['fXaxis']['fXmin'] = 0;
         graph['fHistogram']['fXaxis']['fXmax'] = 1;
         graph['fHistogram']['fYaxis']['fXmin'] = 0;
         graph['fHistogram']['fYaxis']['fXmax'] = 1;
      }

      return graph;
   }

   JSROOT.addMethods = function(obj, obj_typename) {
      // check object type and add methods if needed
      if (('fBits' in obj) && !('TestBit' in obj)) {
         obj['TestBit'] = function (f) { return (this['fBits'] & f) != 0; };
         obj['InvertBit'] = function (f) { this['fBits'] = this['fBits'] ^ (f & 0xffffff); };
      }

      if (!obj_typename) {
         if (!('_typename' in obj)) return;
         obj_typename = obj['_typename'];
      }

      var EBinErrorOpt = {
          kNormal : 0,    // errors with Normal (Wald) approximation: errorUp=errorLow= sqrt(N)
          kPoisson : 1,   // errors from Poisson interval at 68.3% (1 sigma)
          kPoisson2 : 2   // errors from Poisson interval at 95% CL (~ 2 sigma)
       };

      var EErrorType = {
          kERRORMEAN : 0,
          kERRORSPREAD : 1,
          kERRORSPREADI : 2,
          kERRORSPREADG : 3
       };

      if ((obj_typename == 'TList') || (obj_typename == 'THashList')) {
         obj['Clear'] = function() {
            this['arr'] = new Array;
            this['opt'] = new Array;
         }
         obj['Add'] = function(obj,opt) {
            this['arr'].push(obj);
            this['opt'].push((opt && typeof opt=='string') ? opt : "");
         }
         obj['AddFirst'] = function(obj,opt) {
            this['arr'].unshift(obj);
            this['opt'].unshift((opt && typeof opt=='string') ? opt : "");
         }
         obj['RemoveAt'] = function(indx) {
            this['arr'].splice(indx, 1);
            this['opt'].splice(indx, 1);
         }
      }

      if ((obj_typename == "TPaveText") || (obj_typename == "TPaveStats")) {
         obj['AddText'] = function(txt) {
            this['fLines'].Add({'fTitle' : txt, "fTextColor" : 1 });
         }
         obj['Clear'] = function() {
            this['fLines'].Clear();
         }
      }

      if ((obj_typename.indexOf("TFormula") != -1) || (obj_typename.indexOf("TF1") == 0)) {
         obj['evalPar'] = function(x) {
            var _func = this['fTitle'];
            _func = _func.replace('TMath::Exp(', 'Math.exp(');
            _func = _func.replace('TMath::Abs(', 'Math.abs(');
            _func = _func.replace('gaus(', 'JSROOT.Math.gaus(this, ' + x + ', ');
            _func = _func.replace('gausn(', 'JSROOT.Math.gausn(this, ' + x + ', ');
            _func = _func.replace('expo(', 'JSROOT.Math.expo(this, ' + x + ', ');
            _func = _func.replace('landau(', 'JSROOT.Math.landau(this, ' + x + ', ');
            _func = _func.replace('landaun(', 'JSROOT.Math.landaun(this, ' + x + ', ');
            _func = _func.replace('pi', 'Math.PI');
            for (var i=0;i<this['fNpar'];++i) {
               while(_func.indexOf('['+i+']') != -1)
                  _func = _func.replace('['+i+']', this['fParams'][i]);
            }
            for (var i=0;i<JSROOT.function_list.length;++i) {
               var f = JSROOT.function_list[i].substring(0, JSROOT.function_list[i].indexOf('('));
               if (_func.indexOf(f) != -1) {
                  var fa = JSROOT.function_list[i].replace('(x)', '(' + x + ')');
                  _func = _func.replace(f, fa);
               }
            }
            // use regex to replace ONLY the x variable (i.e. not 'x' in Math.exp...)
            _func = _func.replace(/\b(x)\b/gi, x);
            _func = _func.replace(/\b(sin)\b/gi, 'Math.sin');
            _func = _func.replace(/\b(cos)\b/gi, 'Math.cos');
            _func = _func.replace(/\b(tan)\b/gi, 'Math.tan');
            _func = _func.replace(/\b(exp)\b/gi, 'Math.exp');
            return eval(_func);
         };
      }

      if (obj_typename=='TF1') {
         obj['GetParName'] = function(n) {
            if (('fFormula' in this) && ('fParams' in this.fFormula)) return this.fFormula.fParams[n].first;
            if ('fNames' in this) return this.fNames[n];
            return "Par"+n;
         }
         obj['GetParValue'] = function(n) {
            if (('fFormula' in this) && ('fClingParameters' in this.fFormula)) return this.fFormula.fClingParameters[n];
            if (('fParams' in this) && (this.fParams!=null))  return this.fParams[n];
            return null;
         }
      }

      if ((obj_typename.indexOf("TGraph") == 0) || (obj_typename == "TCutG")) {
         // check if point inside figure specified by the TGrpah
         obj['IsInside'] = function(xp,yp) {
            var j = this['fNpoints'] - 1, x = this['fX'], y = this['fY'];
            var oddNodes = false;

            for (var i=0; i<this['fNpoints']; i++) {
               if ((y[i]<yp && y[j]>=yp) || (y[j]<yp && y[i]>=yp)) {
                  if (x[i]+(yp-y[i])/(y[j]-y[i])*(x[j]-x[i])<xp) {
                     oddNodes = !oddNodes;
                  }
               }
               j=i;
            }

            return oddNodes;
         };
      }
      if (obj_typename.indexOf("TH1") == 0 ||
          obj_typename.indexOf("TH2") == 0 ||
          obj_typename.indexOf("TH3") == 0) {
         obj['getBinError'] = function(bin) {
            //   -*-*-*-*-*Return value of error associated to bin number bin*-*-*-*-*
            //    if the sum of squares of weights has been defined (via Sumw2),
            //    this function returns the sqrt(sum of w2).
            //    otherwise it returns the sqrt(contents) for this bin.
            if (bin >= this.fNcells) bin = this.fNcells - 1;
            if (bin < 0) bin = 0;
            if (bin < this.fSumw2.length)
               return Math.sqrt(this.fSumw2[bin]);
            return Math.sqrt(Math.abs(this.fArray[bin]));
         };
         obj['setBinContent'] = function(bin, content) {
            // Set bin content - only trival case, without expansion
            this.fEntries++;
            this.fTsumw = 0;
            if ((bin>=0) && (bin<this.fArray.length))
               this.fArray[bin] = content;
         };
      }
      if (obj_typename.indexOf("TH1") == 0) {
         obj['getBin'] = function(x) { return x; }
         obj['getBinContent'] = function(bin) { return this.fArray[bin]; }
      }
      if (obj_typename.indexOf("TH2") == 0) {
         obj['getBin'] = function(x, y) { return (x + (this.fXaxis.fNbins+2) * y); }
         obj['getBinContent'] = function(x, y) { return this.fArray[this.getBin(x, y)]; }
      }
      if (obj_typename.indexOf("TH3") == 0) {
         obj['getBin'] = function(x, y, z) { return (x + (this.fXaxis.fNbins+2) * (y + (this.fYaxis.fNbins+2) * z)); }
         obj['getBinContent'] = function(x, y, z) { return this.fArray[this.getBin(x, y, z)]; };
      }
      if (obj_typename.indexOf("TProfile") == 0) {
         obj['getBin'] = function(x) { return x; }
         obj['getBinContent'] = function(bin) {
            if (bin < 0 || bin >= this['fNcells']) return 0;
            if (this['fBinEntries'][bin] < 1e-300) return 0;
            if (!this['fArray']) return 0;
            return this['fArray'][bin]/this['fBinEntries'][bin];
         };
         obj['getBinEffectiveEntries'] = function(bin) {
            if (bin < 0 || bin >= this['fNcells']) return 0;
            var sumOfWeights = this['fBinEntries'][bin];
            if ( this['fBinSumw2'] == null || this['fBinSumw2'].length != this['fNcells']) {
               // this can happen  when reading an old file
               return sumOfWeights;
            }
            var sumOfWeightsSquare = this['fSumw2'][bin];
            return ( sumOfWeightsSquare > 0 ? sumOfWeights * sumOfWeights / sumOfWeightsSquare : 0 );
         };
         obj['getBinError'] = function(bin) {
            if (bin < 0 || bin >= this['fNcells']) return 0;
            var cont = this['fArray'][bin];               // sum of bin w *y
            var sum  = this['fBinEntries'][bin];          // sum of bin weights
            var err2 = this['fSumw2'][bin];               // sum of bin w * y^2
            var neff = this.getBinEffectiveEntries(bin);  // (sum of w)^2 / (sum of w^2)
            if (sum < 1e-300) return 0;                  // for empty bins
            // case the values y are gaussian distributed y +/- sigma and w = 1/sigma^2
            if (this['fErrorMode'] == EErrorType.kERRORSPREADG) {
               return (1.0/Math.sqrt(sum));
            }
            // compute variance in y (eprim2) and standard deviation in y (eprim)
            var contsum = cont/sum;
            var eprim2  = Math.abs(err2/sum - contsum*contsum);
            var eprim   = Math.sqrt(eprim2);
            if (this['fErrorMode'] == EErrorType.kERRORSPREADI) {
               if (eprim != 0) return eprim/Math.sqrt(neff);
               // in case content y is an integer (so each my has an error +/- 1/sqrt(12)
               // when the std(y) is zero
               return (1.0/Math.sqrt(12*neff));
            }
            // if approximate compute the sums (of w, wy and wy2) using all the bins
            //  when the variance in y is zero
            // case option "S" return standard deviation in y
            if (this['fErrorMode'] == EErrorType.kERRORSPREAD) return eprim;
            // default case : fErrorMode = kERRORMEAN
            // return standard error on the mean of y
            return (eprim/Math.sqrt(neff));
         };
      }
   };

   JSROOT.lastFFormat = "";

   JSROOT.FFormat = function(value, fmt) {
      // method used to convert numeric value to string according specified format
      // format can be like 5.4g or 4.2e or 6.4f
      // function saves actual format in JSROOT.lastFFormat variable
      if (!fmt) fmt = "6.4g";

      JSROOT.lastFFormat = "";

      if (!fmt) fmt = "6.4g";
      fmt = fmt.trim();
      var len = fmt.length;
      if (len<2) return value.toFixed(4);
      var last = fmt.charAt(len-1);
      fmt = fmt.slice(0,len-1);
      var isexp = null;
      var prec = fmt.indexOf(".");
      if (prec<0) prec = 4; else prec = Number(fmt.slice(prec+1));
      if (isNaN(prec) || (prec<0) || (prec==null)) prec = 4;
      var significance = false;
      if ((last=='e') || (last=='E')) { isexp = true; } else
      if (last=='Q') { isexp = true; significance = true; } else
      if ((last=='f') || (last=='F')) { isexp = false; } else
      if (last=='W') { isexp = false; significance = true; } else
      if ((last=='g') || (last=='G')) {
         var se = JSROOT.FFormat(value, fmt+'Q');
         var _fmt = JSROOT.lastFFormat;
         var sg = JSROOT.FFormat(value, fmt+'W');

         if (se.length < sg.length) {
            JSROOT.lastFFormat = _fmt;
            return se;
         }
         return sg;
      } else {
         isexp = false;
         prec = 4;
      }

      if (isexp) {
         // for exponential representation only one significant digit befor point
         if (significance) prec--;
         if (prec<0) prec = 0;

         JSROOT.lastFFormat = '5.'+prec+'e';

         return value.toExponential(prec);
      }

      var sg = value.toFixed(prec);

      if (significance) {

         // when using fixed representation, one could get 0.0
         if ((value!=0) && (Number(sg)==0.) && (prec>0)) {
            prec = 40; sg = value.toFixed(prec);
         }

         var l = 0;
         while ((l<sg.length) && (sg.charAt(l) == '0' || sg.charAt(l) == '-' || sg.charAt(l) == '.')) l++;

         var diff = sg.length - l - prec;
         if (sg.indexOf(".")>l) diff--;

         if (diff != 0) {
            prec-=diff; if (prec<0) prec = 0;
            sg = value.toFixed(prec);
         }
      }

      JSROOT.lastFFormat = '5.'+prec+'f';

      return sg;
   }

   JSROOT.log10 = function(n) {
      return Math.log(n) / Math.log(10);
   }

   // it is important to run this function at the end when all other
   // functions are available
   JSROOT.Initialize = function() {
      function window_on_load(func) {
         if (func!=null) {
            if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading')
               func();
            else
               window.onload = func;
         }
         return JSROOT;
      }

      var scripts = document.getElementsByTagName('script');

      for (var n in scripts) {
         if (scripts[n]['type'] != 'text/javascript') continue;

         var src = scripts[n]['src'];
         if ((src == null) || (src.length == 0)) continue;

         var pos = src.indexOf("scripts/JSRootCore.");
         if (pos<0) continue;

         JSROOT.source_dir = src.substr(0, pos);
         JSROOT.source_min = src.indexOf("scripts/JSRootCore.min.js")>=0;

         JSROOT.console("Set JSROOT.source_dir to " + JSROOT.source_dir);

         if (JSROOT.GetUrlOption('gui', src)!=null)
            return window_on_load(function() { JSROOT.BuildSimpleGUI(); });

         if ( typeof define === "function" && define.amd )
            return window_on_load(function() { JSROOT.BuildSimpleGUI('check_existing_elements'); });

         var prereq = "";
         if (JSROOT.GetUrlOption('io', src)!=null) prereq += "io;";
         if (JSROOT.GetUrlOption('2d', src)!=null) prereq += "2d;";
         if (JSROOT.GetUrlOption('jq2d', src)!=null) prereq += "jq2d;";
         if (JSROOT.GetUrlOption('3d', src)!=null) prereq += "3d;";
         if (JSROOT.GetUrlOption('math', src)!=null) prereq += "math;";
         if (JSROOT.GetUrlOption('mathjax', src)!=null) prereq += "mathjax;";
         var user = JSROOT.GetUrlOption('load', src);
         if ((user!=null) && (user.length>0)) prereq += "load:" + user;
         var onload = JSROOT.GetUrlOption('onload', src);

         if ((prereq.length>0) || (onload!=null))
            window_on_load(function() {
              if (prereq.length>0) JSROOT.AssertPrerequisites(prereq, onload); else
              if (onload!=null) {
                 onload = JSROOT.findFunction(onload);
                 if (typeof onload == 'function') onload();
              }
            });

         return this;
      }
      return this;
   }

   return JSROOT.Initialize();

}));

/// JSRootCore.js ends

