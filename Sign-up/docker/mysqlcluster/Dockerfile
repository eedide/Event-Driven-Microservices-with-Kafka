FROM centos:8

RUN cd /etc/yum.repos.d/ && sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* && sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

RUN yum install -y vim net-tools initscripts wget

RUN wget https://repo.mysql.com//mysql80-community-release-el7-3.noarch.rpm

RUN rpm -ivh mysql80-community-release-el7-3.noarch.rpm

RUN rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022

RUN yum install mysql-router -y

RUN yum install mysql-shell -y

COPY ./docker/mysqlcluster/credentials.cnf ./credentials.cnf

RUN ["chmod", "400", "./credentials.cnf"]

COPY ./docker/mysqlcluster/.my.cnf ~/.my.cnf

RUN ["chmod", "400", "~/.my.cnf"]

COPY ./docker/mysqlcluster/conf-repl.sh ./conf-repl.sh

RUN ["chmod", "711", "./conf-repl.sh"]

ENTRYPOINT ["./conf-repl.sh"]