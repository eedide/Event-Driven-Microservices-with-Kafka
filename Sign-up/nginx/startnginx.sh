#!/bin/bash
sleep 55
count=0
for N in 1 2;
do
	ping -c 3 -w 5 sign-up_signup_$N
	if [ $? -eq 0 ]
	then
		count=$N
	fi
done

if [ $count -eq 2 ]
then
	systemctl start nginx && systemctl start keepalived && systemctl enable nginx && systemctl enable keepalived
fi