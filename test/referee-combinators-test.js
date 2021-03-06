/*jslint maxlen:100 */
(function (referee, buster, _, when, testHelper) {
    if (typeof require === "function" && typeof module === "object") {
        referee = require("../lib/referee-combinators");
        _ = require("lodash");
        testHelper = require("./test-helper");

        //// This is a temporary workaround for the development-environment:
        //buster = require("buster-node");
        //var B = require("buster");
        //buster.format = { ascii: B.format.ascii.bind(B) };
        // remove the above and uncomment the following once workaround is obsolete:
        buster = require("buster");
    }

    var combinators = referee.combinators;
    var assert = buster.assert;
    var refute = buster.refute;
    var makeTests = testHelper.makeTests;

    function addCustomAssertions() {
        referee.add("equalsTwoWithCoercion", {
            assert: function (actual) {
                /*jslint eqeq: true*/ // only in current scope
                return actual == 2;  // we DO want coercion here
            },
            assertMessage: "${0} was expected to equal 2",
            refuteMessage: "${0} was not expected to equal 2"
        });
    }

    buster.testCase("combinator basics", {
        "referee has combinators" : function () {
            assert.defined(combinators);
        },
        "combinators have assertions": function () {
            assert.defined(combinators.assert.defined);
        },
        "combinators have raw assertions": function () {
            assert.defined(combinators.assert.defined.raw);
        },
        "armed combinators have raw": function () {
            assert.defined(combinators.assert.defined("raw").raw);
        },

        "combinators raw assertions can pass": function () {
            return combinators.assert.defined.raw()("defined").then(
                function (res) {
                    buster.assert.defined(res);
                }
            );
        },
        "combinators raw assertions can fail": function () {
            return combinators.assert.defined.raw()(undefined).then(
                function (res) {
                    buster.fail("should not be resolved");
                },
                function (res) {
                    buster.assert.defined(res);
                }
            );
        }
    });

    buster.testCase("check normal assertions", {
        "built-in": {
            "isTrue": function () {
                assert.isTrue(true, "normal refute.isTrue(true) should pass");
                refute.isTrue(false, "normal refute.isTrue(false) should pass");
                refute.isTrue(1, "normal refute.isTrue(1) should pass");
                refute.isTrue(0, "normal refute.isTrue(0) should pass");
            },
            "//isTrue defines .displayName": function () {
                assert.defined(assert.isTrue.displayName, ".displayName");
            },
            "//equals coercing or not? (fails with buster <= 0.6.12)": function () {
                var a = 42;
                var e = "42";
                var refuteEquals = combinators.refute.equals(e);

                // will fail with buster <= 0.6.12 (where `equals` does coercion):
                refute.equals(e, a, "normal equals should NOT do coercion");

                // based on `referee.equals` (no coercion) so this will pass:
                refuteEquals(a, "derived equals should also NOT do coercion");
            }
        }
    });

    var ca = combinators.assert;
    var cr = combinators.refute;

    // need to add them here (outside test case),
    // if it's done in setUp the custom assertion is not found - why?
    addCustomAssertions();

    function message(assertion, actual, messageAssertion) {
        return function () {
            return assertion.raw(actual).then(
                buster.fail,
                function (message) {
                    var result = messageAssertion.raw(message);
                    return result.then(
                        function (res) {
                            return buster.assert.defined(res);
                        },
                        function (res) {
                            buster.refute(res);
                        }
                    );
                }
            );
        };
    }


    buster.testCase("compose", {
        ' - two primitive asserts': makeTests('compose', [ca.greater(2), ca.less(5)],
                                              function (pass, fail) {
                                                  pass(4);                    
                                                  fail(1);
                                                  fail(5);
                                              }),
        ' - one + two primitive asserts': makeTests('compose', [ca.greater(2), 
                                                             ca.compose(cr.equals(4), 
                                                                     ca.less(6))],
                                              function (pass, fail) {
                                                  pass(3);                    
                                                  pass(5);                    
                                                  fail(1);
                                                  fail(7);
                                                  fail(4);
                                              }),

        'messages' : {
            'first assert fails with expected in message' : message(
                ca.compose(ca.greater(4), ca.less(8)),
                2,
                ca.contains(4)
            ),
            'first assert fails with actual in message' : message(
                ca.compose(ca.greater(4), ca.less(8)),
                2,
                ca.contains(2)
            ),
            'second expected not in message when first assert fails' : message(
                ca.compose(ca.greater(4), ca.less(8)),
                2, 
                cr.contains(8)
            ),
            'second assert fails with expected in message' : message(
                ca.compose(ca.greater(4), ca.less(8)),
                9,
                ca.contains(8)
            ),
            'second assert fails with actual in message' : message(
                ca.compose(ca.greater(4), ca.less(8)),
                9,
                ca.contains(9)
            ),
            'first expected not in message when second assert fails' : message(
                ca.compose(ca.greater(4), ca.less(8)),
                9,
                cr.contains(4)
            ),
            'third expected in message when third fails' : message(
                ca.compose(ca.greater(2), 
                        ca.compose(cr.equals(4), 
                                ca.less(6))),
                10,
                ca.contains(6)
            )
        }
    });

    buster.testCase("choice", {
        ' - two primitive asserts': makeTests('choice', [ca.equals(3), ca.equals(5)],
                                              function (pass, fail) {
                                                  pass(3);                    
                                                  pass(5);
                                                  fail(1);
                                                  fail(4);
                                                  fail(6);
                                                  fail(8);
                                              }),
        ' - three primitive asserts': makeTests('choice', [ca.choice(ca.equals(3), ca.equals(8)), ca.equals(5)],
                                              function (pass, fail) {
                                                  pass(3);                    
                                                  pass(5);
                                                  pass(8);
                                                  fail(1);
                                                  fail(4);
                                                  fail(6);
                                              }),
        'messages' : {
            'first, second expected  and actual in message on fail' : message(
                ca.choice(ca.equals(4), ca.equals(8)),
                2,
                ca.compose(ca.contains(8), 
                        ca.compose(ca.contains(4), ca.contains(2)))
            ),
            'first, second, third expected and actual in message on fail' : message(
                ca.choice(ca.choice(ca.equals(4), ca.equals(8)), ca.equals(5)),
                2,
                ca.compose(ca.contains(8), 
                        ca.compose(ca.contains(4), 
                                ca.compose(ca.contains(5), 
                                        ca.contains(2))))
            )

        },


    })


    var EOF = cr.equals([]);
    buster.testCase("repeat", {
        ' - with next': makeTests('repeat', [ca.next(ca.equals(3)), EOF],
                                            function (pass, fail) {
                                                pass([3]);                    
                                                pass([3, 3, 3]);
                                                pass([]);//0 or more
                                                fail([1, 2, 3]);
                                                fail([3, 2, 1]);
                                              })
    })

    buster.testCase("next", {
        ' - checks first element': makeTests('next', [ca.equals(3)],
                                            function (pass, fail) {
                                                pass([3]);                    
                                                pass([3, 4, 5]);
                                                fail([1, 2, 3]);
                                                fail([2]);
                                                fail([]);
                                              }),

        ' - checks passes tail': makeTests('compose', [ca.next(ca.equals(3)), ca.equals([4,5])],
                                            function (pass, fail) {
                                                pass([3, 4, 5]);                    
                                                fail([2]);
                                                fail([]);
                                              }),
        'messages' : {
            'expected and head in message on fail' : message(
                ca.next(ca.equals(4)),
                [2],
                ca.compose(ca.contains(4), ca.contains(2))
            )
        }
    })

    buster.testCase("combinator ('partial') assertions", {

        '//- TODO: all tests should also pass with `referee.throwOnFailure = false`': function () {
        },

        'derived from custom': {
            //setUp: addCustomAssertions, // not working - why ?
            'binary': makeTests('equalsTwoWithCoercion', [], function (pass, fail) {
                pass(2);
                pass("2");
                fail(8);
            })
        },

        'derived from built-in unary': {
            'isTrue': makeTests('isTrue', [], function (pass, fail) {
                pass(true);
                fail(false);
                fail("false");
                fail("true");
                fail(0);
                fail(1);
            })
        },

        'derived from built-in binary': {
            'equals': makeTests('equals', [42], function (pass, fail) {
                pass(42);
                fail("42"); // ATTENTION: old equals from buster <= 0.6.12 DID have coercion!
                fail(100);
            }),
            'greater': makeTests('greater', [23], function (pass, fail) {
                pass(4711);
                pass(24);
                fail(23);
                fail(0);
                fail(-1);
            })
        },

        'extension -': {
            

            'attr 1 level': makeTests('attr', ['key', ca.equals('value')],
                function (pass, fail) {
                    pass({key: 'value'});   // "pass for equal attribute" : 
                    fail({key: 'other'});   // "fail for unequal attribute" : 
                    fail({});   // "fail for missing attribute" :
                    pass({key: 'value', other: 'ignored'}); // "pass for equal and other value"
                }),
            'attr 2 levels': makeTests('attr', ['key0', ca.attr('key1', ca.equals('value'))],
                function (pass, fail) {
                    pass({key0: {key1: 'value'}});    // "pass for equal value"
                    fail({key0: {key1: 'other'}});    // "fail for unequal value
                    fail({key1: {key0: 'value'}});    // "fail for non-existent path
                    fail({key0: {}});  // "fail for partial path" : 
                }),
            'attr message': {
                'contains failing attribute': message(
                    ca.attr('key', ca.equals('value')),
                    {'key': 'other value'},
                    ca.contains('key')
                ),
                'contains failing actual': message(
                    ca.attr('key', ca.equals('value')),
                    {'key': 'other value'},
                    ca.contains('other value')
                ),
                'contains failing expected': message(
                    ca.attr('key', ca.equals('value')),
                    {'key': 'other value'},
                    ca.contains('value')
                ),
                'contains assert for assertions': message(
                    ca.attr('key', ca.equals('value')),
                    {'key': 'other value'},
                    ca.contains('assert')
                ),
                'contains assertion': message(
                    ca.attr('key', ca.equals('value')),
                    {'key': 'other value'},
                    ca.contains('equals')
                )
            },

            /*
             * Structure assert is merely syntactic sugar for other assert combinators
             */
            'structure': {
                '1 level': makeTests('structure', [{key: 'value'}],
                    function (pass, fail) {
                        pass({key: 'value'});   // "pass for equal attribute" : 
                        fail({key: 'other'});   // "fail for unequal attribute" : 
                        fail({});   // "fail for missing attribute" :
                        pass({key: 'value', other: 'ignored'}); // "pass for equal and other value"
                    }),
                '2 levels': makeTests('structure', [{'key0': {'key1': 'value'}}],
                    function (pass, fail) {
                        pass({key0: {key1: 'value'}});    // "pass for equal value"
                        fail({key0: {key1: 'other'}});    // "fail for unequal value
                        fail({key1: {key0: 'value'}});    // "fail for non-existent path
                        fail({key0: {}});  // "fail for partial path" : 
                    }),
                'explicit assert for attribute': makeTests('structure', [{enabled: ca.isTrue()}],
                    function (pass, fail) {
                        pass({enabled: true}); // "pass for true"
                        fail({enabled: false}); // "fail for false"
                        fail({enabled: undefined}); // "fail for undefined"
                        fail({}); // "fail for missin"
                    })
            },
            'structure message':{
                "key on first level in failure message" : message(
                    ca.structure({'key':'value'}),
                    {'key': 'other value'},
                    ca.contains('key')
                ),
                "key on second level in failure message" : message(
                    ca.structure({'key': {'child': 'value'}}),
                    {'key': {'child': 'other value'}},
                    ca.contains('child')
                )
            }
        }
    });

}(this.referee, this.buster, this._, this.when, this.testHelper));
