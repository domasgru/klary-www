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
        '<head><meta charset="utf-8"> <meta name="description" content="Personal feedback sharing platform"> <meta property="og:title" content="Personal feedback sharing platform"> <meta property="og:description" content="Give, receive, and discuss feedbacks in one place."> <meta property="og:image" content="https://kuriapp.com/img/ogimage.png"> <meta property="og:url" content="https://kuriapp.com/index.html"> <title>Kuri - personal feedback sharing platform</title> <link rel="preconnect" href="https://fonts.gstatic.com"> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <style>' +
          _vm._s(_vm.css) +
          "</style></head> "
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
  const __vue_module_identifier__ = "data-v-f5c126f0";
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
