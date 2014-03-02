utils = require('./utils.js')
message = require('./message.js')

exports.generateJson = function(attack, req, i) {
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
            resJson = resJson + '"num_scenario": "' + req.session.numScenario + '",';
            resJson = resJson + '"num_attack": "' + i + '"'; 

            req.session.id_attaque = req.session.id_attaque + 1;
        }
    // Dictionnary attack
    } else if (attack.type_attack == "dico") {

        // Flush array and generate dictionnary entries
        // generate_dictionnary_payloads(attack);
        array_attacks_dico = utils.generateDictionnaryPayloads(attack);

        for (var j = 0; j < array_attacks_dico.length; j++) {

            // HTTP GET Request
            if (attack.method == "GET") {
                resJson = resJson + '{"method": "GET", "url": "';
                resJson = resJson + attack.url.replace(/<%value%>/g, array_attacks_dico[j]);
                resJson = resJson + '"},';
            // HTTP POST Request
            } else {
                resJson = resJson + '{"method": "POST", ';
                resJson = resJson + '"num_scenario": "' + req.session.numScenario + '",';
                resJson = resJson + '"val": "' + array_attacks_dico[j] + '",';
                resJson = resJson + '"num_attack": "' + i + '"'; 
                resJson = resJson + '},';
            }
        }

        resJson = resJson.substring(0, resJson.length - 2);
    } else {
        message.error("It seems there's a problem with some attacks. Check your JSON conf file.");
    }
    return resJson;
}