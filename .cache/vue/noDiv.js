'use strict';

var child = require('./child.js');
var sibling = require('./sibling.js');
var normalizeComponent = require('./normalize-component-d98a7a19.js');

//

var script = {
	data: function() {
		return {
			greeting: "Hello"
		};
	},
	created: function() {
		console.log( "noDiv is created", this.url, this.page );
	},
	components: {
		child: child,
		sibling: sibling
	}
};

/* script */
const __vue_script__ = script;
/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { staticClass: "parent" }, [_c("child")], 1)
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = "data-v-7731e218";
  /* module identifier */
  const __vue_module_identifier__ = "data-v-7731e218";
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
