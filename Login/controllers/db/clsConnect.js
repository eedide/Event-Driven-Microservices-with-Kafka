var mysql = require('mysql');
var poolCluster = mysql.createPoolCluster();

poolCluster.add('WRITE', {
  host : process.env.HOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});

poolCluster.add('READ', {
  host : process.env.HOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});

/*poolCluster.add('READ2', {
  host : process.env.PCHOST,
  port : process.env.ROPORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});*/

module.exports = poolCluster