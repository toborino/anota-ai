var config = require('./config.js')

var more =	function(bot, event)
{
	this.bot = bot
	this.event = event
	this.user_model = this.bot.getModel('user');
}

more.prototype = {
	
	askForTimezone: function()
	{
		var that = this
		this.bot.getModel('user').getUpdateTimezoneToken(that.event.sender.id, function(token)
			{
				var elements = [
					{
						'title': 'Traveling?',
						'subtitle': 'Press the button and we will instantly update your timezone',
						
						'buttons': [{
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
	
	,
	
	getStarted: function()
	{
		var that = this;
		that.bot.sendImageMessage(that.event.sender.id, config.base_url + '/images/tutorial/Welcome.gif', function(resBody)
			{
				that.bot.sendButtonsMessage(that.event.sender.id, "Hi, I am an AI Powered Task Manager and I can help you get things done:)\n\nSimply write your Notes & To-Do's and I'll organize them for you via the Menu\n\nSee What I can Do!", 
					[
							{
								"type": "postback",
								"title": "See What I can Do",
								"payload": JSON.stringify({'controller': 'more', 'method': 'whatsPossible'})
							},
							{
								"type": "postback",
								"title": "Start a Note",
								"payload": JSON.stringify({'controller': 'more', 'method': 'startANote'})
							}
					]
				)
			}
		)
	}
	
	,
	
	whatsPossible: function() 
	{
		var that = this;
		that.bot.sendGenericMessage(that.event.sender.id, [
			{
				'title': "What can Ai Do",
				'subtitle': "Soon, Ai will soon be able to DO some of your task for you!",
				'image_url': config.base_url + '/images/tutorial/PoweredByAi.png',
				
				"buttons": [
					{
						"type": "postback",
						"title": "Share Me",
						"payload": JSON.stringify({'controller': 'more', 'method': 'shareMe'})
					}
				]
			}
			
			,
			
			{
				'title': "I am Best Used as a Task Manager",
				'subtitle': "With 1 Glance you can Instantly See all of your Tasks via Menu!",
				'image_url': config.base_url + '/images/tutorial/to-do-list.png',
			}
			,

			{
				'title': "How to Write a Note",
				'subtitle': "Anything you Write Becomes a Sticky Note except when adding a Reminder",
				'image_url': config.base_url + '/images/tutorial/rules.png',
			}
			,
			
			{
				'title': "How to Find Your Notes",
				'subtitle': "Go to Menu and select 'Recent Notes...' or 'Search' using Keywords.",
				'image_url': config.base_url + '/images/tutorial/Search.png',
			}
			,
			
			{
				'title': "Adding & Editing Reminders",
				'subtitle': "To Edit/Upadate/Add a reminder use 'Add Remider'. Then 'in 1hr' or 'at 6pm'.",
				'image_url': config.base_url + '/images/tutorial/Reminder.png',
			}
			,
			
			{
				'title': "Share your Ideas Instantly",
				'subtitle': "Easily Send Friends your To-Do list and Instantly Share your Ideas :)",
				'image_url': config.base_url + '/images/tutorial/Share.png',
				"buttons": [
					{
						"type": "postback",
						"title": "Try Sharing Now",
						"payload": JSON.stringify({'controller': 'more', 'method': 'shareMe'})
					}
				]
			}
			,
			
			{
				'title': "See More with #Hashtags",
				'subtitle': "When you use the same #hashtag more than once, I'll show you related notes.",
				'image_url': config.base_url + '/images/tutorial/Hashtags.png',
			}
			,

			{
				'title': "How to Delete a Task",
				'subtitle': "To Delete a Task just select 'Mark Done' and I'll get rid of it.",
				'image_url': config.base_url + '/images/tutorial/delete.png',
			}
			,
			
			{
				'title': "Need Help?",
				'subtitle': "Need some Human Intervention? We can help, just send us a message.",
				'image_url': config.base_url + '/images/tutorial/Help.png',
				"buttons": [
					{
						"type": "web_url",
						"title": "Get Help",
						"url": "http://m.me/279172302436701"
					}
				]
			}
		])
	}
	
	,
	
	startANote: function()
	{
		var that = this;
		that.bot.sendImageMessage(that.event.sender.id, config.base_url + '/images/tutorial/13705099_503972646464264_238141464_n.gif', function(resBody)
			{
				that.bot.sendTextMessage(that.event.sender.id, "Awesome! Whatever you write, I'll turn it into a Sticky Note!\n\nYou can use #hashtags and I’ll respond with a few options :)\n\nWhat would you like to Get Done Today?")
			}
		)
	}
	
	,
	
	shareMe: function()
	{
		var that = this;
		that.bot.sendTextMessage(that.event.sender.id, 'Check it out! Imagine if your Notes were Smart and Powered by Ai and Could Talk Back! ' + "\nhttp://m.me/SmartNotesBot")
	}
	
	,
	
	showHelp: function() 
	{
		var that = this
		var elements = [
			{
				'title': 'Need Help?',
				'subtitle': 'Check out the Tutorial. We can help, just send us a message.',
				'image_url': config.base_url + '/images/tutorial/Help.png',
				'buttons': [
					{
						"type": "postback",
						"title": "See Tutorial",
						"payload": JSON.stringify({'controller': 'more', 'method': 'whatsPossible'})
					}
					,
					{
						"type": "web_url",
						"title": "Feedback",
						"url": 'http://m.me/279172302436701'
					}
					,
					{
						"type": "web_url",
						"title": "Get Help",
						"url": 'http://m.me/279172302436701'
					}
				]
			}
		]
		that.bot.sendGenericMessage(that.event.sender.id, elements)
	}
}


module.exports = more