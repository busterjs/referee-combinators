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

    buster.testCase("test-helper", {

        "makeTests": {

            "returns object with" : {
                "some properties": function () {
                    var actual = makeTests('isTrue', [], function () {});
                    assert.isObject(actual);
                    assert.greater(_.keys(actual).length, 0, "# of props");
                },

                "own props either functions or objects of which the same is true": function () {
                    var actual = makeTests('isTrue', [], function (pass, fail) {});
                    //actual.whuteva = { f: function () {}, two: { three : 3} };
                    function recAsserts(o, path) {
                        _.forOwn(o, function (v, k) {
                            var myPath = path + "['" + k + "']";
                            assert.isFunctionOrObject(v, myPath);
                            if (_.isObject(v)) { // make sure we really pass only objects
                                recAsserts(v, myPath);
                            }
                        });
                        return true;
                    }

                    assert.isObject(actual);
                    recAsserts(actual, "makeTests(...)");
                }
            }
        }
    });

}(this.testHelper, this.util, this.buster, this.referee, this.lodash));