'use strict';

var noDiv = require('./noDiv.js');
var myHeader = require('./myHeader.js');
var hi = require('./hi.js');
var hi$1 = require('./hi2.js');
var normalizeComponent = require('./normalize-component-d98a7a19.js');
require('./child.js');
require('./sibling.js');

//

var script = {
	data: () => {
		return {
			layout: "layout.njk",
			test: "HELLO",
			permalink: "/testing/testing/"
		};
	},
	components: {
		noDiv,
		myHeader,
		hi,
		otherHi: hi$1
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
    "div",
    [
      _vm._ssrNode(
        "\n\tHELLO WE ARE VUEING\n\tCurrent page url: <p>" +
          _vm._s(_vm.page.url) +
          "</p>" +
          _vm._ssrEscape("\n\tURL method: " + _vm._s(_vm.url("hi")) + "\n\t") +
          "<div>" +
          _vm._s(_vm.test) +
          "</div> "
      ),
      _c("noDiv"),
      _vm._ssrNode(" "),
      _c("myHeader", [_c("noDiv")], 1),
      _vm._ssrNode(" "),
      _c("hi"),
      _vm._ssrNode(" "),
      _c("otherHi"),
      _vm._ssrNode(" <script></script>")
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
  const __vue_module_identifier__ = "data-v-99ffab58";
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
