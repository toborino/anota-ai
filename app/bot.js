var diagnose = require('./diagnose.js')
var request = require('request')
var dateformat = require('dateformat')
var config = require('./config.js')

var bot = function(req, res)
{
	this.req = req
	this.res = res
	this.pgClient = require('./db.js')
	this.token = config.token
}

bot.prototype = 
{
    webhook : function() {
		messaging_events = this.req.body.entry[0].messaging
		for (i = 0; i < messaging_events.length; i++) {
			event = this.req.body.entry[0].messaging[i]

			sender = event.sender.id
			if (event.postback) {
				console.log(event.postback.payload)
				event.postback.payload = JSON.parse(event.postback.payload)
				this.getController(event.postback.payload.controller, event)[event.postback.payload.method]();
				continue
			}
			
			if (event.message && event.message.text) {
				if(event.message.text=='/timezone')
				{
					this.getController('diagnose', event).prompt(event.message.text)
				}
				else
				{
					var that = this
					that.getModel('user').getInputMode(sender, function(mode)
						{
							if(!mode)
							{
								mode = 'reminder.acceptMessage';
							}
							var parts = mode.split('.');
							var controller_name = parts[0]
							var controller_method = parts[1]
							
							that.getController(controller_name, event)[controller_method](event.message.text);
						
						}
					)
				}
			}
			else
			{
				console.log(event)
			}
			
		}
		if(!this.res.headerSent)
		{
			this.res.send('ok')
		}
		
	}
	
	,
	
	getController: function(_controller, event)
	{
		var file = './' + _controller.replace(/\W/, '') + '.js'
		var controller = require(file)
		return new controller(this, event)
	}
	,
	
	getModel: function(model)
	{
		var file = './models/' + model.replace(/[\W]/, '') + '.js';
		var model = require(file)
		return new model(this)
	}
	,
		
	test: function()
	{
		this.webhook()
		
	}
	,
	
	
	sendTextMessage : function(sender, text) {
		messageData = {
			text:text
		}
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: {access_token:this.token},
			method: 'POST',
			json: {
				recipient: {id:sender},
				message: messageData,
			}
		}, function(error, response, body) {
			if (error) {
				console.log('Error sending messages: ', error)
			} else if (response.body.error) {
				console.log('Error: ', response.body.error)
			}
		})
	}
	,
	
	
	
	
	sendReminders: function()
	{
		var that = this;
		that.pgClient.query('SELECT * FROM "notes" WHERE notified = FALSE AND reminder_at IS NOT NULL AND reminder_at <= \'' + dateformat(new Date(), 'yyyy-mm-dd H:MM:00') + '\'').on('row', function(row) {
			console.log('reminding: ' , row);
			that.sendTextMessage(row.user_id, 'You asked me to remind you about the following: ' + row.text);
			that.pgClient.query('UPDATE "notes" SET notified = TRUE WHERE id = ' + row.id);
		});
	}
	
	,
	
	
	
	sendGenericMessage: function(sender, elements) {
		messageData = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": elements
				} 
			}
		}
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: {access_token:this.token},
			method: 'POST',
			json: {
				recipient: {id:sender},
				message: messageData,
			}
		}, function(error, response, body) {
			if (error) {
				console.log('Error sending messages: ', error)
			} else if (response.body.error) {
				console.log('Error: ', response.body.error)
			}
		})
	}
	
	
	,
	getProfile: function(user_id, callback)
	{
		request({
			url: 'https://graph.facebook.com/v2.6/' + user_id,
			qs: {'fields': 'first_name,last_name,profile_pic,locale,timezone,gender', 'access_token':this.token},
			method: 'GET',
		}, function(error, response, body) {
			if (error) {
				console.log('Error fetching profile #: ' + user_id, error)
			} else if (response.body.error) {
				console.log('Error fetching profile #: ' + user_id, response.body.error)
			}
			else {
				try {
					callback(JSON.parse(body));
				}
				catch(ex)
				{
					console.log('Error decoding profile', body)
				}
				
			}
		})
	}
	
	
	,
	url: function(path)
	{
		var that = this
		switch(path)
		{
			case 'timezone':
				if (this.req.method == 'GET')
				{
					var fs = require('fs');
					fs.readFile(__dirname + '/template/timezone.html', 'utf8', function (err, data)
						{
							if(err)
							{
								return console.log(err)
							}
							data = data.replace('{{token}}', that.req.query['token']);
							that.res.send(data)
						}
					)
				}
				else
				{
					var token = that.req.body.token;
					var offset = that.req.body.offset;
					var timezone = require('./timeFormat.js').offsetToTimezone(offset)
					console.log(timezone, offset)
					that.getModel('user').updateTimezone(token, timezone, function(err, row)
						{
							if(err)
							{
								console.log(err);
								that.res.send('Error occured, but we have been notified!')
							}
							else
							{
								fs.readFile(__dirname + '/template/timezone-set.html', 'utf8', function (err, data)
									{
										if(err)
										{
											return console.log(err)
										}
										that.res.send(data)									
									}
								)
							}
						}
					)
				}
		}
	}
}


module.exports = bot