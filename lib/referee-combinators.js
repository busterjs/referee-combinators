((typeof define === "function" && define.amd && function (m) {
    define(["lodash", "referee"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("lodash"), require("referee"));
}) || function (m) { this.referee = m(this._, this.referee); }
)(function (_, referee) {
    "use strict";
    var partial = function(fn) {
	return function(expected) {
	    return function(actual) {
		fn(actual, expected);
	    }
	}
    }
    
    referee.combinators = {
	assert: _.reduce(_.pairs(referee.assert),
			 function(val, elem){
			     val[elem[0]] = partial(elem[1]);
			     return val
			 }, 
			 {}),
	refute: _.reduce(_.pairs(referee.refute),
			 function(val, elem){
			     val[elem[0]] = partial(elem[1]);
			     return val
			 }, 
			 {})
    };

    return referee;
})
  
