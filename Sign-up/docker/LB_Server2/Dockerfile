FROM centos:8

RUN cd /etc/yum.repos.d/ && sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* && sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

RUN yum install -y nginx keepalived vim net-tools initscripts wget

RUN cd /etc/nginx

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

RUN cd /etc/keepalived && touch check_nginx.sh && chmod +x check_nginx.sh

COPY ./nginx/keepalived/check_nginx.sh /etc/keepalived/check_nginx.sh

COPY ./nginx/keepalived/keepalived2/keepalived.conf /etc/keepalived/keepalived.conf

RUN ["chmod", "644", "/etc/keepalived/keepalived.conf"]

#COPY ./nginx/startnginx.sh /etc/nginx/startnginx.sh

#RUN ["chmod", "+x", "/etc/nginx/startnginx.sh"]

#ENTRYPOINT ["/etc/nginx/startnginx.sh"]