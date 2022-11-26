const mysql = require('mysql');

const connection = mysql.createPool({
  host: process.env.PCHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.RWPORT,
  connectionLimit: 20
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