var mysql = require('mysql');
var poolCluster = mysql.createPoolCluster();

/*poolCluster.add('WRITE', {
  host : process.env.HOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});*/

poolCluster.add('READ', {
  host : process.env.HOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5,
  /*ssl        : false,
  secureAuth : {
    key: process.env.caching_sha2_pubkey
  }*/
});

module.exports = poolCluster