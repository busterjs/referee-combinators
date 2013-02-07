(function(referee, buster) {
    if (typeof require === "function" && typeof module === "object") {
        referee = require("../lib/referee-combinators");
        buster = require("buster");
    }
    var combinators = referee.combinators;
    var assert = buster.assert;
    var refute = buster.refute;
    

    buster.testCase('partial', {
	'assert': {
	    'expected and actual': {
		"pass":function() {
		    var actual = combinators.assert.equals(42)
		    refute.exception(function() {
			actual(42);
		    });
		},
		"fail": function() {
		    assert.exception(function() {
			actual(100);
		    });
		}
	    },
	    'only actual': {
		'pass': function() {
		    var actual = combinators.assert.isTrue();
		    refute.exception(function() {
			actual(true);
		    });
		},
		'fail': function() {
		    assert.exception(function() {
			actual(false);
		    });
		}
	    }
	},
	'refute': {
	    'expected and actual': {
		"pass":function() {
		    var actual = combinators.refute.equals(42)
		    refute.exception(function() {
			actual(100);
		    });
		},
		"fail": function() {
		    assert.exception(function() {
			actual(42);
		    });
		}
	    },
	    'only actual': {
		'pass': function() {
		    var actual = combinators.refute.isTrue();
		    refute.exception(function() {
			actual(false);
		    });
		},
		'fail': function() {
		    assert.exception(function() {
			actual(true);
		    });
		}
	    }
	}
    })

})(this.referee, this.buster);
