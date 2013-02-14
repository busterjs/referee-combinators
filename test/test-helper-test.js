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

    buster.assertions.add('isFunctionOrObject', {
        assert: function (actual) {
            return _.isFunction(actual) || _.isObject(actual);
        },
        assertMessage: "${2}Expected ${1}${0} to be either function or object",
        refuteMessage: "${2}Expected ${1}${0} to be neither function nor object",
        expectation: "toBeFunctionOrObject",
        values: function (thing, path, message) {
            return [thing, path ? path + ": " : "", message ? message + " " : ""];
        }
    });

    // TODO: move this to util.js and write tests for it in util-test.js
    function forOwnRecursive(object, callback, thisArg, path, depth) {
        callback = callback || _.identity;
        thisArg = thisArg || this;
        path = path || "";
        depth = depth || 0;
        return _.forOwn(object, function (v, k, o) {
            var path1LevelDeeper = path + "[" + k + "]";
            buster.log(path1LevelDeeper);
            if (depth > 3) {
                throw new Error("debug @" + path1LevelDeeper);
            }
            callback.call(this, v, k, o, path1LevelDeeper);
            // TODO: check return value of callback and stop when _.forOwn would
            // TODO: don't follow circularities
            forOwnRecursive(v, callback, this, path1LevelDeeper, depth + 1);
        }, thisArg);
    }

    buster.testCase("test-helper", {

        "makeTests": { // TODO: a lot more...

            "calls callback at least once with two function args": function () {
                var cb = this.spy();
                makeTests('isTrue', [], cb);

                assert.greater(cb.callCount, 1, "callback.callCount");
                assert.isFunction(cb.args[0][0], "1st arg to callback on 1st call");
                assert.isFunction(cb.args[0][1], "2nd arg to callback on 1st call");
            },

            "returns object with" : {
                "some properties": function () {
                    var actual = makeTests('isTrue', [], function () {});
                    assert.isObject(actual);
                    assert.greater(_.keys(actual).length, 0, "# of props");
                },

                "own props either functions or objects of which the same is true": function () {
                    var actual = makeTests('isTrue', [], function (pass, fail) {});
                    //actual.whuteva = { f: function () {}, two: { three : 3} };

                    assert.isObject(actual);
                    forOwnRecursive(actual, function (v, k, o, path) {
                        assert.isFunctionOrObject(v, path);
                    }, this, "makeTests(...)");
                }
            }
        }
    });

}(this.testHelper, this.util, this.buster, this.referee, this.lodash));