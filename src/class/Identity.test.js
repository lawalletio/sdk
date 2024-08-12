const { Identity } = require('../../dist/esm/exports/index.js');

const identity = new Identity('cee287bb0990a8ecbd1dee7ee7f938200908a5c8aa804b3bdeaed88effb55547');

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

async function test() {
  identity.fetchProfile().then((res) => {
    console.log(res);
  });

  // await sleep(10000);
}

test();

// const wallet = new Wallet({
//   signer: new NDKPrivateKeySigner('..'),
// });

// wallet.fetch().then((res) => {
//   console.log(res);

//   console.log(wallet.lnurlp.lnurlpData);
// });
