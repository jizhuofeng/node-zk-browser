const zookeeper = require('node-zookeeper-client');

function ZkClient(hosts){
  const zk = zookeeper.createClient(hosts, {
    sessionTimeout: 30000,
    spinDelay     : 1000,
    retries       : 5
  });
  zk.once('connected', function () {
    console.log('Connection zookeeper has been established successfully');
  });
  zk.connect();
  return zk;
}

module.exports.ZkClient = ZkClient




