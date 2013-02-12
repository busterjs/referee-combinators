((typeof define === "function" && define.amd && function (m) {
    define(["lodash", "referee"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("lodash"), require("referee"));
}) || function (m) { this.referee = m(this._, this.referee); }
)(function (_, referee) {
    "use strict";
    var partial = function (fn) {
        return function () {
            var expected = _.toArray(arguments);
            return function (actual) {
                fn.apply(this, [actual].concat(expected));
                return actual;
            };
        };
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

    var add = referee.add;
    referee.add = function (name, options) {
        var result = add(name, options);
        referee.combinators.assert[name] = partial(referee.assert[name]);
        referee.combinators.refute[name] = partial(referee.refute[name]);
        return result;
    };

    referee.add('attr', {
        assert: function (actual, name, assertion) {
            try {
                return assertion(actual[name]);
            } catch (AssertionError) {
                return false;
            }
        }
    });

    return referee;
});
