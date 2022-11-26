#!/bin/bash
user=root
password=RUNSman001

sleep 55

ping -c 3 -w 5 $(hostname -I)
if [ $? -eq 0 ]
then
    mysql --host="$(hostname -I)" --port="3306" --user="$user" --password="$password" --execute="GRANT ALL PRIVILEGES ON *.* TO 'clusterAdmin'@'%' with grant option; FLUSH PRIVILEGES;"
fi