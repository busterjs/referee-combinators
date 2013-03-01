((typeof define === "function" && define.amd && function (m) {
    define(["lodash", "referee", "util", "when"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("lodash"),
                       require("referee"),
                       require("./util"),
                       require("when"));
}) || function (m) { this.referee = m(this._, this.referee, this.util, this.when); }
)(function (_, referee, util, when) {
    "use strict";

    var format = util.format;
    var formatArgs = util.formatArgs;

    var partial = function (unappliedAssertion) {
        var takesExpd = function () {
            var expected = _.toArray(arguments);
            var takesActl = function (actual) {
                unappliedAssertion.apply(this, [actual].concat(expected));
                return actual;
            };
            takesActl.raw = function(actual){
                return unappliedAssertion.raw.apply(this, [actual].concat(expected));
            };

            takesActl.displayName = takesExpd.displayName
                                    + formatArgs(expected);
            return takesActl;
        };

        if(typeof unappliedAssertion.raw !== "undefined") {
            takesExpd.displayName = unappliedAssertion.raw.type + "." + unappliedAssertion.raw.description;
            takesExpd.raw = function() {
                var expected = _.toArray(arguments);
                return function(actual) {
                    return unappliedAssertion.raw.apply(this, [actual].concat(expected));
                }
            }
        }
        return takesExpd;
    };

    referee.combinators = {
        assert: _.reduce(_.pairs(referee.assert),
            function (val, elem) {
                val[elem[0]] = partial(elem[1]);
                return val;
            },
            {}),
        refute: _.reduce(_.pairs(referee.refute),
            function (val, elem) {
                val[elem[0]] = partial(elem[1]);
                return val;
            },
            {})
    };

    var c = referee.combinators;
    var add = referee.add;
    referee.add = function (name, options) {
        var result = add(name, options);
        c.assert[name] = partial(referee.assert[name], "assert." + name);
        c.refute[name] = partial(referee.refute[name], "refute." + name);
        return result;
    };

    referee.add('attr', {
        assert: function (actual, name, assertion) {
            var result = actual ?  when(assertion.raw(actual[name])).
                then(when,
                     function(message){
                         return when.reject(name+": "+message);
                     }) :  when.reject(name +  " is not a member of "+actual);
            return result;
        }
    });

    var typeToAssert = {
        'object': c.assert.structure,
        'function': _.identity
    };

    referee.add('structure', {
        assert: function (actual, structure) {
            function makeAssert(spec) {
                var assertion = (typeToAssert[typeof spec[1]]
                    || c.assert.equals)(spec[1]);
                return c.assert.attr(spec[0], assertion);
            }

            try {
                return _(structure).pairs().map(makeAssert)
                    .each(function (assert) { assert(actual); });
            } catch (AssertionError) {
                return false;
            }
        }
    });

    return referee;
});
