const { Identity } = require('../../dist/esm/exports/index.js');

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

function test() {
  const onFetch = (data) => {
    console.log(data);
  };

  const identity = new Identity({
    pubkey: 'cee287bb0990a8ecbd1dee7ee7f938200908a5c8aa804b3bdeaed88effb55547',
    onFetch,
  });
}

test();
