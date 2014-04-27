var fs = require('fs');
var express = require('express');
var http = require('http');
var payload = require('./lib/payload.js')
var utils = require('./lib/utils.js')
var message = require('./lib/message.js')

var app = express();
var server = http.createServer(app); 

var configurationFile = undefined;
var contentFile = undefined;

var logger = function(req, res, next) {
	message.log(req.connection.remoteAddress + " tried to access : " + req.url)
    next(); // Passing the request to the next handler in the stack.
}

// Configuration
app.configure(function() {
	// Session management
	app.use(express.cookieParser());
	app.use(express.session({secret: 'privateKeyForSession'}));
	app.use("/js", express.static(__dirname + '/public/js')); // javascript folder

	app.set('views', __dirname + '/views'); // views folder
	app.set('view engine', 'ejs'); // view engine for this projet : ejs	
	// app.set('exploits', __dirname + '/exploits'); // exploits folder

    app.use(logger); // Here you add your logger to the stack.
    app.use(app.router); // The Express routes handler.
});


// /payload/:hash : url that generate forms embedded in iframes on client-side
app.get('/payload/:idScenario/:idAttack/:val', function(req, res) {
	var scenario = contentFile.audit.scenario;
	var idScenario = req.params.idScenario;
	var idAttack = req.params.idAttack;
	var val = req.params.val;

	if (scenario[idScenario] != undefined 
		&& scenario[idScenario].attack[idAttack] != undefined) {

		var elem = scenario[idScenario].attack[idAttack];

		// check that the attack passed in argument is well a POST-attack.
		if (elem.method == "POST") {
			payload.loadPayloadAndSendIt(res, elem.form, val);
		} else {
			message.error("Element with those info is for GET Payload. ", res)
		}
	} else {
		message.error(res, "This payload does not exist.", res);
	}
});

// /exploit : send exploits in JSON format
app.get('/exploit', function(req, res) {
	// initialize sessions
	utils.initSessionsAndExitIfNoMorePayload(req, res);
	// set content-type
	res.setHeader('Content-Type', 'application/json');

	// send payloads in JSON
	payload.generateAndSendPayloads(req, res, contentFile);
});

app.get('/', function(req, res) {
	res.render('index.ejs');
});


// check for command line argument configuration file.json
message.log("CSRFT: Toolkit for CSRF vulnerabilities.");
if (process.argv[2] == undefined) {
	console.log("Usage : node server.js <file.json> <port : default 8080>");
	process.exit(1);
} else {
	message.info("Using " + process.argv[2] + " as configuration file");
	configurationFile  = process.argv[2];

	// try opening file  and raise error if there's any
	fs.readFile(configurationFile, 'utf8', function (err, data) {
		if (err) {
			message.error('Error while trying to open : ' + process.argv[2]);
			process.exit(-1);
		}
		contentFile = JSON.parse(data);

		server.listen(process.argv[3] == undefined ? 8080 : process.argv[3]);
		message.info("Listening on port " + server.address().port);
	});
}