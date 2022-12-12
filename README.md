# Event Driven Microservices with Kafka and Docker
This is a demonstration of event driven microservices using kafka. The application consist of multiple services, and together these services provide the overall functionality of a complete signup/login/reset password system. This is a backend application developed with nodejs and several backend tools.
![system architecture 2](https://user-images.githubusercontent.com/3667737/204997563-9bb1d963-fc89-4d37-87e4-e2aa8ed06472.png)

Explaination

There are four services that together makeup the signup/login/reset-password application - signup, activateuser, Login and resetpassword. Each of these four services writes to its own database and these databases are also services on their own - meaning that in total, there are more than four services in this application.

<H3>Sign-up</H3>
<ul>Please follow the numbering on the diagram above.</ul>
<ul>(1) Signup detail is submitted to the endpoint (http://localhost:3000/api/v1/dev/signup) and user detail is saved in mysql1 (assuming mysql1 is the primary at the moment) and an activation email is sent to the supplied email address. The record saved in mysql1 is replicated in mysql2 and mysql3 databases respectively. The user detail submitted to endpoint is in this format:
  <pre>
  <label>{</label>
    <label>"email": "testing1@firstclicklimited.com",</label>
    <label>"password": "password"</label>
  <label>}</label>
  </pre>
</ul>
<ul>
  (2) Next a debezium source connector (which i call signupconnector in the connector config later on) installed in kafkaconnect service listens for changes (insert, update and delete) in mysql1 database and records (3) those changes in the kafka topic called: users. This process is called change data capture (CDC).
</ul>
<ul>
  (4) jdbc sink connector for login_mysql (called login-sink-connector later on) which is a consumer of the users topic takes the user's record written to users topic and sinks (5) it to the login_mysql database immediately. Now that users records from mysql1 is sank into login_mysql, the two services: signup and Login can work with independent databases. Login service does not have to depend on mysql1 database and vice versa. Note that only selected fields of the user's table structure of mysql1 can be extracted and sank into login_mysql (all depends on the login service requirement). Another advantage of having every service to work with its own database is that the table structure of a database can be changed to fit the requirements of a particular service without affecting another service.
</ul>
<H3>Activate-User-Registration</H3>
<ul>Note that signup process is not yet completed. Signup can only be completed if everything goes well in this service. The complete process of signup is a distrubuted transaction between signup and activateuser in the sense that if the user clicks on the email link that was sent previously and the account is successfully activated, activateuser calls back on signup alerting it to change the status of the user from INACTVE to ACTIVE otherwise alerts it that activation failed in which case the status of the user in mysql1 users table is left as INACTIVE and the transaction is completed. Note that activateuser service also alters user status in its own database (mongodb1 - assuming its the primary server at the time) accordingly</ul>
<ul>(6)User's activation link is submitted to the endpoint (http://localhost:4000/api/v1/dev/confirmuserReg?token=one-time-jwt-will-be-here) and user activation status (ACTIVE or INACTIVE) is saved in mongodb1. ACTIVE is saved if everything is well, otherwise INACTIVE is inserted</ul>
<ul>(7)Debezium source connector (mongonewuserconnector) listening on mongodb1 to capture data changes captures the changed data and writes (8) it to mongoserver1.activate_user_reg_db.active_users kafka topic (short formed as active_users in the diagram above)</ul>
<ul>(9)signup service (which is a consumer of the active_users topic) consumes the changes made to the active_users topic (this is how signup service knows if users activation succeeded or failed)</ul>
<ul>(10)signup service adjusts or alters its database (mysql1) users table accordingly. If user's account activation succeeded, signup service alters it database user's status to ACTIVE otherwise status is left as INACTIVE. Now the distributed transaction between signup and activateuser is completed.</ul>
<ul>(11) Procedure (2) is repeated</ul>
<ul>(12) Procedure (3), (4) and (5) is repeated</ul>
<H3>Login</H3>
<ul>(14) Should have labeled this as (13) in the diagram (my mistake). Anyways, user submits login detail to endpoint http://localhost:8000/api/v1/dev/login
  <pre>
  <label>{</label>
    <label>"email": "testing1@firstclicklimited.com",</label>
    <label>"password": "password"</label>
  <label>}</label>
  </pre>  
and if successful, the authentication token is updated in the login_mysql database users table</ul>
<ul>(15) debezium source connector (which i call loginconnector in the connector config later on) listening on login_mysql for changes captures the change and writes (16) it to login_db.users topic</ul>
<ul>(17) jdbc sink connector for resetpassword (resetpassword-sink-connector) service which is a consumer of login_db.users topic consumes the updated authentication token and sinks(18) it to the resetpassword service database (rpwd_mysql) users table. This is happening because a user who is not logged into the system cannot reset password (meaning the resetpassword service will not function without logging in and obtaining an authentication token), so the resetpassword service has to have the updated auth token of login service in its own database (rpwd_mysql)</ul>
<H3>Reset-Password</H3>
<ul>(19) User submits reset password request to the endpoint (http://localhost:4001/api/v1/dev//resetPW). The data submitted to the endpoint is in this format:
  <pre>
  <label>{</label>
    <label>"email": "testing1@firstclicklimited.com"</label>
  <label>}</label>
  </pre>
  . resetpassword service processes the request and sends a password reset link to the user's email address. When user clicks on the resetpassword link, if all is well, resetpassword service saves the new password in rpwd_mysql database users table.</ul>

<H2>How to run the application</H2>
1. Download zip file from this repository
2. Extract zip file
3. Open folder Event-Driven-Microservices-with-Kafka in your code editor
4. Open a new terminal and change directory to the folder signup - cd Sign-up
5. Create folder kafka in Sign-up folder root directory.
6. Create subfolder kafka1 inside kafka folder.
7. Create subfolders kafka_data and kafka_logs inside kafka1 folder. kafka_data and kafka_logs will be used to store kafka data and kafka logs.
8. Create folders mysql1data, mysql2data and mysql3data in Sign-up folder root directory. These folders will be used to store mysql data.
9. In the Sign-up directory, RUN the command:
    
    docker-compose up --build

10. I am using mysql innodb cluster in this project and so to setup the cluster, you have to connect to mysql shell.

    Open a new terminal in your code editor and RUN the command:

    docker exec -it mysql1 mysqlsh -u clusterAdmin -S

    and then enter "password" as your password when prompted.


11. When mysql shell is ready,

    #configure the mysql servers to join the InnoDB clusters. RUN the following commands and provide answers for the prompt as required:

    dba.configureInstance("clusterAdmin@mysql1:3306")

    #prompts
    -Do you want to perform the required configuration changes? [y/n]: y
    -Do you want to restart the instance after configuring it? [y/n]: y

    If you are using mysql 8.0.18 as i have used here, you will be presented with the error:

    Restarting MySQL...
    ERROR: Remote restart of MySQL server failed: MySQL Error 3707 (HY000): Restart server failed (mysqld is not managed by supervisor process).

    and you will also be asked to restart mysql manually.

    Just go ahead and restart the mysql1 server. If using docker desktop for windows, just click on restart button to restart the service, otherwise you can RUN this command in a new terminal:

        docker restart mysql1

    or use any other method you prefer to restart mysql.

    After restarting mysql, follow same procedure for the following commands:
        
        dba.configureInstance("clusterAdmin@mysql2:3306")
        dba.configureInstance("clusterAdmin@mysql3:3306")

    To check if your configurations are okay, use the command:

        dba.checkInstanceConfiguration("clusterAdmin@mysql1:3306")

    and you should see a message that ends with something like this:

        {
            "status": "ok"
        }

    you can reapeat same for:
        
        dba.checkInstanceConfiguration("clusterAdmin@mysql2:3306")
        dba.checkInstanceConfiguration("clusterAdmin@mysql3:3306")

    you can now go ahead to create the cluster with this command:

        var cls = dba.createCluster("mycluster")

    and then add mysql2 and mysql3 instances to the cluster with the following command:

        cls.addInstance("clusterAdmin@mysql2:3306")
        cls.addInstance("clusterAdmin@mysql3:3306")

    when presented with this prompt:

        -Please select a recovery method [C]lone/[I]ncremental recovery/[A]bort (default Clone):

        type Clone and press enter to continue.

    you can check the status of you cluster with the following command:

        var cls = dba.getCluster("mycluster")

        and then

        cls.status()

        and you should see this:

        {
            "clusterName": "mycluster",
            "defaultReplicaSet": {
                "name": "default",
                "primary": "c9e60bc52b5c:3306",
                "ssl": "REQUIRED",
                "status": "OK",
                "statusText": "Cluster is ONLINE and can tolerate up to ONE failure.",
                "topology": {
                    "557c87b59c5e:3306": {
                        "address": "557c87b59c5e:3306",
                        "mode": "R/O",
                        "readReplicas": {},
                        "replicationLag": null,
                        "role": "HA",
                        "status": "ONLINE",
                        "version": "8.0.18"
                    },
                    "c9e60bc52b5c:3306": {
                        "address": "c9e60bc52b5c:3306",
                        "mode": "R/W",
                        "readReplicas": {},
                        "replicationLag": null,
                        "role": "HA",
                        "status": "ONLINE",
                        "version": "8.0.18"
                    },
                    "dcc3e1afc7c5:3306": {
                        "address": "dcc3e1afc7c5:3306",
                        "mode": "R/O",
                        "readReplicas": {},
                        "replicationLag": null,
                        "role": "HA",
                        "status": "ONLINE",
                        "version": "8.0.18"
                    }
                },
                "topologyMode": "Single-Primary"
            },
            "groupInformationSourceMember": "c9e60bc52b5c:3306"
        }

    the status should say ok, the topology start with something like this:

        "557c87b59c5e:3306"

    557c87b59c5e is the container id of one of the mysql service, likewise the other 2: c9e60bc52b5c and dcc3e1afc7c5

    you can confirm which of the container id represents mysql1, mysql2 or mysql3 by running this command in new terminal:

        docker ps

    At the moment, c9e60bc52b5c is the primary server as can be shown under its description: "mode": "R/W", meaning this particular server has read and write privilleges while other have "R/O" read only privilleges.

    Note that if mysql1 goes down, you will have to tell your application about the new primary server (because the cluster will do a failover to the new primary server after an election has taken place) so that your application can continue to function properly. You will go to the .env file under Sign-up root folder and change the host to the new primary server. Use:

        var cls = dba.getCluster("mycluster")

        and then

        cls.status()

    to find out which of the mysql instance is the new primary

    The way to avoid this is use mysql router which should automatically tell your application about the new primary. I have another project which can show you how to achieve not just automatic failover within your nodejs application but will also show you how to achieve scalabity and high availability for your nodejs application. Click here to learn more.

11. Confirm which of the servers is the primary server. RUN:

        docker ps

    in a new terminal and cross check the CONTAINER ID with NAMES. Most likely mysql1 will be the primary but if not, then you have to switch to the primary sever in the mysql shell console to be able to perform the next step.

    To switch, RUN the command:

        \c clusterAdmin@mysql2:3306

        or

        \c clusterAdmin@mysql3:3306

    do not perform this step if mysql1 is the primary since you are already logged in to mysql1 terminal.

12. From the primary server terminal, RUN the command:

        \sql

    to swith the mysql shell to SQL mode.

    Once switched, RUN the sql commands:

    use signup_db

    DROP TABLE IF EXISTS `users`;
    CREATE TABLE IF NOT EXISTS `users` (
      `id` int NOT NULL AUTO_INCREMENT,
      `email` varchar(255) NOT NULL,
      `password` varchar(255) NOT NULL,
      `fullName` varchar(66),
      `address` varchar(77),
      `phoneNo` varchar(16),
      `gender` varchar(6),
      `userRole` enum('visitor','student','Admin') NOT NULL DEFAULT 'visitor',
      `User_status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE',
      `reason_for_inactive` enum('visitor','TERMINATED','SUSPENDED_FOR_VIOLATION') NOT NULL DEFAULT 'visitor',
      `firstvisit` varchar(3) DEFAULT NULL,
      `last_changed_PW` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      `regDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `auth_token` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`id`),
      UNIQUE KEY (`email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS `suspended_users`;
    CREATE TABLE IF NOT EXISTS `suspended_users` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `email` varchar(255) NOT NULL,
    `Suspension_reason` tinytext NOT NULL,
    `Date_of_suspension` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Login_id` int(10) DEFAULT NULL,
    PRIMARY KEY (`Id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS `sessions`;
    CREATE TABLE IF NOT EXISTS `sessions` (
      `session_id` varchar(128) NOT NULL,
      `expires`int unsigned NOT NULL,
      `data` mediumtext,
      PRIMARY KEY (`session_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    If you are not in the primary server, you will get this error:

        ERROR: 1290 (HY000): The MySQL server is running with the --super-read-only option so it cannot execute this statement

    otherwise the tables will be created successfully.

    After this is successful, you can RUN:

        \js

    to switch back to the javascript mode.

13. To signup as a user, you need to submit a post request in this format:

        {
          "email": "testing1@firstclicklimited.com",
          "password": "password"
        }
    
    to the endpoint:

        http://localhost:3000/api/v1/dev/signup

    You can use whatever method you are comfortable with to post the data, make sure its a post request, not a get request and make sure to choose json as the datatype to be posted.

    I use Postman, you can download Postman and learn how to send request with it quickly.

    If everthing goes well, you will get the response:

        {
            "status": "success",
            "msg": "user's registration activation email sent"
        }

    Note that you have to provide your own smtp server detail for sending of activation mail to be successful. To achieve this, go to index.js file in the controller folder inside Sign-up root folder and locate this block of code

        let transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: "info@firstclicklimited.com",
                pass: process.env.SMTP_Password,
            },
        });

        change host to your smtp server host, user to an email address created in the smtp server host and then go to .env file to change the environment variable SMTP_Password to point to your password.

14. To setup the debezium source connector in kafka connect and to create the users topic in kafka, do the following:

    Post this configuration:

        {
          "name": "signupconnector",  
          "config": {  
            "connector.class": "io.debezium.connector.mysql.MySqlConnector",
            "tasks.max": "1",
            "key.converter": "org.apache.kafka.connect.json.JsonConverter",
            "value.converter": "org.apache.kafka.connect.json.JsonConverter",
            "key.converter.schemas.enable": "true",
            "value.converter.schemas.enable": "true",  
            "database.hostname": "mysql1",  
            "database.port": "3306",
            "database.user": "clusterAdmin",
            "database.password": "password",
            "database.server.id": "184055",  
            "database.server.name": "smartdevdbserver1",  
            "database.include.list": "signup_db",
            "schema.history.internal.kafka.topic": "schema-changes.signup_db",
            "schema.history.internal.kafka.bootstrap.servers": "kafka1:9092",
            "table.include.list": "signup_db.users",
            "snapshot.mode": "when_needed",
            "topic.creation.enable": "true",
            "topic.prefix": "smartdevdbserver1",
            "topic.creation.default.replication.factor": "1",
            "topic.creation.default.partitions": "1",
            "transforms": "unwrap,dropTopicPrefix",
            "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
            "transforms.unwrap.drop.tombstones": "false",
            "delete.handling​.mode": "none",
            "transforms.dropTopicPrefix.type": "org.apache.kafka.connect.transforms.RegexRouter",
            "transforms.dropTopicPrefix.regex": "smartdevdbserver1.signup_db.(.*)",
            "transforms.dropTopicPrefix.replacement": "$1",
            "include.schema.changes": "true"
          }
        }

    to the endpoint:

        http://localhost:8083/connectors/

    make sure its a post request, not a get request and make sure to choose json as the datatype to be posted.

    If everything goes well, you should get the response:

        {
            "name": "signupconnector",
            "config": {
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "tasks.max": "1",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "key.converter.schemas.enable": "true",
                "value.converter.schemas.enable": "true",
                "database.hostname": "mysql1",
                "database.port": "3306",
                "database.user": "clusterAdmin",
                "database.password": "password",
                "database.server.id": "184055",
                "database.server.name": "smartdevdbserver1",
                "database.include.list": "signup_db",
                "schema.history.internal.kafka.topic": "schema-changes.signup_db",
                "schema.history.internal.kafka.bootstrap.servers": "kafka1:9092",
                "table.include.list": "signup_db.users",
                "snapshot.mode": "when_needed",
                "topic.creation.enable": "true",
                "topic.prefix": "smartdevdbserver1",
                "topic.creation.default.replication.factor": "1",
                "topic.creation.default.partitions": "1",
                "transforms": "unwrap,dropTopicPrefix",
                "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
                "transforms.unwrap.drop.tombstones": "false",
                "delete.handling​.mode": "none",
                "transforms.dropTopicPrefix.type": "org.apache.kafka.connect.transforms.RegexRouter",
                "transforms.dropTopicPrefix.regex": "smartdevdbserver1.signup_db.(.*)",
                "transforms.dropTopicPrefix.replacement": "$1",
                "include.schema.changes": "true",
                "name": "signupconnector"
            },
            "tasks": [],
            "type": "source"
        }

    The topic "users" should have been created, RUN the following command in a new terminal in your code editor to cofirm that the topic is created and populated with the created user detail:

        docker exec -it kafka1 /kafka/bin/kafka-topics.sh --list --bootstrap-server kafka1:9092

    you should see users listed as one of the topics created. To see what is populated in the topic, RUN the following command:

        docker exec kafka1 /kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka1:9092 --from-beginning --property print.key=true --topic users

    Now that we are done with user registration and setting up the signupconnector, we have to move to activating the registered user account.

15. Open a new terminal and change directory to Activate-User-Registration

        cd Activate-User-Registration

    Note before running the next command, you can go to mongod.env file in Activate-User-Registration and change the value of MONGO_INITDB_ROOT_USERNAME and MONGO_INITDB_ROOT_PASSWORD environment variables to your prefered username and password.

16. RUN

        docker-compose up --build

    Once the activateuser service is running, we have to setup the mongo database (which i have used as the database for this service). For convinience, i am using a replica set (just like in the case of signup service where i used a mysql innodb cluster).

17. Open a new tab to login to the mongo shell to configure our mongodb replica set.

18. RUN the command
    
        docker exec -it mongodb1 mongosh -u "username" -p "password"

19. Instantiate the replica set

        rs.initiate({"_id" : "my-mongo-set","members" : [{"_id" : 0,"host" : "mongodb1:27017"},{"_id" : 1,"host" : "mongodb2:27017"},{"_id" : 2,"host" : "mongodb3:27017"}]});

        You can check the replica set status by running the command:

            rs.status()

        You can set a particular node to always assume the position of the master or primary server (as far as it is online). Set mongodb1 to always be the master when online by running the following commands:

            conf = rs.config();
            conf.members[0].priority = 2;
            rs.reconfig(conf);

21. RUN the commands

        use activate_user_reg_db

        db.createCollection('active_users');

22. Check back on Activate-User-Registration terminal where you started the service, if you do not see the message:

        The server is now listening on port 4000

restart nodemon - click anywhere in the Activate_User.js file in the Activate-User-Registration root folder, press tab and backspace and nodemon should restart. Now the app should start correctly since you have configured mongodb.

23. You have to put mongodb1, mongodb2 and mongodb3 in same network as kafka connect and kafka so that the can communicate with each other when kafka connect needs to capture data changes in mongodb. To achieve this run the following command:

        docker network connect sign-up_internalnet mongodb1
        docker network connect sign-up_internalnet mongodb2
        docker network connect sign-up_internalnet mongodb3

        sign-up_internalnet is the name of the network that kafka connect and kafka belongs to - see docker-compose.yml in Sign-up root directory.
        
        Note that docker has added sign-up_ to the original network name whick i provided - i.e internalnet

        To be sure what the networt name really is in your case, run the following command:

            docker network ls

24. Submit a post request of the connector's configuration

        {
            "name": "mongonewuserconnector",
            "config": {
                "connector.class" : "io.debezium.connector.mongodb.MongoDbConnector",
                "tasks.max" : "1",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "key.converter.schemas.enable": "false",
                "value.converter.schemas.enable": "false",
                "mongodb.hosts" : "my-mongo-set/mongodb1:27017",
                "mongodb.name" : "mongoserver1",
                "mongodb.user" : "eedide",
                "mongodb.password" : "password",
                "database.include.list" : "activate_user_reg_db",
                "collection.include.list": "activate_user_reg_db.active_users",
                "database.history.kafka.bootstrap.servers" : "kafka1:9092",
                "transforms": "unwrap",
                "transforms.unwrap.type":"io.debezium.connector.mongodb.transforms.ExtractNewDocumentState",
                "topic.prefix": "mongoserver1"
            }
        }

    which is to listen for change data capture in mongodb1 to the endpoint:

        http://localhost:8083/connectors/

    if everything goes well, you should see the following response:

        {
            "name": "mongonewuserconnector",
            "config": {
                "connector.class": "io.debezium.connector.mongodb.MongoDbConnector",
                "tasks.max": "1",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "key.converter.schemas.enable": "false",
                "value.converter.schemas.enable": "false",
                "mongodb.hosts": "my-mongo-set/mongodb1:27017",
                "mongodb.name": "mongoserver1",
                "mongodb.user": "eedide",
                "mongodb.password": "password",
                "database.include.list": "activate_user_reg_db",
                "collection.include.list": "activate_user_reg_db.active_users",
                "database.history.kafka.bootstrap.servers": "kafka1:9092",
                "transforms": "unwrap",
                "transforms.unwrap.type": "io.debezium.connector.mongodb.transforms.ExtractNewDocumentState",
                "topic.prefix": "mongoserver1",
                "name": "mongonewuserconnector"
            },
            "tasks": [],
            "type": "source"
        }

25. Check your mail, copy and paste the link, press enter and if all is well, you should see a console response like this:

        User email is: testing1@firstclicklimited.com
        Status is: 200
        Status is: 200
        Latest status is: 200

  in the Activate-User-Registration terminal.

  Now, check your mongodb1 shell and run the following commands:

      use activate_user_reg_db

      db.active_users.find()

  and you should see the following output:

      [
        {
          _id: ObjectId("63908c2b7af343ab278c7158"),
          email: 'testing1@firstclicklimited.com',
          status: 'ACTIVE',
          __v: 0
        }
      ]

  if user activation wasn't successful, status will be INACTIVE

  Now remember that mongodb is the database for activateuser service and what we have designed is that once a data change occurs in this service's database, the debezium source connector "mongonewuserconnector" should pick it up and write it to the kafka topic "mongoserver1.activate_user_reg_db.active_users", signup service (which is subscribed to mongoserver1.activate_user_reg_db.active_users) then acts depending on the user's status record written to the kafka topic. signup service either activate's the user's account (in the users table of mysql1) or otherwise allow the user's status to remain in an INATIVE state. INACTIVE here suggest that something were wrong while trying to activate user's account when the user clicked on the activation link.

  Now log into your mysql1 client and check the User_status column of the user table and you will see that the status has changed to ACTIVE. RUN the command:

       docker exec -it mysql1 mysql -u root -p

  when prompted for password, enter: "password" and then press enter.

  RUN the commands:

       use signup_db

       select * from users where email = 'testing1@firstclicklimited.com';

  if all goes well, you should see User_status column as ACTIVE.

26. We can now move on to login service, RUN the command:

        docker-compose up --build

27. Connect login_mysql to kafka connect and kafka network so that the can communicate.

        docker network connect sign-up_internalnet login_mysql

  to confirm if login_mysql has joined the network, RUN

        docker network inspect sign-up_internalnet login_mysql

28. Create other required tables for login_mysql by running the following commands:

        DROP TABLE IF EXISTS `suspended_users`;
        CREATE TABLE IF NOT EXISTS `suspended_users` (
        `Id` int NOT NULL AUTO_INCREMENT,
        `email` varchar(255) NOT NULL,
        `Suspension_reason` tinytext NOT NULL,
        `Date_of_suspension` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `Login_id` int(10) DEFAULT NULL,
        PRIMARY KEY (`Id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


        DROP TABLE IF EXISTS `login`;
        CREATE TABLE IF NOT EXISTS `login` (
        `Login_ID` int NOT NULL AUTO_INCREMENT,
        `email` varchar(255) NOT NULL,
        `Success_ID` int DEFAULT NULL,
        `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`Login_ID`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        DROP TABLE IF EXISTS `failed_login_attempt`;
        CREATE TABLE IF NOT EXISTS `failed_login_attempt` (
        `Failed_Attempts_ID` int NOT NULL AUTO_INCREMENT,
        `Login_ID` int NOT NULL,
        `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `FailureReason` text NOT NULL,
        PRIMARY KEY (`Failed_Attempts_ID`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        DROP TABLE IF EXISTS `successful_login`;
        CREATE TABLE IF NOT EXISTS `successful_login` (
        `Success_ID` int NOT NULL AUTO_INCREMENT,
        `Login_ID` int NOT NULL,
        `email` varchar(255) NOT NULL,
        `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`Success_ID`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


        DROP TABLE IF EXISTS `sessions`;
        CREATE TABLE IF NOT EXISTS `sessions` (
        `session_id` varchar(128) NOT NULL,
        `expires`int unsigned NOT NULL,
        `data` mediumtext,
        PRIMARY KEY (`session_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

29. install the login-sink-connector which will be responsible for sinking users table of signup service to users table of login service. Post the following login-sink-connector config to the endpoint http://localhost:8083/connectors/

        {
            "name": "login-sink-connector",
            "config": {
                "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
                "tasks.max": "1",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "key.converter.schemas.enable": "true",
                "value.converter.schemas.enable": "true", 
                "topics": "users",
                "connection.url": "jdbc:mysql://login_mysql:3306/login_db",
                "connection.user": "login_user",
                "connection.password": "password",
                "table.name.format": "users",
                "auto.create": "true",
                "insert.mode": "upsert",
                "delete.enabled": "true",
                "pk.fields": "id",
                "pk.mode": "record_key"
            }
        }

  To see if the sink operation was successful, log into login_mysql client and check the users table for records available in signup_db users table.

        docker exec -it login_mysql mysql -u root -p

        enter "password" as password

        use login_db;

        show tables;

        select * from users;

    if all went well, you should see all the records in mysql1 users table in login_mysql database users tables.

30. Install debezium source connector "loginconnector" for both users table and suspended_users table. The source connector for the suspended_users table is not in the diagram but became neccessary in the course of the project - my apologies.  The connector takes suspended users in login_mysql database of the Login service and writes them to the kafka topic "login_db.suspended_users". signup-sink-connector which is a consumer of this topic, takes the written data and sinks it to mysql1 database suspended_users table. This happens because in the case that a user who failed to activate his account before the expiration of the link tries to register again, then because of the way i have structured the code, we need the suspended users record from the login table to ascertain that it is not a suspended user that is trying to prank the system into re-registering the account under suspension. See line 135 - 175 of index.js inside controller folder of Sign-up root folder.

The connector also takes users record that was sinked from the mysql1 database users table and writes them to the kafka topic login_db.users for later use by the resetpassword service.

    Before we install the connector config, let's first put a test data in the suspended_users table of the login_mysql database:

        INSERT INTO suspended_users (email, Suspension_reason, Login_id) VALUES ("testemail@testing.com","no reason","111");

    Also run the this command:

        GRANT ALL PRIVILEGES ON *.* TO 'login_user'@'%' with grant option;
        FLUSH PRIVILEGES;

    Now submit the following connector config to the endpoint "http://localhost:8083/connectors/"

        {
            "name": "loginconnector",  
            "config": {  
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "tasks.max": "1",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "key.converter.schemas.enable": "true",
                "value.converter.schemas.enable": "true",  
                "database.hostname": "login_mysql",  
                "database.port": "3306",
                "database.user": "login_user",
                "database.password": "password",
                "database.server.id": "184066",  
                "database.server.name": "logindbserver1",  
                "database.include.list": "login_db",
                "schema.history.internal.kafka.topic": "schema-changes.login_db",
                "schema.history.internal.kafka.bootstrap.servers": "kafka1:9092",
                "table.include.list": "login_db.suspended_users, login_db.users",
                "snapshot.mode": "when_needed",
                "topic.creation.enable": "true",
                "topic.prefix": "logindbserver1",
                "topic.creation.default.replication.factor": "1",
                "topic.creation.default.partitions": "1",
                "transforms": "unwrap,dropTopicPrefix",
                "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
                "transforms.unwrap.drop.tombstones": "false",
                "delete.handling​.mode": "none",
                "transforms.dropTopicPrefix.type": "org.apache.kafka.connect.transforms.RegexRouter",
                "transforms.dropTopicPrefix.regex": "logindbserver1.(.*)",
                "transforms.dropTopicPrefix.replacement": "$1"
            }
        }

        if all went well, you should see a new kafka topic named "login_db.suspended_users" and if you list the record in the topic, you should find the test data (with the email - testemail@testing.com) in there.

    To complete this section, you then have to install a sink connector to take the data from login_db.suspended_users to the suspended_users table of mysql1 database.

    Post the following config to the endpoint "http://localhost:8083/connectors/"

        {
            "name": "signup-sink-connector",
            "config": {
                "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
                "tasks.max": "1",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "key.converter.schemas.enable": "true",
                "value.converter.schemas.enable": "true", 
                "topics": "login_db.suspended_users",
                "connection.url": "jdbc:mysql://mysql1:3306/signup_db",
                "connection.user": "clusterAdmin",
                "connection.password": "password",
                "table.name.format": "suspended_users",
                "insert.mode": "upsert",
                "delete.enabled": "true",
                "pk.fields": "Id",
                "pk.mode": "record_key"
            }
        }

31. Now to login, submit a post request to the endpoint "http://localhost:8000/api/v1/dev/login". The post data looks thus:

        {
            "email": "testing1@firstclicklimited.com",
            "password": "password"
        }

    if everything is fine, you should get a response like this:

        {
            "status": "success",
            "message": "Loggedin"
        }

    Now that you are logged in, we can now move on to the resetpassword service.

32. First

        docker-compose up --build

    then

        docker network connect sign-up_internalnet resetpassword   

32. Submit a post request of the following config to the endpoint "http://localhost:8083/connectors/" to install the jdbc sink connector which sinks the kafka topic "login_db.users" to the users table of the resetpassword service database rpwd_mysql.

        {
            "name": "resetpassword-sink-connector",
            "config": {
                "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
                "tasks.max": "1",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "key.converter.schemas.enable": "true",
                "value.converter.schemas.enable": "true", 
                "topics": "login_db.users",
                "connection.url": "jdbc:mysql://rpwd_mysql:3306/rpwd_db",
                "connection.user": "rpwd_user",
                "connection.password": "password",
                "table.name.format": "users",
                "fields.whitelist": "id,email,password,User_status,auth_token",
                "auto.create": "true",
                "insert.mode": "upsert",
                "delete.enabled": "true",
                "pk.fields": "id",
                "pk.mode": "record_key"
            }
        }

33. Let's say we want to change password for the logged in user testing1@firstclicklimited.com, then submit a post request to the endpoint "http://localhost:4001/api/v1/dev//resetPW" with the following json data

        {
            "email": "testing1@firstclicklimited.com"
        }

    if everything goes well, you should get this response:

        {
            "message": "PW_reset_link_sent"
        }

    Go to your inbox and click on the reset password link that has been sent there. If link is not clickable, copy link and paste on your url address bar and press enter. You should see the following response:

        { status: 'PW_Change_Request' }

    You should also see a long encrypted code displayed, you will need this soon.

    If you are calling this apis' from your frontend, at this point the browser will redirect to this url "http://signup:3000/api/v1/dev/PW_Reset_Frm?use=${encryptedUserEmail}" with an attached encrypted user email. You can use any mechanism that is best for you to retrieve this email and display it as the username on the new change password form to be posted to the endpoint "http://localhost:3000/api/v1/dev//Process_New_PW".

    In the meantime since i am testing the code from the backend, i will post the following data rather to that endpoint ("http://localhost:3000/api/v1/dev//Process_New_PW") to be able to change my former password to the new one.

        {
            "userEmail": "I8F4F9FDPnHg1RAnpaS3qqRlcDAV6pzNF9Op7lHLN5szlk+sW28kaVJNfbVRwjrrRFf2xJ5ToY7Q3MgBh+IEY6w8BkNk9+yapIZ9GpWegt/tqmTNoK03FfqNt7iVqwEd/hgm0lKKpbKl/FopwEwgsEHJeGUbxCxX+YLsrhN38KU=",
            "password": "wordpass"
        }

    If everything went well, you should see this response:

        {
            "status": "success",
            "msg": "user's password is successfully changed"
        }

    and then if you login to login_mysql

        docker exec -it login_mysql mysql -u root -p

    and then

        select * from users where email = "testing1@firstclicklimited.com";

    you should find that the password has been updated here also.

    Again if you check rpwd_mysql, you should also find that the password for this user has changed also.