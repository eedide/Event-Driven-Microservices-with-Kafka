#!/bin/bash
NUM="200"
VIP=$(cut -c 1-9 <<< $(hostname -I))
VIP+=$NUM
echo $VIP