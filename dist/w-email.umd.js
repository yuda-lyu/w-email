/*!
 * w-email v1.0.16
 * (c) 2018-2019 yuda-lyu(semisphere)
 * Released under the MIT License.
 */
!function(t,r){"object"==typeof exports&&"undefined"!=typeof module?module.exports=r(require("nodemailer")):"function"==typeof define&&define.amd?define(["nodemailer"],r):(t=t||self)["w-email"]=r(t.nodemailer)}(this,(function(t){"use strict";t=t&&t.hasOwnProperty("default")?t.default:t;var r=Array.isArray;function e(t){return(e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}var n="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},o="object"==e(n)&&n&&n.Object===Object&&n,a="object"==("undefined"==typeof self?"undefined":e(self))&&self&&self.Object===Object&&self,i=o||a||Function("return this")(),u=i.Symbol,c=Object.prototype,s=c.hasOwnProperty,l=c.toString,f=u?u.toStringTag:void 0;var v=function(t){var r=s.call(t,f),e=t[f];try{t[f]=void 0;var n=!0}catch(t){}var o=l.call(t);return n&&(r?t[f]=e:delete t[f]),o},p=Object.prototype.toString;var h=function(t){return p.call(t)},y="[object Null]",d="[object Undefined]",_=u?u.toStringTag:void 0;var b=function(t){return null==t?void 0===t?d:y:_&&_ in Object(t)?v(t):h(t)};var m=function(t){return null!=t&&"object"==e(t)},g="[object Symbol]";var j=function(t){return"symbol"==e(t)||m(t)&&b(t)==g},w=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,O=/^\w*$/;var S=function(t,n){if(r(t))return!1;var o=e(t);return!("number"!=o&&"symbol"!=o&&"boolean"!=o&&null!=t&&!j(t))||(O.test(t)||!w.test(t)||null!=n&&t in Object(n))};var z=function(t){var r=e(t);return null!=t&&("object"==r||"function"==r)},P="[object AsyncFunction]",C="[object Function]",$="[object GeneratorFunction]",E="[object Proxy]";var T,A=function(t){if(!z(t))return!1;var r=b(t);return r==C||r==$||r==P||r==E},x=i["__core-js_shared__"],F=(T=/[^.]+$/.exec(x&&x.keys&&x.keys.IE_PROTO||""))?"Symbol(src)_1."+T:"";var k=function(t){return!!F&&F in t},M=Function.prototype.toString;var N=function(t){if(null!=t){try{return M.call(t)}catch(t){}try{return t+""}catch(t){}}return""},R=/^\[object .+?Constructor\]$/,q=Function.prototype,B=Object.prototype,G=q.toString,H=B.hasOwnProperty,I=RegExp("^"+G.call(H).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");var U=function(t){return!(!z(t)||k(t))&&(A(t)?I:R).test(N(t))};var W=function(t,r){return null==t?void 0:t[r]};var D=function(t,r){var e=W(t,r);return U(e)?e:void 0},J=D(Object,"create");var K=function(){this.__data__=J?J(null):{},this.size=0};var L=function(t){var r=this.has(t)&&delete this.__data__[t];return this.size-=r?1:0,r},Q="__lodash_hash_undefined__",V=Object.prototype.hasOwnProperty;var X=function(t){var r=this.__data__;if(J){var e=r[t];return e===Q?void 0:e}return V.call(r,t)?r[t]:void 0},Y=Object.prototype.hasOwnProperty;var Z=function(t){var r=this.__data__;return J?void 0!==r[t]:Y.call(r,t)},tt="__lodash_hash_undefined__";var rt=function(t,r){var e=this.__data__;return this.size+=this.has(t)?0:1,e[t]=J&&void 0===r?tt:r,this};function et(t){var r=-1,e=null==t?0:t.length;for(this.clear();++r<e;){var n=t[r];this.set(n[0],n[1])}}et.prototype.clear=K,et.prototype.delete=L,et.prototype.get=X,et.prototype.has=Z,et.prototype.set=rt;var nt=et;var ot=function(){this.__data__=[],this.size=0};var at=function(t,r){return t===r||t!=t&&r!=r};var it=function(t,r){for(var e=t.length;e--;)if(at(t[e][0],r))return e;return-1},ut=Array.prototype.splice;var ct=function(t){var r=this.__data__,e=it(r,t);return!(e<0)&&(e==r.length-1?r.pop():ut.call(r,e,1),--this.size,!0)};var st=function(t){var r=this.__data__,e=it(r,t);return e<0?void 0:r[e][1]};var lt=function(t){return it(this.__data__,t)>-1};var ft=function(t,r){var e=this.__data__,n=it(e,t);return n<0?(++this.size,e.push([t,r])):e[n][1]=r,this};function vt(t){var r=-1,e=null==t?0:t.length;for(this.clear();++r<e;){var n=t[r];this.set(n[0],n[1])}}vt.prototype.clear=ot,vt.prototype.delete=ct,vt.prototype.get=st,vt.prototype.has=lt,vt.prototype.set=ft;var pt=vt,ht=D(i,"Map");var yt=function(){this.size=0,this.__data__={hash:new nt,map:new(ht||pt),string:new nt}};var dt=function(t){var r=e(t);return"string"==r||"number"==r||"symbol"==r||"boolean"==r?"__proto__"!==t:null===t};var _t=function(t,r){var e=t.__data__;return dt(r)?e["string"==typeof r?"string":"hash"]:e.map};var bt=function(t){var r=_t(this,t).delete(t);return this.size-=r?1:0,r};var mt=function(t){return _t(this,t).get(t)};var gt=function(t){return _t(this,t).has(t)};var jt=function(t,r){var e=_t(this,t),n=e.size;return e.set(t,r),this.size+=e.size==n?0:1,this};function wt(t){var r=-1,e=null==t?0:t.length;for(this.clear();++r<e;){var n=t[r];this.set(n[0],n[1])}}wt.prototype.clear=yt,wt.prototype.delete=bt,wt.prototype.get=mt,wt.prototype.has=gt,wt.prototype.set=jt;var Ot=wt,St="Expected a function";function zt(t,r){if("function"!=typeof t||null!=r&&"function"!=typeof r)throw new TypeError(St);var e=function e(){var n=arguments,o=r?r.apply(this,n):n[0],a=e.cache;if(a.has(o))return a.get(o);var i=t.apply(this,n);return e.cache=a.set(o,i)||a,i};return e.cache=new(zt.Cache||Ot),e}zt.Cache=Ot;var Pt=zt,Ct=500;var $t=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,Et=/\\(\\)?/g,Tt=function(t){var r=Pt(t,(function(t){return e.size===Ct&&e.clear(),t})),e=r.cache;return r}((function(t){var r=[];return 46===t.charCodeAt(0)&&r.push(""),t.replace($t,(function(t,e,n,o){r.push(n?o.replace(Et,"$1"):e||t)})),r}));var At=function(t,r){for(var e=-1,n=null==t?0:t.length,o=Array(n);++e<n;)o[e]=r(t[e],e,t);return o},xt=1/0,Ft=u?u.prototype:void 0,kt=Ft?Ft.toString:void 0;var Mt=function t(e){if("string"==typeof e)return e;if(r(e))return At(e,t)+"";if(j(e))return kt?kt.call(e):"";var n=e+"";return"0"==n&&1/e==-xt?"-0":n};var Nt=function(t){return null==t?"":Mt(t)};var Rt=function(t,e){return r(t)?t:S(t,e)?[t]:Tt(Nt(t))},qt=1/0;var Bt=function(t){if("string"==typeof t||j(t))return t;var r=t+"";return"0"==r&&1/t==-qt?"-0":r};var Gt=function(t,r){for(var e=0,n=(r=Rt(r,t)).length;null!=t&&e<n;)t=t[Bt(r[e++])];return e&&e==n?t:void 0};var Ht=function(t,r,e){var n=null==t?void 0:Gt(t,r);return void 0===n?e:n};function It(t){return"[object String]"===Object.prototype.toString.call(t)}function Ut(t){return!(!It(r=t)||""===r)&&/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(t);var r}return function(){var r,e,n,o=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},a=((n=new Promise((function(){r=arguments[0],e=arguments[1]}))).resolve=r,n.reject=e,n),i=Ht(o,"srcName","system by w-email"),u=Ht(o,"srcEmail","");if(!Ut(u))return a.reject("srcEmail is not email"),a;var c,s=Ht(o,"srcPW",""),l=Ht(o,"srcHost","smtp.gmail.com"),f=Ht(o,"srcPort",587),v=Ht(o,"emTitle",""),p=Ht(o,"emContent",""),h=Ht(o,"emAttachments",[]);c=h,"[object Object]"===Object.prototype.toString.call(c)&&(h=[h]);var y=Ht(o,"toEmails",[]);It(y)&&(y=[y]);var d=Ht(o,"toEmailsCC",[]);It(d)&&(d=[d]);var _=Ht(o,"toEmailsBCC",[]);It(_)&&(_=[_]);var b=t.createTransport({host:l,secureConnecton:!0,port:f,auth:{user:u,pass:s}}),m={from:"".concat(i," <").concat(u,">"),to:y.join(","),cc:d.join(","),bcc:_.join(","),subject:v,html:p,attachments:h};return b.sendMail(m,(function(t,r){t?a.reject(t):a.resolve(r.response)})),a}}));
//# sourceMappingURL=w-email.umd.js.map
