#!/bin/bash
count=0
for N in 1 2;
do
	ping -c 2 RPWD_mysql_$N
	if [ $? -eq 0 ]
	then
		echo "SERVER IS ALIVE"
	else
		echo "SERVER IS NOT ALIVE"
		echo RPWD_mysql_$N
	fi
done
