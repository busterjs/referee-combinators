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
	    'expected and actual': function() {
		var actual = combinators.assert.equals(42)
		refute.exception(function() {
		    actual(42);
		});
		assert.exception(function() {
		    actual(100);
		});
	    },

	    'only actual': function() {
		var actual = combinators.assert.isTrue();
		refute.exception(function() {
		    actual(true);
		});
		assert.exception(function() {
		    actual(false);
		});
	    }
	    
	}
    })

})(this.referee, this.buster);
