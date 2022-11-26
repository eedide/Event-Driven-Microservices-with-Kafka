CHANGE REPLICATION SOURCE TO SOURCE_USER='clusterAdmin', SOURCE_PASSWORD='RUNSman001' FOR CHANNEL 'group_replication_recovery';
--CHANGE MASTER TO MASTER_USER='clusterAdmin', MASTER_PASSWORD='RUNSman001' FOR CHANNEL 'group_replication_recovery';
--INSTALL PLUGIN group_replication SONAME'group_replication.so';
START GROUP_REPLICATION;