var config = require('./config.js')

var more =	function(bot, event)
{
	this.bot = bot
	this.event = event
	this.user_model = this.bot.getModel('user');
}

more.prototype = {
	
	showMore: function(msg)
	{
		var that = this
		this.bot.getModel('user').getUpdateTimezoneToken(that.event.sender.id, function(token)
			{
				var elements = [
					{
						'title': 'More Options ' ,
						"subtitle": 'What do you want to do?' ,
						
						"buttons": [{
								"type": "postback",
								"title": "Search",
								"payload": JSON.stringify({'msg': msg, 'controller': 'search', 'method': 'prompt'})
							},{
								"type": "postback",
								"title": "See My Topics",
								"payload": JSON.stringify({'controller': 'search', 'method': 'showTopics'}),
							}, {
								
								"type": "postback",
								"title": "See Reminders",
								"payload": JSON.stringify({'controller': 'search', 'method': 'showReminders'}),
							}
						]
					},
					{
						'title': 'Advanced',
						'subtitle': 'Advanced options',
						
						'buttons': [{
								
								"type": "postback",
								"title": "Delete This Note",
								"payload": JSON.stringify({'controller': 'search', 'method': 'delete'})
							}, {
								"type": "web_url",
								"title": "Update Timezone",
								"url": config.base_url + '/timezone?token=' + token
						}]
					}
				]
				that.bot.sendGenericMessage(that.event.sender.id, elements)
			}
		)
	}

}


module.exports = more