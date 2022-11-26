FROM centos:8

RUN cd /etc/yum.repos.d/ && sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* && sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

#with nginx
#RUN yum install -y nginx keepalived vim net-tools initscripts wget

#without nginx
RUN yum install -y keepalived vim net-tools initscripts wget

#COPY ./docker/mysqlrouter111/nginx.conf /etc/nginx/nginx.conf

#RUN cd /etc/keepalived && touch check_nginx.sh && chmod +x check_nginx.sh

#COPY ./nginx/keepalived/check_nginx.sh /etc/keepalived/check_nginx.sh

RUN wget https://repo.mysql.com//mysql80-community-release-el7-3.noarch.rpm

RUN rpm -ivh mysql80-community-release-el7-3.noarch.rpm

RUN rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022

RUN yum install mysql-router -y

RUN cd /etc/keepalived

COPY ./mysqlrouter111/keepalived/keepalived1/keepalived.conf /etc/keepalived/keepalived.conf

RUN ["chmod", "644", "/etc/keepalived/keepalived.conf"]