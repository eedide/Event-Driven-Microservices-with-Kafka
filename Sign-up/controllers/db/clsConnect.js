var mysql = require('mysql');
var poolCluster = mysql.createPoolCluster();

poolCluster.add('READ', {
  host : process.env.HOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});

poolCluster.add('WRITE',{
  host : process.env.HOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});



/*poolCluster.add('RW1', {
  host : process.env.RWHOST1,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5,*/
  /*ssl        : false,
  secureAuth : {
    key: process.env.caching_sha2_pubkey
  }*/
//});

/*poolCluster.add('RW2', {
  host : process.env.RWHOST2,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5,*/
  //ssl        : false,
  //secureAuth : {
    //key: process.env.caching_sha2_pubkey
  //}
//});

/*poolCluster.add('RW3', {
  host : process.env.RWHOST3,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5,*/
  //ssl        : false,
  //secureAuth : {
    //key: process.env.caching_sha2_pubkey
  //}
//});

/*poolCluster.add('READ', {
  host : process.env.ROHOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5,*/
  //ssl        : false,
  //secureAuth : {
    //key: process.env.caching_sha2_pubkey
  //}
//});

/*poolCluster.add('READ2', {
  host : process.env.ROHOST2,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});

poolCluster.add('READ3', {
  host : process.env.ROHOST3,
  port : process.env.PORT,
  database: process.env.DATABASE,
  user : process.env.USER,
  password : process.env.PASSWORD,
  charset : process.env.charset,
  restoreNodeTimeout : 5
});*/

module.exports = poolCluster