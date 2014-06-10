json = require('./json-helper.js')
payload = require('./payload.js')
fs = require('fs')
message = require('./message.js')

//
// Will generate the JSON that will be sent to the client
//
exports.generateNextPayloads = function(req, data) {
    var resJson = '[';
    var i = 0;
    // iterate on all simultaneous attacks
    for (var index in data.audit.scenario[req.session.numScenario].attack) {
        var attack = data.audit.scenario[req.session.numScenario].attack;

        resJson = resJson + json.generateJson(attack[index], req, i);

        resJson = resJson + "},";
        i = i + 1;
    } 
    resJson = resJson.substring(0, resJson.length - 1) + "]";
    return resJson;
}

//
// Generates and sends payloads through JSON to the client
//
exports.generateAndSendPayloads = function(req, res, data) {
    // scenario existing
    if (data.audit.scenario[req.session.numScenario] != undefined) {
        resJson = payload.generateNextPayloads(req, data);
        res.send(resJson);

        resJson =JSON.parse(resJson);
        message.info('Sending JSON data (' + resJson.length + ' attack(s))')
    } else {
        message.error('No more payloads send to the client');
        req.session.finished = true;
        res.send("[]");
    }
}

// Function called for POST HTTP Request exploitation
// Loads payload "on the fly"
exports.loadPayloadAndSendIt = function(res, form_file, val) {
    try {
        data = fs.readFileSync(form_file);
    } catch (e) {
        try {
            data = fs.readFileSync(__dirname + '/../exploits/' + form_file);
        } catch (e) {
            console.log(e);
        }
    }

    if (data != null) {
        data = data.toString().replace(/<%value%>/g, val);
        res.render('template_exploit.ejs', {body: data});
    }
}