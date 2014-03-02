var colors = require('colors');

colors.setTheme({
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

// Log messages (Green)
exports.log = function (message) {
    console.log(message.info);
}

// Error messages (Red)
exports.error = function (message, res) {
    if (res != undefined) {
        res.send(message);
    }
    console.log(message.error);   
}

// Warning messages (Yellow)
exports.info = function (message) {
    console.log(message.warn);
}