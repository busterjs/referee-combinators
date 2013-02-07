exports["Browser"] = {
    libs: [
        "node_modules/lodash/lodash.js",
        "node_modules/referee/lib/referee.js",
    ],
    sources: [
        "lib/referee-combinators.js",

    ],
    testHelpers: ["node_modules/referee/test/test-helper.js"],
    tests: ["test/*-test.js"]
};

exports["Node"] = {
    environment: "node",
    testHelpers: ["node_modules/referee/test/test-helper.js"],
    tests: ["test/*-test.js"]
};
