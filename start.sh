LOGFILE=$(dirname $0)/logs/node-zk-browser.log
export ZK_HOST="192.168.0.221:1181"
nohup node $(dirname $0)/app.js 2>&1 >>$LOGFILE &

