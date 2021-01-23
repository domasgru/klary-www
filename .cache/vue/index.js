'use strict';

var landing = require('./landing.js');
var normalizeComponent = require('./normalize-component-d98a7a19.js');

//

var script = {
  components: {
      landing
  },
  computed: {
    css: function() {
      return this.getVueComponentCssForPage(this.page.url);
    }
  }
};

/* script */
const __vue_script__ = script;
/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "html",
    { attrs: { lang: "en" } },
    [
      _vm._ssrNode(
        '<head><meta charset="utf-8"> <meta name="description" content="Personal feedback sharing platform"> <title>Kuri - personal feedback sharing platform</title> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <style>' +
          _vm._s(_vm.css) +
          "</style> <script type=\"text/javascript\">\n      WebFontConfig = {\n          google: { families: [ 'Inter:400,600,700' ] }\n      };\n      (function() {\n          var wf = document.createElement('script');\n          wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';\n          wf.type = 'text/javascript';\n          wf.async = 'true';\n          var s = document.getElementsByTagName('script')[0];\n          s.parentNode.insertBefore(wf, s);\n      })(); \n  </script></head> "
      ),
      _vm._ssrNode("<body>", "</body>", [_c("landing")], 1)
    ],
    2
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = "data-v-2ee2b5fc";
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = /*#__PURE__*/normalizeComponent.normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    undefined,
    undefined,
    undefined
  );

module.exports = __vue_component__;
