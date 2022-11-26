FROM debezium/connect:latest
ENV KAFKA_CONNECT_JDBC_DIR=$KAFKA_CONNECT_PLUGINS_DIR/kafka-connect-jdbc

ARG KAFKA_JDBC_VERSION=5.3.2

# Deploy Kafka Connect JDBC
RUN mkdir $KAFKA_CONNECT_JDBC_DIR && cd $KAFKA_CONNECT_JDBC_DIR &&\
	curl -sO https://packages.confluent.io/maven/io/confluent/kafka-connect-jdbc/$KAFKA_JDBC_VERSION/kafka-connect-jdbc-$KAFKA_JDBC_VERSION.jar

# Deploy MySQL JDBC Driver
ENV MYSQL_DRIVER_VERSION 8.0.30

RUN curl -k -SL "https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-${MYSQL_DRIVER_VERSION}.tar.gz" \
     | tar -xzf - -C $KAFKA_CONNECT_JDBC_DIR \
     --strip-components=1 mysql-connector-java-${MYSQL_DRIVER_VERSION}/mysql-connector-java-${MYSQL_DRIVER_VERSION}.jar