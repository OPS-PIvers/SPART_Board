console.log(
  process.env.TEST_VAR === undefined ? 'undefined' : `"${process.env.TEST_VAR}"`
);
