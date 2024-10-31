!function(e){function t(r){if(n[r])return n[r].exports;var i=n[r]={i:r,l:!1,exports:{}};return e[r].call(i.exports,i,i.exports,t),i.l=!0,i.exports}var n={};t.m=e,t.c=n,t.i=function(e){return e},t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="/vue-component/dist/",t(t.s=64)}({1:function(e,t){e.exports=function(e,t,n,r,i){var s,o=e=e||{},a=typeof e.default;"object"!==a&&"function"!==a||(s=e,o=e.default);var u="function"==typeof o?o.options:o;t&&(u.render=t.render,u.staticRenderFns=t.staticRenderFns),r&&(u._scopeId=r);var c;if(i?(c=function(e){e=e||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext,e||"undefined"==typeof __VUE_SSR_CONTEXT__||(e=__VUE_SSR_CONTEXT__),n&&n.call(this,e),e&&e._registeredComponents&&e._registeredComponents.add(i)},u._ssrRegister=c):n&&(c=n),c){var h=u.functional,l=h?u.render:u.beforeCreate;h?u.render=function(e,t){return c.call(t),l(e,t)}:u.beforeCreate=l?[].concat(l,c):[c]}return{esModule:s,exports:o,options:u}}},105:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"col-wrapper",style:e.getWrapperHeight},[n("ul",{ref:"wheel",staticClass:"wheel-list",style:e.getListTop},e._l(e.scrollValues,function(t){return n("li",{staticClass:"wheel-item",style:e.initWheelItemDeg(t.index)},[e._v(e._s(t.value))])})),e._v(" "),n("div",{staticClass:"cover",style:e.getCoverStyle}),e._v(" "),n("div",{staticClass:"divider",style:e.getDividerStyle})])},staticRenderFns:[]}},40:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(41),i=function(e){return e&&e.__esModule?e:{default:e}}(r),s=function e(){var t=this;(0,i.default)(this,e),this.start=function(e){if(!e)throw new Error("需要执行函数");t.timer&&t.stop(),t.timer=requestAnimationFrame(e)},this.stop=function(){t.timer&&(cancelAnimationFrame(t.timer),t.timer=null)},this.timer=null};t.default=s,e.exports=t.default},41:function(e,t,n){"use strict";t.__esModule=!0,t.default=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}},47:function(e,t){},54:function(e,t,n){function r(e){n(99)}var i=n(1)(n(72),n(105),r,null,null);e.exports=i.exports},64:function(e,t,n){"use strict";var r=n(54),i=function(e){return e&&e.__esModule?e:{default:e}}(r);n(47),new Vue({el:"#app",data:function(){return{selected:""}},mounted:function(){},methods:{getSelectValue:function(e){this.selected=e}},components:{SelectColumn:i.default}})},72:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});for(var r=n(40),i=function(e){return e&&e.__esModule?e:{default:e}}(r),s=!1,o=Math.round(180*Math.acos(.9352)/Math.PI);360%o!=0&&o<=360;)o+=1;var a=o,u=Math.floor(360/a/2);t.default={data:function(){return{values:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],finger:{startY:0,endY:0,startTime:0,entTime:0,currentMove:0,prevMove:0},range:{start:-u,end:u,space:u}}},computed:{scrollValues:function(){for(var e=[],t=this.range.start;t<=this.range.end;t+=1)e.push({value:this.getRangeData(t),index:t});return e},getListTop:function(){return{top:100-Math.round(18)+"px",height:"36px"}},getWrapperHeight:function(){return{height:"200px"}},getCoverStyle:function(){return{backgroundSize:"100% "+(100-Math.round(18))+"px"}},getDividerStyle:function(){return{top:100-Math.round(18)+"px",height:"34px"}},animate:function(){return new i.default}},mounted:function(){this.$el.addEventListener("touchstart",this.listenerTouchStart,!1),this.$el.addEventListener("touchmove",this.listenerTouchMove,!1),this.$el.addEventListener("touchend",this.listenerTouchEnd,!1)},beforeDestory:function(){this.$el.removeEventListener("touchstart",this.listenerTouchStart,!1),this.$el.removeEventListener("touchmove",this.listenerTouchMove,!1),this.$el.removeEventListener("touchend",this.listenerTouchEnd,!1)},methods:{initWheelItemDeg:function(e){return{transform:"rotate3d(1, 0, 0, "+-1*e*a+"deg) translate3d(0, 0, 100px)",height:"36px",lineHeight:"36px"}},listenerTouchStart:function(e){e.stopPropagation(),e.preventDefault(),s=!1,this.finger.startY=e.targetTouches[0].pageY,this.finger.prevMove=this.finger.currentMove,this.finger.startTime=Date.now()},listenerTouchMove:function(e){e.stopPropagation(),e.preventDefault();var t=this.finger.startY-e.targetTouches[0].pageY+this.finger.prevMove;this.finger.currentMove=t,this.$refs.wheel.style.transform="rotate3d(1, 0, 0, "+t/36*a+"deg)",this.updateRange(Math.round(t/36))},listenerTouchEnd:function(e){e.stopPropagation(),e.preventDefault(),this.finger.endY=e.changedTouches[0].pageY,this.finger.endTime=Date.now(),this.getInertiaDistance()},updateRange:function(e){this.range.start=-1*this.range.space+e,this.range.end=this.range.start+2*this.range.space},getRangeData:function(e){return e%=this.values.length,this.values[e>=0?e:e+this.values.length]},getSelectValue:function(e){var t=Math.abs(e/36),n=this.getRangeData(t);this.$emit("select",n)},getInertiaDistance:function(){var e=this.finger.startY-this.finger.endY,t=this.finger.endTime-this.finger.startTime,n=e/t,r=Math.abs(n);s=!0,this.inertia(r,Math.floor(r/n),0)},inertia:function(e,t,n){if(e<=n||!s)return this.animate.stop(),this.finger.prevMove=this.finger.currentMove,this.updateRange(Math.round(this.finger.currentMove/36)),void this.getSelectValue(this.finger.currentMove);var r=t*e*(1e3/60)+1e3/60*-.025+this.finger.currentMove,i=t*e-.05,o=r/36*a,u=r;i<=n?(o=Math.round(r/36)*a,u=36*Math.round(r/36),this.$refs.wheel.style.transition="transform 700ms cubic-bezier(0.19, 1, 0.22, 1)"):this.$refs.wheel.style.transition="",this.finger.currentMove=u,this.$refs.wheel.style.transform="rotate3d(1, 0, 0, "+o+"deg)",this.updateRange(Math.round(this.finger.currentMove/36)),this.animate.start(this.inertia.bind(this,i,t,n))}}},e.exports=t.default},99:function(e,t){}});
//# sourceMappingURL=iosSelect.a40e52137205fb785ecd.js.map