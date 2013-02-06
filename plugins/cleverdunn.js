/*
 * @Plugin        Cleverdunn
 * @Description   Cleverbot for Dunn
 *
 * @Author        buttcactus (Aaron Ahmed)
 * @Library       cleverbot-node
 * @Website       http://www.digitalkitsune.net
 * @Copyright     Digital-Kitsune 2012
 *
 */

var Cleverbot = require("cleverbot-node");
var Bots = {};

var config = {};
var server = undefined;
var address = "0.0.0.0";
Plugin = exports.Plugin = function(irc) {
	config = irc.config.cleverdunn || {nickSessionID: false, log: 46969, debug: false};

	irc.addMessageHandler(irc.nick.toLowerCase() + ", ", this.run);
	irc.addMessageHandler(irc.nick.toLowerCase() + ": ", this.run);

	if(typeof config.log != "undefined") {
		irc.addTrigger("cdlog", this.getLog); //doesn't really work

		server = require("http").createServer(this.request).listen(config.log);

		var req = require("http").request({"hostname": "ifconfig.me", "path": "/ip", "port": 80}, function(res) {
			var data = "";
			res.on("data", function(d) { data += d; }).on("end", function() { address = data.toString().trim(); });
		}).end();
	}
	if(typeof config.debug != "undefined") irc.addTrigger("cddebug", this.debug);
}

Plugin.prototype.request = function(req, res) {
	var sessionid = req.url.split("?")[0].substr(1);

	res.writeHead(200, {"Content-Type": "text/html"});
	res.write("<!DOCTYPE html>\n<html><head><title>Cleverdunn</title><style>h1,h4{margin:0}body{font-family:Arial,sans-serif;}body,html,table,tr{width:100%}td{width:20%}td:nth-child(2){width:60%}tr{background: #eee}tr:first-child{background:#444;color: white;font-size: 1.5em}tr:nth-child(2n){background: #aaa}</style></head><body><h4>Cleverdunn.</h4>");
	if(typeof Bots[sessionid] != "undefined") {
		res.write("<h1>" + sessionid.split("_")[1] + " on #" + sessionid.split("_")[0] + "</h1><table><tr><td>Name</td><td>Message</td><td>Time</td></tr>");

		Bots[sessionid].log.forEach(function(log) {
			res.write("<tr><td>"+log[0]+"</td><td>"+log[2]+"</td><td>"+log[1].toUTCString()+"</td></tr>");
		});

		res.write("</table>");
	} else {
		res.write("<h1>User/bot not found</h1>");
	}
	res.write("</body></html>");
	res.end();
}

Plugin.prototype.getLog = function(irc, channel, nick, match, message, raw) {
	if(typeof Bots[channel.replace("#", "")+"_"+nick] != "undefined") {
		// irc.send(channel, "Cleverbot log url: http://cleverbot.com/" + Bots[nick].params.logurl);
		console.log(server.address());
		irc.send(channel, "Log url: http://"+address+":"+server.address().port+"/"+channel.replace("#", "")+"_"+nick);
	} else {
		irc.send(channel, "Sorry, "+nick+" you don't have a cleverbot session yet.");
	}
}

Plugin.prototype.debug = function(irc, channel, nick, match, message, raw) {
	if(typeof Bots[channel.replace("#", "")+"_"+nick] != "undefined") {
		irc.send(nick, JSON.stringify(Bots[nick].params));
	} else {
		irc.send(channel, "Sorry, "+nick+" you don't have a cleverbot session yet.");
	}
}

Plugin.prototype.run = function(irc, channel, nick, match, message, raw) {
	sessionid = channel.replace("#", "")+"_"+nick

	if(typeof Bots[sessionid] == "undefined") {
		Bots[sessionid] = new Cleverbot();
		if(typeof config.nickSessionID != "undefined") Bots[sessionid].params.sessionid = sessionid;
		if(typeof config.log != "undefined") Bots[sessionid].log = [];
	}
	
	var Bot = Bots[sessionid];
	if(typeof config.nickSessionID != "undefined") Bot.params.sessionid = sessionid;
	if(typeof config.log != "undefined") Bot.log.push([nick, new Date(), message.split(" ").splice(1).join(" ")]);
	Bot.write(message.split(" ").splice(1).join(" "), function(r) {
		if(r.message.indexOf("<!--") > -1) irc.send(channel, "Cleverbot.com is under maintenance, probably because of us.");
		else {
			irc.send(channel, nick + ': ' + r.message);
			if(config.log) Bot.log.push([irc.nick.toLowerCase(), new Date(), r.message]);
		}
	});
};
