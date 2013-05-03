// Simple websocket proxy
// Mike Tinglof
//
// This was tested as an intermediary between a JsSIP-based web app and Freeswitch.
// So far I've only had success with audio.

var sip = require('sip');
var proxy = require('sip/proxy');
var util = require('util');
var ws = require('ws');
var http = require('http');

/* Specifying http.server instead of port in options allow us to embed this proxy in another server */
var server = http.createServer();
server.listen(8088);

proxy.start(
{
  address: '192.168.1.101',
  port: 6060,
  /*ws_port: 8088,*/
  ws_server: server,
  logger : {
    send: function(m) { util.debug("send " + util.inspect(m, false, null)); },
    recv: function(m) { util.debug("recv " + util.inspect(m, false, null)); }
  }
}, 
function(rq) {
  try {
    /* probably should be handled in proxy code -- but in order to get later messages
       about this call (e.g. BYE) we need to set ourselves as the proxy server */
    if (rq.method == 'INVITE') {
      rq.headers['record-route'] = [{uri:'sip:192.168.1.101:6060;lr'}];
    }
    proxy.send(rq, function onResponse(rs) {
        // removing top via
        rs.headers.via.shift();

        proxy.send(rs);
    });
  } 
  catch(e) {
    util.debug(e.stack);
  }
});

util.log("Running");
