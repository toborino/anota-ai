var bot = require('./bot.js')

var interval = setInterval(function() {
	console.log('checking for reminders from background process #' + process.pid);
	var _bot = new bot()
	_bot.setToken(token);
	_bot.sendReminders();
}, 30000);
