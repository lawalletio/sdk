const { Identity } = require('../../dist/esm/exports/index.js');

const identity = new Identity('3748b5a01edca05ae9f7dd434679eb768193aa27262024ae89add65cdccc1965');

identity.fetch().then((res) => {
  console.log(res);
});
