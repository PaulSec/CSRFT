var fs = require('fs');

// Open the dictionnary for a specified attack and load the entries
// and return the array with all the entries
exports.generateDictionnaryPayloads = function(attack) {
    array_attacks_dico = [];
    data = null;
    
    try {
        data = fs.readFileSync(attack.file);
    } catch (e) {
        try {
            data = fs.readFileSync(__dirname + '/../dicos/' + attack.file);
        } catch (e) {
            console.log(e);
        }
    }

    if (data != null) {
        data.toString().split(/\r?\n/).forEach(function (line) { 
            array_attacks_dico.push(line);
        });     
    }
    return array_attacks_dico;
}

//
// Init/manages the session of the user 
//
exports.initSessionsAndExitIfNoMorePayload = function(req, res) {
    if (req.session.finished == true) {
        res.send("[]");
    }

    if (req.session.numScenario == undefined) {
        message.info("Initializing session for user " + req.connection.remoteAddress);
        // console.log();
        req.session.numScenario = 0;
        req.session.numAttack = 0;
        req.session.finished = false;
    } else {
        req.session.numScenario = req.session.numScenario + 1;
        req.session.numAttack = 0;
    }
}