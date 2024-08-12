const { Identity } = require('../../dist/esm/exports');

const identity = new Identity('3748b5a01edca05ae9f7dd434679eb768193aa27262024ae89add65cdccc1965');

setTimeout(() => {
  console.log(identity.npub);
  console.log(identity.lnurlpData);
}, 2500);
