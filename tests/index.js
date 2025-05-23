// Test Runner for IoTBay Tests
console.log("\n📋 IoTBay Test Suite Runner\n============================");

// List of test modules to run with proper paths
const testModules = [
  { name: "Access Log Basic Test", module: "./tests/access-log.test.js" },
  { name: "Access Log Flow Test", module: "./tests/access-log-flow.test.js" },
  // Add more test files here as they are created
];

// Run tests one by one using child_process for isolation
const { execSync } = require("child_process");

// Run tests sequentially
function runTests() {
  console.log(`Found ${testModules.length} test files to run.\n`);

  for (const [index, test] of testModules.entries()) {
    console.log(`\n[${index + 1}/${testModules.length}] Running: ${test.name}`);
    console.log("--------------------------------------------------");

    try {
      // Run each test in a separate process for isolation
      const result = execSync(`node ${test.module}`, {
        stdio: "inherit",
        encoding: "utf-8",
      });

      // Small delay between tests
      if (index < testModules.length - 1) {
        console.log("\n");
      }
    } catch (error) {
      console.error(
        `\n❌ Test "${test.name}" failed with exit code ${error.status}`
      );
    }
  }

  console.log("\n============================");
  console.log("✅ All tests completed!");
}

// Start the test execution
try {
  runTests();
} catch (err) {
  console.error("❌ Test runner failed:", err);
  process.exit(1);
}
