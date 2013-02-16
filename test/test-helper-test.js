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

            "creates tests for each invocation of callbacks 'pass' and 'fail'": function () {
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
                    pass(false); // TODO: argument should matter here - but it does
                });
                var failCalled = prepare(function (pass, fail) {
                    fail(true); // TODO: argument should matter here - but it does
                });
                var bothCalled = prepare(function (pass, fail) {
                    pass(false); // TODO: argument should matter here - but it does
                    fail(true); // TODO: argument should matter here - but it does
                });

                // TODO: there's something seriously wrong with buster's match!!
                var a = {}, b = {}, c = {}, d = {};
                assert.match({a: a, c: c, d: d}, {a: a, b: b}); // passes
                assert.match({a: a, b: b}, {a: a, c: c, d: d}); // passes, too!

                assert.equals(_.difference(noneCalled, passCalled), [],
                    "noneCalled's keys should be all in passCalled's");
                refute.equals(_.difference(passCalled, noneCalled), [],
                    "passCalled's keys should be more than noneCalled's");

                /*
                assert.match(noneCalled, passCalled,
                    "noneCalled's keys should be subset of passCalled's");
                assert.match(noneCalled, failCalled,
                    "noneCalled's keys should be subset of passCalled's");
                assert.match(noneCalled, bothCalled,
                    "noneCalled's keys should be subset of bothCalled's");
                assert.match(passCalled, bothCalled,
                    "passCalled's keys should be subset of bothCalled's");
                refute.match(failCalled, bothCalled,
                    "failCalled's keys should be subset of bothCalled's");
                */
            }
        }
    });

}(this.testHelper, this.util, this.buster, this.referee, this.lodash));