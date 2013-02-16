/*jslint maxlen:100 */
/*jslint regexp:true*/ // allow . and [^...] in regexps 
(function (testHelper, util, buster, referee, _) {
    if (typeof require === "function" && typeof module === "object") {
        testHelper = require("./test-helper");
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
    var makeTests = testHelper.makeTests;

    buster.assertions.add('isPlainObjectOrFunc', {
        assert: function (actual) {
            return _.isPlainObject(actual) || _.isFunction(actual);
        },
        assertMessage: "${2}Expected ${0} to be either plain object or function but is ${1}",
        refuteMessage: "${2}Expected ${0} to be neither plain function nor object but is ${1}",
        expectation: "toBeObjectOrFunc",
        values: function (thing, message) {
            /*jslint white:true*/
            var type = _.isArray(thing) ? "array" :
                       _.isRegExp(thing) ? "regexp" :
                       _.isNull(thing) ? "null" :
                       typeof thing;
            return [thing, type, message ? message + ": " : ""];
        }
    });

    buster.assertions.add('isProperSubsetOf', {
        assert: function (subset, superset) {
            var subMinusSuper = _.difference(subset, superset);
            var superMinusSub = _.difference(superset, subset);
            return _.isEmpty(subMinusSuper) && !_.isEmpty(superMinusSub);
        },
        assertMessage: "${2}Expected\n\n${0}\n\nto be a proper subset of\n\n${1}\n\nBUT ${3}",
        refuteMessage: "${2}Expected\n\n${0}\n\nNOT to be a proper subset of\n\n${1}\n\nBUT it is!",
        expectation: "toBeProperSubsetOf",
        values: function (subset, superset, message) {
            // TODO: what a pity that we have to do the work from `assert` again in `values`...
            var reason;
            var subMinusSuper = _.difference(subset, superset);
            var superMinusSub = _.difference(superset, subset);
            if (!_.isEmpty(subMinusSuper)) {
                if (_.isEmpty(superMinusSub)) {
                    reason = "it is just the other way round."
                        + " These are in the former but not in the latter: "
                        + format(subMinusSuper);
                } else {
                    reason = "some in the former are missing in the latter: "
                        + format(subMinusSuper);
                }
            } else { // subMinusSuper IS empty
                if (_.isEmpty(superMinusSub)) {
                    reason = "they are equal (as sets)";
                /*
                } else {
                    throw new Error("should not happen");
                    // It does happen - we're being called even
                    // if assert returned true (or refute returned false)
                    // This means that we're doing even more unnecessary work... :(
                */
                }
            }
            return [subset, superset, message ? message + ": " : "", reason];
        }
    });

    buster.testCase("test-helper", {

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
                        return _.isFunction(v) ? 23 : v;
                    });
                    */
                    // no _.partialRight in lodash !?!
                    function partialRight(f) {
                        var rightArgs = _.tail(_.toArray(arguments));
                        return function () {
                            var leftArgs = _.toArray(arguments);
                            return f.apply(this, leftArgs.concat(rightArgs));
                        };
                    }
                    var walk = partialRight(_.reduce, _.result); // _.result(o,k) === o[k]

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

}(this.testHelper, this.util, this.buster, this.referee, this.lodash));