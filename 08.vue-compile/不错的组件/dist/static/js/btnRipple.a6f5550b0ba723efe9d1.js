!function(t){function e(n){if(i[n])return i[n].exports;var r=i[n]={i:n,l:!1,exports:{}};return t[n].call(r.exports,r,r.exports,e),r.l=!0,r.exports}var i={};e.m=t,e.c=i,e.i=function(t){return t},e.d=function(t,i,n){e.o(t,i)||Object.defineProperty(t,i,{configurable:!1,enumerable:!0,get:n})},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="/vue-component/dist/",e(e.s=58)}({1:function(t,e){t.exports=function(t,e,i,n,r){var o,s=t=t||{},a=typeof t.default;"object"!==a&&"function"!==a||(o=t,s=t.default);var c="function"==typeof s?s.options:s;e&&(c.render=e.render,c.staticRenderFns=e.staticRenderFns),n&&(c._scopeId=n);var l;if(r?(l=function(t){t=t||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext,t||"undefined"==typeof __VUE_SSR_CONTEXT__||(t=__VUE_SSR_CONTEXT__),i&&i.call(this,t),t&&t._registeredComponents&&t._registeredComponents.add(r)},c._ssrRegister=l):i&&(l=i),l){var u=c.functional,d=u?c.render:c.beforeCreate;u?c.render=function(t,e){return l.call(e),d(t,e)}:c.beforeCreate=d?[].concat(d,l):[l]}return{esModule:o,exports:s,options:c}}},102:function(t,e){},108:function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("button",{staticClass:"zk-btn"},[i("canvas",{staticClass:"zk-ripple",on:{click:t.ripple}}),t._v(" "),t._t("default")],2)},staticRenderFns:[]}},44:function(t,e){},51:function(t,e,i){function n(t){i(102)}var r=i(1)(i(69),i(108),n,"data-v-892d55d4",null);t.exports=r.exports},58:function(t,e,i){"use strict";var n=i(51),r=function(t){return t&&t.__esModule?t:{default:t}}(n);i(44),new Vue({el:"#app",data:function(){return{}},methods:{},components:{ZkButton:r.default}})},59:function(t,e,i){"use strict";function n(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null;return window.getComputedStyle(t,i)[e]}function r(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null;try{var r=n(t,e,i);return parseFloat(r)}catch(t){console.error(t)}}Object.defineProperty(e,"__esModule",{value:!0}),e.getStyle=n,e.getStyleNumber=r},69:function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=i(59);e.default={name:"ZkButton",props:{speed:{type:Number,default:3},opacity:{type:Number,default:.4}},data:function(){return{color:"",radius:0,oCanvas:null,context:null,initialized:!1,speedOpacity:0,timer:null,origin:{}}},methods:{init:function(t){var e=t.parentElement;this.color=(0,n.getStyle)(t.parentElement,"color");var i=(0,n.getStyleNumber)(e,"width");this.speedOpacity=this.speed/i*this.opacity,t.width=i,t.height=(0,n.getStyleNumber)(e,"height"),this.context=t.getContext("2d")},ripple:function(t){this.timer&&window.cancelAnimationFrame(this.timer),this.el=t.target,this.initialized||(this.initialized=!0,this.init(this.el)),this.radius=0,this.origin.x=t.offsetX,this.origin.y=t.offsetY,this.context.clearRect(0,0,this.el.width,this.el.height),this.el.style.opacity=this.opacity,this.draw()},draw:function(){this.context.beginPath(),this.context.arc(this.origin.x,this.origin.y,this.radius,0,2*Math.PI,!1),this.context.fillStyle=this.color,this.context.fill(),this.radius+=this.speed,this.el.style.opacity-=this.speedOpacity,this.radius<this.el.width||this.el.style.opacity>0?this.timer=window.requestAnimationFrame(this.draw):(this.context.clearRect(0,0,this.el.width,this.el.height),this.el.style.opacity=0)}},destroyed:function(){this.timer&&(window.cancelAnimationFrame(this.timer),this.timer=null)}},t.exports=e.default}});
//# sourceMappingURL=btnRipple.a6f5550b0ba723efe9d1.js.map