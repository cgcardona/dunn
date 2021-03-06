/*
 * @Plugin        Wiki
 * @Description   Search the wikipedia
 * @Trigger       .wiki
 *
 * @Author        Olli K
 * @Website       github.com/gildean
 * @License       MIT
 * @Copyright     -
 *
 */

var wiki = function (irc) {
    "use strict";
    var http = require('http');
    var qs = require('querystring');
    var trigger = 'wiki';
    var mesLen = trigger.length + irc.command.length + 1;
    var limit = (irc.config.wiki && irc.config.wiki.limit) ? parseInt(irc.config.wiki.limit) : 5;

    var question = function (pla, channel, nick, par, message) {

        function isValidJson(json) {
            try {
                return JSON.parse(json);
            } catch (e) {
                return false;
            }
        }

        function sendToIrc(err, links) {
            if (!err && links) {
                irc.send(channel, nick + ': ' + links);
            } else {
                irc.send(channel, nick + ': ' + err || 'No valid answer');
            }
        }
        
        function getLinksFromAnswer(answer, cb) {
            var json = isValidJson(answer);
            var links = '';
            if (json && json.length > 1 && json[1].length > 0) {
                json[1].forEach(function (link) {
                    links += link + ': http://en.wikipedia.org/wiki/' + qs.escape(link) + ' || ';
                });
                cb(null, links.substring(0, links.length - 4));
            } else {
                cb('No valid answer', null);
            }
        }

        function handleAnswer(err, answer) {
            if (!err) {
                getLinksFromAnswer(answer, sendToIrc);
            } else {
                sendToIrc(err);
            }
        }

        (function searchWiki(message, cb) {
            var query = qs.escape(message.substring(mesLen).trim());
            if (query !== '') {
                var qPath = '/w/api.php?action=opensearch&search=' + query + '&format=json&limit=' + limit;
                var options = {
                    hostname: 'en.wikipedia.org',
                    path: qPath,
                    headers: {'user-agent': 'Mozilla/5.0'},
                };
                var req = http.request(options, function (res) {
                    var answer = '';
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        answer += chunk;
                    });
                    res.on('error', function (err) {
                        cb(err.message, null);
                    });
                    res.on('end', function () {
                        cb(null, answer);
                    });
                });
                req.on('error', function (err) {
                    cb(err.message, null);
                });
                req.end();
            } else {
                cb('Search the wikipedia i.e. \'' + irc.command + trigger + ' traumatic insemination\' ', null);
            }
        }(message, handleAnswer));

    };

    irc.addTrigger(trigger, question);
};

exports.Plugin = wiki;
