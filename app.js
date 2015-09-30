// config data is setup here
// added abstraction

var fs = require("fs");
var util = require("util");

// load the config file if exists, write a template and promt user to quit if it doesn't
var settings = {
    web: {},
    steam: {}
};

var sampleConfig = {
    "botname": "Some Name",
    "commandChar": ".",
    "commands": {
        "host": "canKick",
        "join": "canKick",
        "test": "canKick"
    },
    "commands_dota": {
        "start": "",
        "exit": ""
    },
    "region": 2,
    "secret": "",
    "chatID": "103582791434793082",
    "web": {
        "mongodb": "mongo://localhost/dota/",
        "redisdb": "redis://127.0.0.1:6379/0",
        "enabled": "true",
        "baseurl": "http://localhost:5000/",
        "port": 80,
        "league_name": "My First League",
        "web_style": "default"
    },
    "steam": {
        "account_name": "",
        "password": "",
        "auth_code": ""
    },
    "dota_bots": {
        "1": {
            "account_name":"herp",
            "password":"derp",
            "auth_code":"herp"
        }
    }
};

try {
    var _config = fs.readFileSync("config.json", "utf-8");

    if (_config.length) {
        var config = JSON.parse(_config);
        settings.botname = config.botname || "My Bot";
        settings.commandChar = config.commandChar || ".";
        settings.commands = config.commands || {"host": "canKick","join": "canKick","test": "canKick"};
        settings.commands_dota = config.commands_dota || {"start": "","exit": ""};
        settings.region = config.region || 2;
        settings.chatID = config.chatID || "103582791434793082";
        settings.web.enabled = config.web.enabled || "true";
        settings.steam.account_name = config.steam.account_name || "derp";
        settings.steam.password = config.steam.password || "herp";
        settings.dota_bots = config.dota_bots || {"1":{"account_name":"herp","password":"derp","auth_code":"herp"}};
        settings.secret = config.secret || "";

        if (config.steam.auth_code !== "") {
            settings.steam.auth_code = config.steam.auth_code;
        }
        for (var account in settings.dota_bots) {
            if (settings.dota_bots[account].auth_code !== "") {
                settings.dota_bots[account].auth_code = config.dota_bots[account].auth_code;
            }
        }
        try {
            var sentry = fs.readFileSync('sentry');
            if (sentry.length) {
                settings.steam.sha_sentryfile = sentry;
            }
            for (var account in settings.dota_bots) {
                var sentry = fs.readFileSync('sentry_' + settings.dota_bots[account])
                if (sentry.length) {
                    settings.dota_bots[account].sha_sentryfile = sentry;
                }
            }
        } catch (e) {
            console.log("No sentry provided");
        }

        if (settings.web.enabled === "true") {
            settings.web.mongodb = config.web.mongodb;
            settings.web.redisdb = config.web.redisdb;
            settings.web.apikey = config.web.apikey;
            settings.web.baseurl = config.web.baseurl;
            settings.web.port = config.web.port;
            settings.web.league_name = config.web.league_name;
            settings.web.style = config.web.style;
        }
    } else {
        console.log("config file empty, generating new and exiting");
        fs.writeFile('config.json', JSON.stringify(sampleConfig, null, 2), function(e) {
            if (e) {
                console.log(e);
                process.exit(1);
            } else {
                console.log("config file generated in root directory (./config.json)");
                process.exit(1);
            }
        });
    }
} catch (err) {

    if (err.code !== "ENOENT") {
        throw err;
        process.exit(1);
    }

    console.log("config file not found, generating and exiting");
    fs.writeFile('config.json', JSON.stringify(sampleConfig, null, 2), function(e) {
        if (e) {
            console.log(err);
            process.exit(1);
        } else {
            console.log("config file generated in root directory (./config.json)");
            process.exit(1);
        }
    });
}

var permissions = {
    "canKick": 16,
    "canTalk": 8,
    "canBan": 256,
    "isOwner": 512
};

// prepend the fantasy character (command character) to the keys in settings.commands and add proper permissions
for (var key of Object.keys(settings.commands)) {
    for (var perm of Object.keys(permissions)) {
        if (settings.commands[key] == perm) {
            settings.commands[key] = permissions[perm];
        }
    }
    settings.commands[settings.commandChar + key] = settings.commands[key];
    delete(settings.commands[key]);
}

// prepend the fantasy character (command character) to the keys in settings.commands_dota and add proper permissions
for (var key of Object.keys(settings.commands_dota)) {
    for (var perm of Object.keys(permissions)) {
        if (settings.commands_dota[key] == perm) {
            settings.commands_dota[key] = permissions[perm];
        }
    }
    settings.commands_dota[settings.commandChar + key] = settings.commands_dota[key];
    delete(settings.commands_dota[key]);
}

util.log(settings.commands_dota);

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
  //graceful shutdown
  process.exit();
});


// for use with the actual steam bot
module.exports.logOnDetails = settings.steam;
module.exports.botname = settings.botname;
module.exports.commands = settings.commands;
module.exports.commands_dota = settings.commands_dota;
module.exports.commandChar = settings.commandChar;
module.exports.chatID = settings.chatID;
module.exports.region = settings.region;

// account information for the dota bots
module.exports.dota_bots = settings.dota_bots;

// for use with the webserver part
module.exports.web_settings = settings.web;
