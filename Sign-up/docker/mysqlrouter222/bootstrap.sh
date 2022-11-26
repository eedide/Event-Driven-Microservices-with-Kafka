#!/bin/bash
#source ./credentials.cnf
sleep 140
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
	cluster = $(mysqlsh --host="mysql1" --user="clusterAdmin" --password="RUNSman001" --javascript --execute="dba.getCluster('mycluster')")
	if [ cluster ]
	then
		clusterStatus = $(mysqlsh --host="mysql1" --user="clusterAdmin" --password="RUNSman001" --javascript --execute="$cluster.status().defaultReplicaSet.status")
		if [ clusterStatus -eq 'OK' ]
		then
			mysqlrouter --bootstrap clusterAdmin@mysql1 --user=mysqlrouter --force
			chown -R mysqlrouter /var/lib/mysqlrouter/
		fi
	fi
fi