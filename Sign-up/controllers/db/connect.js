const mysql = require('mysql');
const fs = require('fs');

// const connection = mysql.createPool({
//   host: process.env.HOST,
//   user: process.env.USER,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   port: process.env.PORT,
//   connectionLimit: 20
// });

const connection = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.RWPORT,
  connectionLimit: 20,
  /*ssl        : false,
  secureAuth : {
    key: process.env.caching_sha2_pubkey
  }*/
});

/*var del = connection._protocol._delegateError;
connection._protocol._delegateError = function(err, sequence){
  if (err.fatal) {
    console.trace('fatal error: ' + err.message);
  }
  return del.call(this, err, sequence);
};*/

//connection.connect();

module.exports = connection