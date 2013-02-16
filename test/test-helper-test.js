/*jslint maxlen:100 */
/*jslint regexp:true*/ // allow . and [^...] in regexps 
(function (h, util, buster, referee, _) {
    if (typeof require === "function" && typeof module === "object") {
        h = require("./test-helper");
        util = require("../lib/util");
        _ = require("lodash");
        referee = require("referee");

        //// This is a temporary workaround for the development-environment:
        //buster = require("buster-node");
        //var B = require("buster");
        //buster.format = { ascii: B.format.ascii.bind(B) };
        // remove the above and uncomment the following once workaround is obsolete:
        buster = require("buster");
    }

    var assert = buster.assert;
    var refute = buster.refute;
    var expect = buster.assertions.expect;

    var format = util.format;
    var formatArgs = util.formatArgs;

    // stuff under test
    var raw = h.rawCustomAssertions;
    var makeTests = h.makeTests;

    buster.testCase("test-helper", {

        "/ custom assertion( def)s": {

            "/ raw isPlainObjectOrFunc.assert": {

                setUp: function () {
                    this.assertionFn = raw.isPlainObjectOrFunc.assert;
                },

                "returns true for": {
                    "function": function () {
                        assert.isTrue(this.assertionFn(function () {}));
                    },
                    "object": function () {
                        /*???jslint???*/
                        assert.isTrue(this.assertionFn({}), "object literal");
                        assert.isTrue(this.assertionFn(new Object()), "`new Object()`");
                        assert.isTrue(this.assertionFn({0: 42, length: 1}), "array-like");
                        assert.isTrue(this.assertionFn(buster), "the buster");
                    },
                },

                "returns false for": {
                    "null, undefined and NaN": function () {
                        assert.isFalse(this.assertionFn(null), "null");
                        assert.isFalse(this.assertionFn(undefined), "undefined");
                        assert.isFalse(this.assertionFn(void 0), "void 0");
                        assert.isFalse(this.assertionFn(NaN), "NaN");
                    },
                    "boolean": function () {
                        assert.isFalse(this.assertionFn(true), "true");
                        assert.isFalse(this.assertionFn(false), "false");
                    },
                    "number": function () {
                        assert.isFalse(this.assertionFn(0));
                        assert.isFalse(this.assertionFn(1));
                        assert.isFalse(this.assertionFn(-7));
                        assert.isFalse(this.assertionFn(3.14159265));
                    },
                    "string": function () {
                        assert.isFalse(this.assertionFn(""), "empty string literal");
                        assert.isFalse(this.assertionFn('foo'), "string literal 'foo'");
                        assert.isFalse(this.assertionFn(new String()), "`new String()`");
                    },
                    "regexp": function () {
                        assert.isFalse(this.assertionFn(new RegExp('a*')), "new RegExp('a*')");
                        assert.isFalse(this.assertionFn(/a*/), "regexp literal");
                    },
                    "arrays": function () {
                        /*???jslint???*/
                        assert.isFalse(this.assertionFn([]), "empty array literal");
                        assert.isFalse(this.assertionFn([1, 2, "3"]), "mixed array literal");
                        assert.isFalse(this.assertionFn(new Array()), "`new Array()`");
                    },
                    "implicit `arguments`": function () {
                        assert.isFalse(this.assertionFn(arguments));
                    }
                },

                "// / test failure messages": {
                    "": function () { // TODO: need this empty fn to get a "Deferred" listed (?)
                    }
                }

            },

            "/ raw isProperSubset.assert": {

                setUp: function () {
                    this.assertionFn = raw.isProperSubset.assert;
                },

                "// returns true for": {
                    "": function () {
                        assert.isFalse(this.assertionFn(    ));
                    },
                },

                "// returns false for": {
                    "": function () {
                        assert.isFalse(this.assertionFn(    ));
                    },
                },


                "// / test failure messages": {
                    "": function () { // TODO: need this empty fn to get a "Deferred" listed (?)
                    }
                }
            },

        },

        "makeTests": { // TODO: a lot more...

            "calls callback at least once with two function args": function () {
                var cb = this.spy();
                makeTests('isTrue', [], cb);

                assert.greater(cb.callCount, 1, "callback.callCount");
                assert.isFunction(cb.args[0][0], "1st arg to callback on 1st call");
                assert.isFunction(cb.args[0][1], "2nd arg to callback on 1st call");
            },

            "returns" : {
                "non-empty plain object": function () {
                    var actual = makeTests('isTrue', [], function () {});
                    assert.isPlainObjectOrFunc(actual);
                    refute.isFunction(actual, format(actual));

                    refute(_.isEmpty(actual), format(actual) + " should be non-empty");
                },

                "plain object with own props either functions or plain objects with...":
                    function () {
                        var actual = makeTests('isTrue', [], function (pass, fail) {});
                        //actual.whuteva = { f: function () {}, two: { three : {}, 4: []} };

                        assert.isPlainObjectOrFunc(actual);
                        refute.isFunction(actual, format(actual));

                        util.forOwnRec(actual, function (v, path) {
                            var pathStr = "at ["
                                + _(path).tail().map(format).join("][") + "]";
                            assert.isPlainObjectOrFunc(v, pathStr);
                            if (!_.isFunction(v)) {
                                refute(_.isEmpty(v), "object " + pathStr
                                    + " should be non-empty");
                            }
                        });
                    }
            },

            "creates more tests when 'pass' and/or 'fail' are called": function () {
                // In order to be able to use assert.match we need to reset any function
                // attributes to some single value because the functions need not be same
                // It's actually the keys that matter.
                function allFuncsSame(object) {
                    var someValue = {}; // must be very same thing
                    /*
                    return _.cloneDeep(object, function (v) { // not working...!
                        return _.isFunction(v) ? someValue : v;
                    });
                    */
                    var walk = _.partialRight(_.reduce, _.result); // _.result(o,k) === o[k]

                    var result = {};
                    util.forOwnRec(object, function (v, path) {
                        var newKey = path.pop();
                        path[0] = result;
                        walk(path)[newKey] = someValue;
                    });
                    return result;
                }
                // short-hand
                function prepare(f) {
                    var t = makeTests('isTrue', [], f);
                    //return allFuncsSame(t);
                    var result = [];
                    util.forOwnRec(t, function (v, path) {
                        path.shift();
                        var pStr = "[" + _(path).map(format).join("][") + "]";
                        result.push(pStr);
                    });
                    return result;
                }
                var noneCalled = prepare(function (pass, fail) {});
                var passCalled = prepare(function (pass, fail) {
                    pass(false); // argument doesn't matter here (only same as in bothCalled)
                });
                var failCalled = prepare(function (pass, fail) {
                    fail(true); // argument doesn't matter here (only same as in bothCalled)
                });
                var bothCalled = prepare(function (pass, fail) {
                    pass(false); // arguments don't matter here (but see above)
                    fail(true);
                });

                // let's use the 'expect' syntax, to avoid any confusion
                // about which is supposed to be the proper subset and which the superset
                expect(noneCalled).toBeProperSubsetOf(passCalled, "noneCalled \\ passCalled");
                expect(noneCalled).toBeProperSubsetOf(failCalled, "noneCalled \\ failCalled");
                expect(noneCalled).toBeProperSubsetOf(bothCalled, "noneCalled \\ bothCalled");
                expect(passCalled).toBeProperSubsetOf(bothCalled, "passCalled \\ bothCalled");
                expect(failCalled).toBeProperSubsetOf(bothCalled, "failCalled \\ bothCalled");

                // TODO: there's something seriously wrong with buster's match!!
                var a = {}, b = {}, c = {}, d = {};
                assert.match({a: a, c: c, d: d}, {a: a, b: b}); // passes
                assert.match({a: a, b: b}, {a: a, c: c, d: d}); // passes, too!
            }
        }
    });

}(this.h, this.util, this.buster, this.referee, this.lodash));