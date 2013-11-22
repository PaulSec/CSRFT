var fs = require('fs');
var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app); 

var conf_file = undefined;
var content_file = undefined;
var array_attacks_dico = [];

var logger = function(req, res, next) {
    console.log(req.connection.remoteAddress + " tried to access : " + req.url)
    next(); // Passing the request to the next handler in the stack.
}

// configuration
app.configure(function(){
	// Session management
	app.use(express.cookieParser());
	app.use(express.session({secret: 'privateKeyForSession'}));
	app.use("/js", express.static(__dirname + '/public/js')); // javascript folder

	app.set('views', __dirname + '/views'); // views folder
	app.set('exploits', __dirname + '/exploits'); // exploits folder
	app.set('view engine', 'ejs'); // view engine for this projet : ejs

    app.use(logger); // Here you add your logger to the stack.
    app.use(app.router); // The Express routes handler.
});

// /payload/:hash : url to get the payload for iframes
app.get('/payload/:id_scenario/:id_attaque/:val', function(req, res) {

	 parse_data_and_send_payload_for_forms(req, res, content_file);

});

// /exploit : send exploits in JSON format
app.get('/exploit', function(req, res) {
	// initialize sessions
	init_sessions_and_exit_if_over(req, res);
	// set conten-type
	res.setHeader('Content-Type', 'application/json');

	// send first exploits
	parse_data_and_send_exploits(req, res, content_file);
});

app.get('/', function(req, res) {
	res.render('index.ejs');
});



// check for command line argument configuration file.json
if (process.argv[2] == undefined) {
	console.log("Usage : node server.js <file.json> <port : default 8080>");
	process.exit(1);
} else {
	console.log("Using " + process.argv[2] + " as configuration file");
	conf_file  = process.argv[2];

	// try opening file  and raise error if there's any
	fs.readFile(conf_file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error while trying to open : ' + process.argv[2]);
			process.exit(1);
		}
		content_file = JSON.parse(data);

		server.listen(process.argv[3] == undefined ? 8080 : process.argv[3]);
		console.log("Listening on port %d", server.address().port);
	});
}

/******************************************
				Functions
******************************************/

function init_sessions_and_exit_if_over(req, res) {
	if (req.session.finished == true) {
		res.send("[]");
	}

	if (req.session.num_scenario == undefined) {
		console.log("Initializing session for user " + req.connection.remoteAddress);
		req.session.num_scenario = 0;
		req.session.num_attack = 0;
		req.session.finished = false;
	} else {
		req.session.num_scenario = req.session.num_scenario + 1;
		req.session.num_attack = 0;
	}
}

function log_message(req, res, message) {
	console.log(message);
	res.send(message);
}

// Generate the JSON sent to the client with payloads
function generate_next_payloads(req, data) {
	var resJson = '[';
	var i = 0;
	// iterate on all simultaneous attacks
	for (var index in data.audit.scenario[req.session.num_scenario].attack) {
		var attack = data.audit.scenario[req.session.num_scenario].attack;

		resJson = resJson + generateJson(attack[index], req, i);

		resJson = resJson + "},";
		i = i + 1;
	} 
	resJson = resJson.substring(0, resJson.length - 1) + "]";
	return resJson;
}

// Function called for POST HTTP Request exploitation
function parse_data_and_send_payload_for_forms(req, res, data) {
	var scenario = data.audit.scenario;
	var id_scenario = req.params.id_scenario;
	var id_attaque = req.params.id_attaque;
	var val = req.params.val;

	if (scenario[id_scenario] != undefined 
		&& scenario[id_scenario].attack[id_attaque] != undefined) {

		var elem = scenario[id_scenario].attack[id_attaque];

		// check that the attack passed in argument is well a POST-attack.
		if (elem.method == "POST") {
			var form_file = __dirname + '/exploits/' + elem.form;
			fs.readFile(form_file, 'utf8', function (err, data_form) {
				if (err) {
					console.log('Error: ' + err);
					return;
				}
				// replace the <%value%> token by the value
				data_form = data_form.replace(/<%value%>/g, val);
				res.render('template_exploit.ejs', {body: data_form});
			});

		} else {
			log_message(req, res, "Element with those info is for GET Payload. ");
		}
	} else {
		log_message(req, res, "This payload does not exist.");
	}
}

// Send the JSON containing all the new attacks
function parse_data_and_send_exploits(req, res, data) {
	// scenario existing
	if (data.audit.scenario[req.session.num_scenario] != undefined) {

		resJson = generate_next_payloads(req, data);

		res.send(resJson);
		resJson =JSON.parse(resJson);
		console.log('Sending JSON data (' + resJson.length + ' attack(s))');
	} else {
		req.session.finished = true;
		res.send("[]");
	}
}

// Open the dictionnary for a specified attack and load the entries
function generate_dictionnary_payloads(attack) {
	array_attacks_dico = [];
	var dico_file = __dirname + '/dicos/' + attack.file;

	fs.readFileSync(dico_file).toString().split('\n').forEach(function (line) { 
    array_attacks_dico.push(line);
	});
}

// Generate the JSON sent to the client (GET / POST Requests included)
function generateJson(attack, req, i) {

	var resJson = "";
	// Special value "attack"
	if (attack.type_attack == "special_value") {

		// HTTP GET Request
		if (attack.method == "GET") {
			resJson = resJson + '{"method": "GET", "url": "';
			resJson = resJson + attack.url + '"';
		// HTTP POST Request
		} else {
			resJson = resJson + '{"method": "POST", ';
			resJson = resJson + '"val": "' + attack.val + '",';
			resJson = resJson + '"num_scenario": "' + req.session.num_scenario + '",';
			resJson = resJson + '"num_attack": "' + i + '"'; 

			req.session.id_attaque = req.session.id_attaque + 1;
		}
	// Dictionnary attack
	} else if (attack.type_attack == "dico") {

		// Flush array and generate dictionnary entries
		generate_dictionnary_payloads(attack);

		for (var j = 0; j < array_attacks_dico.length; j++) {

			// HTTP GET Request
			if (attack.method == "GET") {
				resJson = resJson + '{"method": "GET", "url": "';
				resJson = resJson + attack.url.replace(/<%value%>/g, array_attacks_dico[j]);
				resJson = resJson + '"},';
			// HTTP POST Request
			} else {
				resJson = resJson + '{"method": "POST", ';
				resJson = resJson + '"num_scenario": "' + req.session.num_scenario + '",';
				resJson = resJson + '"val": "' + array_attacks_dico[j] + '",';
				resJson = resJson + '"num_attack": "' + i + '"'; 
				resJson = resJson + '},';
			}
		}

		resJson = resJson.substring(0, resJson.length - 2);
	} else {
		console.log("It seems there's a problem with some attacks. Check your JSON conf file.")
	}
	return resJson;
}