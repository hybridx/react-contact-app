(this["webpackJsonpreact-contact-app"]=this["webpackJsonpreact-contact-app"]||[]).push([[0],[,,,,,,,,function(e,a,t){e.exports=t(16)},,,,,function(e,a,t){},function(e,a,t){},function(e,a,t){},function(e,a,t){"use strict";t.r(a);var n=t(0),l=t.n(n),c=t(2),r=t.n(c),o=(t(13),t(6)),i=t(3),m=t(4),d=t(5),s=t(7),u=(t(14),function(e){Object(s.a)(t,e);var a=Object(d.a)(t);function t(e){var n;return Object(i.a)(this,t),(n=a.call(this,e)).state={name:"John Doe",email:"jdoe@redhat.com",phone:9988776655,address:"JDoe 1120",birthday:"11-1-2020"},n}return Object(m.a)(t,[{key:"handleClick",value:function(e){this.setState(Object(o.a)({},e))}},{key:"renderModal",value:function(){var e=this,a=["A","B","C","D","E","F","G","H","I","J"].map((function(a,t){return l.a.createElement("div",{key:t,className:"contact__card","data-toggle":"modal","data-target":".contact-modal",onClick:function(){e.handleClick({name:"Deepesh Nair",email:"denair@redhat.com",phone:9988776655,address:"JDoe 1120",birthday:"11-1-2020"})}},a," ")})),t=this.state.name,n=this.state.email,c=this.state.phone,r=this.state.address,o=this.state.birthday;return l.a.createElement("div",{className:"contact"},a,l.a.createElement("div",{className:"modal fade contact-modal",tabIndex:"-1",role:"dialog","aria-labelledby":"contactModal","aria-hidden":"true"},l.a.createElement("div",{className:"modal-dialog modal-lg"},l.a.createElement("div",{className:"modal-content"},l.a.createElement("div",{className:"modal-header"},l.a.createElement("button",{className:"btn"},l.a.createElement("i",{className:"fa fa-edit"})," Edit"),l.a.createElement("button",{className:"btn"},l.a.createElement("i",{className:"far fa-trash-alt"})," Remove")),l.a.createElement("div",{className:"modal-body"},l.a.createElement("h1",null,t),l.a.createElement("div",{className:"contact-information"},l.a.createElement("div",{className:"contact-information__item"},l.a.createElement("label",{htmlFor:"email"},"Email"),l.a.createElement("input",{type:"email",id:"email",defaultValue:n})),l.a.createElement("div",{className:"contact-information__item"},l.a.createElement("label",{htmlFor:"contact"},"Contact"),l.a.createElement("input",{type:"number",id:"contact",defaultValue:c})),l.a.createElement("div",{className:"contact-information__item"},l.a.createElement("label",{htmlFor:"address"},"Address"),l.a.createElement("input",{type:"text",id:"address",defaultValue:r})),l.a.createElement("div",{className:"contact-information__item"},l.a.createElement("label",{htmlFor:"date"},"Birthday"),l.a.createElement("input",{type:"date",id:"date",defaultValue:o}))))))))}},{key:"render",value:function(){return this.renderModal()}}]),t}(l.a.Component));var h=function(){return l.a.createElement("div",null,l.a.createElement(u,null))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));t(15);var E=function(){return l.a.createElement("nav",null,"nav bar")};r.a.render(l.a.createElement(l.a.StrictMode,null,l.a.createElement(E,null),l.a.createElement(h,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}],[[8,1,2]]]);
//# sourceMappingURL=main.f5e0178a.chunk.js.map