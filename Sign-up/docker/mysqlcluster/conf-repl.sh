#!/bin/bash
#source ./credentials.cnf
sleep 115
count=0
for N in 1 2 3;
do
	ping -c 3 -w 5 mysql$N
	if [ $? -eq 0 ]
	then
		count=$N
	fi
done

if [ $count -eq 3 ]
then
	for N in 1 2 3;
	do
		mysqlsh --host="mysql$N" --user="clusterAdmin" --password="RUNSman001" --javascript --execute="dba.configureInstance('clusterAdmin@mysql$N:3306',{ password: 'RUNSman001', interactive: false, restart: true })"
	done

	mysqlsh --host="mysql1" --user="clusterAdmin" --password="RUNSman001" --javascript --execute="dba.createCluster('mycluster', { interactive: false, exitStateAction: 'OFFLINE_MODE', autoRejoinTries: 0 })"

	for N in 2 3;
	do
		mysqlsh --host="mysql1" --user="clusterAdmin" --password="RUNSman001" --javascript --execute="var cls = dba.getCluster(); cls.addInstance('clusterAdmin@mysql$N:3306', { password: 'RUNSman001', recoveryMethod: 'auto', interactive: false, exitStateAction: 'OFFLINE_MODE', autoRejoinTries: 0 })"
	done
fi