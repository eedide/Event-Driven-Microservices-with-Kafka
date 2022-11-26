require("dotenv").config()
//const connection = require("./db/connect")
const poolCluster = require("./db/clsConnect")
const bcrypt = require('bcryptjs');
var promise = require('promise');
const { reject, resolve } = require("promise");
//var dateTime = require('node-datetime');
const jwt = require('jsonwebtoken')

///////////GET CURRENT DATETIME/////////////////
//var dt = dateTime.create();
//var CurrentDateTime = dt.format('Y-m-d H:M:S');
////////////////////////////////////////////////

const Is_Account_Under_Suspension = (req, res) => {
    return new promise((resolve, reject) => {
        const query = "SELECT Login_id, Suspension_reason FROM suspended_users WHERE email = ?";
        poolCluster.getConnection("READ", function (err, connection) { 
            if (err) {
                connection.release();
                //log error
                return reject({
                    sus_status : "failed",
                    sus_status_msg : ""
                })
            } else {
                connection.query(query, [ req.body.email ], function(err, results) {
                    if(err){
                        connection.release();
                        //log error
                        return reject({
                            sus_status : "failed",
                            sus_status_msg : ""
                        })
                    }
                    if (results.length < 1){
                        connection.release();
                        return resolve({
                            sus_status : "NOT_SUSPENDED",
                            sus_status_msg : ""
                        })
                    }
                    const user = results[0];
        
                    if(user.Login_id && user.Suspension_reason == "MULTIPLE_LOGIN_FAILURE"){
                        connection.release();
                        return resolve({
                            sus_status : "SUSPENDED",
                            sus_status_msg : "Multiple_Login_Failure"
                        })
                    }
                    connection.release();
                    return resolve({
                        sus_status : "NOT_SUSPENDED",
                        sus_status_msg : ""
                    })
                });
            }
        });
    })
}

const Time_Elapsed_Since_Suspended = (email) => {
    return new promise((resolve, reject) => {
        const query = "SELECT TIMESTAMPDIFF(SECOND,Date_of_suspension,NOW()) as time_elapsed FROM suspended_users WHERE email = ?";
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release();
                //log error
                return reject({
                    Time_Elapsed : "failed",
                    Elapsed_msg : ""
                })
            } else {
                connection.query(query, [ email ], function(err, results) {
                    if(err){
                        connection.release();
                        //log error
                        return reject({
                            Time_Elapsed : "failed",
                            Elapsed_msg : ""
                        })
                    }
                    if (results.length < 1){
                        connection.release();
                        return resolve({
                            Time_Elapsed : "",
                            Elapsed_msg : ""
                        })
                    }
                    const user = results[0];
                    connection.release();
                    return resolve({
                        Time_Elapsed : user.time_elapsed,
                        Elapsed_msg : ""
                    })
                });
            }
        });
    })
}

const Delete_User_From_Suspended_Users = (email) => {
    return new promise((resolve, reject) => {
        const query = "DELETE from suspended_users WHERE email = ?";
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release();
                //log error
                return reject({
                    SUrs_del_status : "failed",
                    SUrs_del_status_msg : ""
                })
            } else {
                connection.query(query, [ email ], function(err, results) {
                    if(err){
                        connection.release();
                        //log error
                        return reject({
                            SUrs_del_status : "failed",
                            SUrs_del_status_msg : ""
                        })
                    }
                    if (results.affectedRows < 1){
                        connection.release();
                        return resolve({
                            SUrs_del_status : "",
                            SUrs_del_status_msg : ""
                        })
                    }
                    connection.release();
                    return resolve({
                        SUrs_del_status : "success",
                        SUrs_del_status_msg : ""
                    })
                });
            }
        });
    })
}

const Restore_User_Status_To_Active = (email) => {
    return new promise((resolve, reject) => {
        const query = "UPDATE users SET user_status='ACTIVE' WHERE email=?";
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release();
                //log error
                return reject({
                    SUrs_update_status : "failed",
                    SUrs_update_status_msg : ""
                })
            } else {
                connection.query(query, [email] , function(err, results) {
                    if(err){
                        connection.release();
                        //log error here
                        return reject({
                            SUrs_update_status : "failed",
                            SUrs_update_status_msg : ""
                        })
                    }
                    if (results.affectedRows < 1){
                        connection.release();
                        return reject({
                            SUrs_update_status : "failed",
                            SUrs_update_status_msg : ""
                        })
                    }
                    connection.release();
                    return resolve({
                        SUrs_update_status : "success",
                        SUrs_update_status_msg : ""
                    })
                });
            }
        });
    });
}

const User_Last_Login_Attempt = (email) => {
    var loginID = 0;
    return new promise((resolve, reject) => {
        /// SELECT latest login ID from Login table for this user ///
        const query = "select Login_ID, date from login where email = ? ORDER BY date DESC LIMIT 1";
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release();
                //log error
                return reject({
                    Failed_Login_ID : "failed",
                    FailedIDmsg : ""
                })
            } else {
                connection.query(query, [ email ], function(err, results) {
                    if(err){
                        //log error here
                        return reject({
                            Failed_Login_ID: "failed",
                            FailedIDmsg: ""
                        })
                    }
                    if (results.length < 1){
                        //it means loginID hasn't been assigned, therefore the initial value is fine
                    }else{
                        loginID = results[0].Login_ID;
                        //console.log(`result is: ${loginID}`)
                    }

                    /*----------------------------------------------*/
                    //SELECT latest login ID from failed_login_attempt table
                    const sql_query = "select Login_ID from failed_login_attempt where Login_ID = ?";
                    connection.query(sql_query, [ loginID ], function(err, results) {
                        if(err){
                            //log error here
                            return reject({
                                Failed_Login_ID: "failed",
                                FailedIDmsg: ""
                            })
                        }
                        if (results.length < 1){
                            //if latest login ID does not exist in failed_login_attempt table
                            return resolve({
                                Failed_Login_ID: 0,
                                FailedIDmsg: ""
                            })
                        }else{//latest login ID does exist
                            return resolve({
                                Failed_Login_ID: results[0].Login_ID,
                                FailedIDmsg: ""
                            })
                        }
                    });
                    /*----------------------------------------------*/
                });
            }
        });
    })
}

const Delete_User_Last_Failed_LoginID = (Failed_LoginID) => {
    return new promise((resolve, reject) => {
        const query = "DELETE from failed_login_attempt WHERE Login_ID = ?";
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                console.log(`error1: ${err}`)
                connection.release();
                //log error
                return reject({
                    Delete_Status : "failed",
                    Delete_Status_msg : ""
                })
            } else {
                connection.query(query, [ Failed_LoginID ], function(err, results) {
                    if(err){
                        console.log(`error2: ${err}`)
                        connection.release();
                        //log error here
                        return reject({
                            Delete_Status: "failed",
                            Delete_Status_msg: ""
                        })
                    }
                    if (results.affectedRows < 1){
                        connection.release();
                        return resolve({
                            Delete_Status: "",
                            Delete_Status_msg: ""
                        });
                    }

                    connection.release();
                    return resolve({
                        Delete_Status: "success",
                        Delete_Status_msg : ""
                    })
                });
            }
        });
    });
}

const Read_Last_Failure_Time = (LoginID) => {
    return new promise((resolve, reject) => {
        const query = "select date from failed_login_attempt where Login_ID = ?";
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release();
                //log error
                return reject({
                    Last_Failure_Time : "failed",
                    LFT_msg : ""
                })
            } else {
                connection.query(query, [ LoginID ], function(err, results) {
                    if(err){
                        connection.release();
                        //log error here
                        return reject({
                            Last_Failure_Time: "failed",
                            LFT_msg: ""
                        })
                    }
                    if (results.length < 1){
                        connection.release();
                        return resolve({
                            Last_Failure_Time : "",
                            LFT_msg : ""
                        });
                    }
                    const user = results[0];
                    connection.release();
                    return resolve({
                        Last_Failure_Time : user.date,
                        LFT_msg : ""
                    })
                });
            }
        });
    })
}

const Time_Elasped = (time) => {
    return new promise((resolve, reject) => {
        const query = "SELECT TIMESTAMPDIFF(SECOND,?,NOW()) AS time_elapsed";
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release();
                //log error
                return reject({
                    Time_elapsed : "failed",
                    Time_elapsed_msg : ""
                })
            } else {
                connection.query(query, [ time ], function(err, results) {
                    if(err){
                        connection.release();
                        //log error here
                        return reject({
                            Time_elapsed: "failed",
                            Time_elapsed_msg: ""
                        })
                    }
                    if (results.length < 1){
                        connection.release();
                        return resolve({
                            Time_elapsed : "",
                            Time_elapsed_msg : ""
                        });
                    }
                    const user = results[0];
                    connection.release();
                    return resolve({
                        Time_elapsed : user.time_elapsed,
                        Time_elapsed_msg : ""
                    })
                });
            }
        });
    })
}

const failed_login_attempts_Count = (Failed_LoginID) => {
    return new promise((resolve, reject) => {
        const query = "SELECT COUNT(Failed_Attempts_ID) AS count FROM failed_login_attempt WHERE Login_ID=?"
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release();
                //log error
                return reject({
                    FLACount : "failed",
                    FLACountmsg : ""
                })
            } else {
                connection.query(query, [ Failed_LoginID ], function(err, results) {
                    if(err){
                        connection.release();
                        //log error here
                        return reject({
                            FLACount: "failed",
                            FLACountmsg: ""
                        })
                    }
                    if (results.length < 1){
                        connection.release();
                        return resolve({
                            FLACount : "",
                            FLACountmsg : ""
                        });
                    }
                    const user = results[0];
                    connection.release();
                    return resolve({
                        FLACount : user.count,
                        FLACountmsg : ""
                    })
                });
            }
        });
    })
}

const Suspend_Account = (LoginID, email, reason) => {
    return new promise((resolve, reject) => {
        const query1 = 'INSERT into suspended_users (email,Suspension_reason,Login_id) VALUES ?';
        const values = [
            [email, reason, LoginID]
        ]
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.rollback();
                connection.release();
                //log error
                return reject({
                    status : "failed"
                })
            } else {
                connection.beginTransaction();
                connection.query(query1, [values] , function(err, results) {
                    if(err){
                        connection.rollback();
                        connection.release();
                        //log error here
                        return reject({
                            status : "failed"
                        })
                    }
                });
        
                const query2 = "UPDATE users SET user_status='INACTIVE' WHERE email=?";
                connection.query(query2, [email] , function(err, results) {
                    if(err){
                        connection.rollback();
                        connection.release();
                        //log error here
                        return reject({
                            status : "failed"
                        })
                    }
                    if (results.affectedRows < 1){
                        connection.release();
                        return reject({
                            "status" : "failed"
                        })
                    }
                });
                connection.commit();
                connection.release();
                return resolve({
                    status: "sucess"
                })
            }
        });
    })
}

const Create_New_Login_ID = (email) => {
    return new promise((resolve, reject) => {
        var LoginID;
        const query = 'INSERT into login (email) VALUES ?';
        const values = [
            [email]
        ]
        poolCluster.getConnection("WRITE",function (err, connection) { 
            if (err) {
                connection.release()
                return reject({
                    LoginID : "-1",
                    LoginIDmsg: ""
                })
            } else {
                connection.query(query, [values], cb)
                function cb (err, results) {
                    if(err){
                        connection.release()
                        //log error here
                        return reject({
                            LoginID : "-1",
                            LoginIDmsg: ""
                        })
                    }
                    LoginID = results.insertId;
                    //console.log(`log in id3 is: ${LoginID}`)
                    connection.release()
                    return resolve({
                        LoginID : LoginID,
                        LoginIDmsg: ""
                    })
                }
            }
        });
    })
}

const Confirm_Registration_Status = (email) => {
    return new promise((resolve, reject) => {
        const query = "SELECT user_status from users WHERE email = ?";
        poolCluster.getConnection("READ", function (err, connection) { 
            if (err) {
                connection.release()
                return reject({
                    Reg_status : "failed",
                    Reg_status_msg : ""
                })
            } else {
                connection.query(query, [ email ], function(err, results) {
                    if(err){
                        //log error here
                        return reject({
                            Reg_status : "failed",
                            Reg_status_msg : ""
                        })
                    }
                    if (results.length < 1){
                        return resolve({
                            Reg_status : "failed",
                            Reg_status_msg : ""
                        });
                    }
                    const user = results[0];
        
                    return resolve({
                        Reg_status : user.user_status,
                        Reg_status_msg : ""
                    })
                });
            }
        });
    })
}

const Successfull_login = (email, loginid) => {
    return new promise((resolve, reject) => {
        const query = 'INSERT into successful_login (Login_ID,email) VALUES ?';
        const values = [
            [loginid, email]
        ]
        //console.log(`LoginID = ${loginid}, email = ${email}`)
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release()
                return reject({
                    SL_status: "failed",
                    SL_status_msg: ""
                })
            } else { 
                connection.beginTransaction();
                connection.query(query, [values] , function(err, results) {
                    if(err){
                        //log error here
                        connection.rollback();
                        return reject({
                            SL_status: "failed",
                            SL_status_msg: ""
                        })
                    }
                    //////////////////////////////////////////////////////////////////////////////
                    /* Retreive the Success_ID using Last_Insert_ID*/
                    const Success_ID = results.insertId;
            
                    //UPDATE login table with Success_ID
                    const Updatequery = `UPDATE login SET Success_ID=? WHERE Login_ID=? AND email=?`;
                    /*const Updatevalues = [
                        [Success_ID, loginid, email]
                    ]*/
                    connection.query(Updatequery, [Success_ID, loginid, email], function(err, results2) {
                        if(err){
                            //log error here
                            connection.rollback();
                            return reject({
                                SL_status: "failed",
                                SL_status_msg: ""
                            })
                        }
                        if (results.affectedRows < 1){
                            connection.release();
                            return reject({
                                SL_status : "failed",
                                SL_status_msg: ""
                            })
                        }
                    });
                    //////////////////////////////////////////////////////////////////////////////
                });
                connection.commit()
                return resolve({
                    SL_status: "success",
                    SL_status_msg: ""
                })
            }
        });
    })
}

const Previous_Failed_Logins = (loginid) => {
    return new promise((resolve, reject) => {
        const query = 'DELETE from failed_login_attempt WHERE Login_ID=?';
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release()
                return reject({
                    PFL_status: "failed",
                    PFL_status_msg: ""
                })
            } else {
                connection.query(query, [loginid] , function(err, results) {
                    if(err){
                        connection.release()
                        //log error here
                        return reject({
                            PFL_status: "failed",
                            PFL_status_msg: ""
                        })
                    }
                });
                
                connection.release()
                return resolve({
                    PFL_status: "success",
                    PFL_status_msg: ""
                })
            }
        });
    })
}

const Authenticate_user = (req, res) => {
    return new promise((resolve, reject) => {
        const query = 'SELECT email, password FROM users WHERE email = ?';
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release()
                return reject({
                    Auth_status : "failed",
                    Auth_status_msg : ""
                })
            } else {
                connection.query(query, [ req.body.email ], function(err, results) {
                    if (err){
                        connection.release()
                        //log error here
                        return reject({
                            Auth_status : "failed",
                            Auth_status_msg : ""
                        })
                    }
                    if (results.length < 1){
                        connection.release()
                        return resolve({
                            Auth_status : "failed",
                            Auth_status_msg : "Invalid username_or_password"
                        });
                    }
                    const user = results[0];
        
                    //compare supplied email to db retrieved username to confirm if same
                    if(req.body.email === user.email){
                        //do nothing
                    }else{
                        connection.release()
                        return resolve({
                            Auth_status : "failed",
                            Auth_status_msg : "Invalid_username_or_password1"
                        })
                    }
                        
                    //compare supplied password to db retrieved password to confirm if same  
                    bcrypt.compare(req.body.password, user.password, (err, response) => {
                        if(err){
                            connection.release()
                            return reject({
                                Auth_status : "failed",
                                Auth_status_msg : ""
                            })
                        }
                        //console.log(`entered pw is: ${req.body.password}`)
                        //console.log(`db pw is: ${user.password}`)
                        //console.log(`response is: ${response}`)
                        if(!response){
                            //connection.release()
                            return resolve({
                                Auth_status : "failed",
                                Auth_status_msg : "Invalid_username_or_password2"
                            })
                        }
                        connection.release()
                        return resolve({
                            Auth_status : "success",
                            Auth_status_msg : ""
                        })
                    })
                });
            }
        });
    })
}

const Login_Failed = (login_id, FailureReason) => {
    return new promise((resolve, reject) => {
        const query = "INSERT INTO Failed_Login_Attempt (Login_ID,FailureReason) VALUES ?"
        const values = [
            [login_id, FailureReason]
        ]
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release()
                return reject()
            } else {
                connection.query(query, [values] , function(err, results) {
                    if(err){
                        connection.release()
                        //log error here
                        return reject()
                    }
                    connection.release();
                    return resolve()
                });
            }
        });
    })
}

const userExist = (email) => {
    return new promise((resolve, reject) => {
        const query = 'SELECT email FROM users WHERE email = ?';
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release()
                return reject({
                    user_exist : "failed"
                })
            } else {
                connection.query(query, [ email ], function(err, results) {
                    if (err){
                        connection.release()
                        //log error here
                        return reject({
                            user_exist : "failed"
                        })
                    }
                    if (results.length < 1){
                        connection.release()
                        return resolve({
                            user_exist : "false"
                        });
                    }else{
                        connection.release()
                        return resolve({
                            user_exist : "true"
                        });
                    }
                });
            }
        });
    })
}

const Insert_Authentication_Token_in_db = (authToken, userEmail) => {
    return new promise((resolve, reject) => {
        //insert user in db
        const query = `UPDATE users SET auth_token = ? WHERE email = ?`;
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release()
                return reject({
                    "authTokenInsert" : "failed"
                })
            } else {
                connection.query(query, [authToken, userEmail], function(err, results) {
                    if(err){
                        console.log(err)
                        connection.release()
                        //log error here
                        //console.log(err)
                        return reject({
                            "authTokenInsert" : "failed"
                        })
                    }
                    if (results.affectedRows < 1){
                        connection.release();
                        return reject({
                            "authTokenInsert" : "failed"
                        })
                    }
                    connection.release()
                    return resolve({
                        "authTokenInsert" : "success"
                    })
                });
            }
        });
    })
}

const login = async (req, res) => {
    try{
        //check if user is already logged in
        if(req.session.email){
            //do nothing - cos i don't want to update Auth Token
            //for another 48hrs until the initial Auth Token expires.
            //If not an attacker who is in possesion of a user's
            //credentials will contine to remained logged in by
            //continually reposting user's credential on the login
            //route - which in turns creates a new token that should
            return res.json({
                "status": "success",
                "message": "Already_logged_in"
            })
        }else{
            //------------------------------------------------------------------------------//   
            ////////Find out if the user attempting to login is under suspension/////////////
            const { sus_status, sus_status_msg } = await Is_Account_Under_Suspension(req, res)

            if(sus_status == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

            if(sus_status == "SUSPENDED" && sus_status_msg == "Multiple_Login_Failure"){

                //Check if time elapsed >= 30 mins
                const { Time_Elapsed, Elapsed_msg } = await Time_Elapsed_Since_Suspended(req.body.email)
                console.log(`Time elasped: ${Time_Elapsed}`)

                if(Time_Elapsed >= 1800){//Lift user fron suspension

                    //remove user from suspension table
                    const { SUrs_del_status, SUrs_del_status_msg } = await Delete_User_From_Suspended_Users(req.body.email)

                    if(SUrs_del_status == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

                    //reset user status back to Active
                    const { SUrs_update_status, SUrs_update_status_msg } = await Restore_User_Status_To_Active(req.body.email)

                    //retrieve user's last failed login id
                    const { Failed_Login_ID, FailedIDmsg } = await User_Last_Login_Attempt(req.body.email)
                    
                    //If Failed_Login_ID EXIST, Delete user last failed LoginID
                    if(Failed_Login_ID > 0){
                        const { Delete_Status, Delete_Status_msg } = await Delete_User_Last_Failed_LoginID(Failed_Login_ID)
                        if(Delete_Status == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })
                    }
                }else{//still under suspension - login should fail without reason
                    //log error msg here
                    return res.status(500).json({ "status": "failed", "message": "under_suspension" })
                }
            }
            ////////////////////////////////////////////////////////////////////////////
            //-----------------------------------------------------------------------//


            //-----------------------------------------------------------------------//
            ////Find out if user has surpassed allowed no. of failed login attempts////
            
            //retrieve user's last failed login id
            const { Failed_Login_ID, FailedIDmsg } = await User_Last_Login_Attempt(req.body.email)

            if(Failed_Login_ID == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })
            
            if(Failed_Login_ID > 0){
                //GET last login failure time
                const { Last_Failure_Time, LFT_msg} = await Read_Last_Failure_Time(Failed_Login_ID)
                
                //if this happens, an error occured within Read_Last_Failure_Time
                if(Last_Failure_Time == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

                //Confirm time elapsed b/w now and last login failure time
                const { Time_elapsed, Time_elapsed_msg} = await Time_Elasped(Last_Failure_Time)
                
                if(Time_elapsed == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

                if(Time_elapsed < 5){//possible attack
                    //log error - user tried to Login < 5 secs after previous failed attempt
                    return res.status(500).json({ "status": "failed", "message": "Possible_automated_login" })
                }

                //Retrieve failed Login attempt count
                const { FLACount, FLACountmsg} = await failed_login_attempts_Count(Failed_Login_ID);

                if(FLACount == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

                if(FLACount >= 5) {//If failed Login atempt count >= 5
                    //Check if user is already suspended
                    const { sus_status, sus_status_msg } = await Is_Account_Under_Suspension(req, res)

                    if(sus_status == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

                    if(sus_status == "SUSPENDED" && sus_status_msg == "Multiple_Login_Failure"){
                        //log error - this user is attempting to login while under suspension
                        return res.status(500).json({ "status": "failed", "message": "user_acct_under_suspension" })
                    }else{
                        //suspend account for multiple login failure
                        const { status } = await Suspend_Account(Failed_Login_ID, req.body.email, "MULTIPLE_LOGIN_FAILURE")

                        if(status == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

                        //log error - this user has been suspended
                        return res.status(500).json({ "status": "failed", "message": "user_acct_suspended" })
                    }
                }
            }
            ////////////////////////////////////////////////////////////////////////////
            //-----------------------------------------------------------------------//


            ////////No issues from steps performed so far, start login process//////////
            //Create Login ID
            var LoginID;
            if(Failed_Login_ID > 0) {//if the users last login attempt was not successful
                //use the failed login ID as the login ID
                LoginID = Failed_Login_ID;

                //Store loginID in session
                req.session.LoginID = LoginID
            }else{
                //else create a new login_id
                var { LoginID, LoginIDmsg } = await Create_New_Login_ID(req.body.email)
                //console.log(`login id4 is: ${LoginID}`)
                if(LoginID == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })

                //Store loginID in session
                req.session.LoginID = LoginID
            }
            ////////////////////////////////////////////////////////////////////////////
            //Check if user exist in db
            const { user_exist } = await userExist(req.body.email)
            if(user_exist === "true"){
                //////////////////Confirm user's registration status//////////////////////
                const {Reg_status, Reg_status_msg} = await Confirm_Registration_Status(req.body.email)
                if(Reg_status == "failed") return res.status(500).json({ "status": "failed", "message": "An_error_occured" })
                if (Reg_status === 'INACTIVE') {
                    //destroy sessions variables and ask user to go complete registration
                    await req.session.destroy()
                    return res.status(401).json({
                        "status": "failed",
                        "message": "incomplete_registration"
                    })
                }
                ///////////////////////////////////////////////////////////////////////////
                //////////////////Confirm user submitted credentials///////////////////////
                const { Auth_status, Auth_status_msg } = await Authenticate_user(req, res)
                console.log(`Auth_Status = ${Auth_status}, Auth_Status_Msg = ${Auth_status_msg}`)
                if(Auth_status == "success"){
                    //Regenerate session ID
                    req.session.regenerate(() => {
                        //Create SESSION variable for email
                        req.session.email = req.body.email
                    })

                    //Create JWT for authentication in other services
                    const user_email = { useremail: req.body.email }//user obj
                    const authToken = jwt.sign(user_email, process.env.AUTH_SECRET, { expiresIn: "48h" })
                    
                    //Insert Authentication Token in db
                    const { authTokenInsert } = await Insert_Authentication_Token_in_db(authToken, req.body.email)
                    if(authTokenInsert == "failed"){
                        return res.status(500).json({ "status": "failed", "message": "An_error_occured" })
                    }

                    //SET FirstVisit status to 'NO' in user's table
                    //CALL Successfull_login()
                    const { SL_status, SL_status_msg} = await Successfull_login(req.body.email, LoginID)
                    if(SL_status == "failed"){
                        return res.status(500).json({ "status": "failed", "message": "An_error_occured" })
                    }
                    //delete previous failed login attempt if any
                    const { PFL_status, PFL_status_msg} = await Previous_Failed_Logins(LoginID)
                    if(PFL_status == "failed"){
                        return res.status(500).json({ "status": "failed", "message": "An_error_occured" })
                    }
                    //return SUCCESS
                    return res.status(200).json({
                        "status": "success",
                        "message": "Loggedin"
                    })
                }else{
                    await Login_Failed(LoginID, 'Invalid_Password')
                    await req.session.destroy()
                    return res.status(403).json({
                        "status": "failed",
                        "message": "Invalid_username_or_password3"
                    })
                }
                //////////////////////////////////////////////////////////////////////////
            }else{
                //destroy sessions variables and ask user to go complete registration
                await req.session.destroy()
                return res.status(403).json({
                    "status": "failed",
                    "message": "no_such_user"
                })
            }
        }
    }catch(err){
        //log error here
        console.log(err)
        return res.status(500).json({
            "status" : "failed",
            "message" : "error_during_login"
        })
    }
}

const logout = async (req, res) => {
    try{
        await req.session.destroy((err) => {
            if(!err){
                return res.status(200).json({
                    msg: "logged out"
                })
            }
        })
    }catch(err){
        console.log(`An error occured while logging out: ${err}`)
    }
}

module.exports = {
    login,
    logout
}