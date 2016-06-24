var bot = require('./bot.js')

var interval = setInterval(function() {
	//console.log('checking for reminders');
	var _bot = new bot()
	_bot.sendReminders();
}, 5000);
