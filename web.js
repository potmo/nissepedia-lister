var redis = require('redis');
var express = require('express');
var md5 = require('MD5');
var logfmt = require("logfmt");

var app = express();

app.use(logfmt.requestLogger());


/*
commands: http://redis.io/commands
redistogo: https://redistogo.com/instances/293756?language=en
express: http://expressjs.com/api.html
node-redis: https://github.com/mranney/node_redis



http://localhost:3000/list
http://localhost:3000/add?article=macka
http://localhost:3000/get?hash=988ce150657bed00b8f266f88e47554a
http://localhost:3000/set?hash=988ce150657bed00b8f266f88e47554a&key=comment&value=hej

*/


var client;
var redisAuthString;

if (process.env.REDISTOGO_URL) {
	var rtg = require("url").parse(process.env.REDISTOGO_URL);
	client = redis.createClient(rtg.port, rtg.hostname);
	redisAuthString = rtg.auth.split(":")[1];
} else {
	client = redis.createClient();
	redisAuthString = "";
}

 

client.on('error', function (err) {
	console.log('Error ' + err);
});


var users = ['hk', 'pot', 'jpn', 'tb'];
var editpassword = 'videnskaben';


function validateUserAndPass(req, res)
{
	if (!('pass' in req.query))
	{
		res.send(500,  {error: 'must have pass in query'});
		return false;
	}

	if (!('user' in req.query))
	{
		res.send(500,  {error: 'must have user in query'});
		return false;
	}

	if (req.query.pass !== editpassword || users.indexOf(req.query.user) === -1)
	{
		res.send(500, {error: 'wrong username or password'});
		return false;
	}

	return true;
}

function validateArguments(req, res, args)
{

	for (var i = 0; i < args.length; i++) {
		var arg = args[i];

		if (!(arg in req.query))
		{
			res.send(500, {error: 'must provide query ' + arg});
			return false;
		}
	}

	return true;

}




client.auth(redisAuthString, function() {
	console.log('Connected!');

	

	app.use('/static', express.static(__dirname + '/public'));


	app.get('/add', function(req, res){

		if (!validateUserAndPass(req, res)) return;
		if (!validateArguments(req, res, ['article'])) return;

		var name = req.query.article;
		var hash = md5(req.query.article);

		client.zadd('test_articles_set', 0, name, function(err, result)
		{
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
				return;
			}

			if (result === 0)
			{
				// no element added
				res.send(500, {error: 'element already exist'});
				return;
			}

			var defaultObj = 
			{
				title: name,
				comment: 'no',
				id: 1234
			};


			client.hmset(name, defaultObj, function(err, result)
			{
				if (err)
				{
					res.send(500, {error: 'failed with: ' + err});
					return;
				}
				res.send(200, {status: 'ok'});	
			});

		});

	});

	app.get('/list', function(req, res){

		if (!validateUserAndPass(req, res)) return;
		if (!validateArguments(req, res, [])) return;
		

		client.zrange("test_articles_set", 0,-1, function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send(obj);	
			}
		});
		
	});

	app.get('/sortlist', function(req, res){

		if (!validateUserAndPass(req, res)) return;
		if (!validateArguments(req, res, [])) return;

		client.sort('test_articles_set', 'ALPHA', function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send(200, {status: 'ok'});	
			}
		});
	});

	app.get('/get', function(req, res){

		if (!validateUserAndPass(req, res)) return;
		if (!validateArguments(req, res, ['name'])) return;

		var name = req.query.name;

		client.hgetall(name, function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send(obj);	
			}
		});
		
	});

	app.get('/setinclude', function(req, res){

		if (!validateUserAndPass(req, res)) return;
		if (!validateArguments(req, res, ['name', 'value'])) return;

		var name =  req.query.name;
		var key = 'include_' + req.query.user;
		var value = req.query.value;

		client.hset( name, key, value, function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send(200, {status: 'ok'});	
			}
		});



	});

	app.get('/set', function(req, res){

		if (!validateUserAndPass(req, res)) return;
		if (!validateArguments(req, res, ['name', 'value', 'key'])) return;
	
		var name = req.query.name;
		var key = req.query.key;
		var value = req.query.value;

		var keys = ['comment', 'include', 'id'];
		if (keys.indexOf(key) === -1)
		{
			res.send(500, {error: 'wrong key. only: ' + keys.join()});
			return;
		}

		client.hset(name, key, value, function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send(200, {status: 'ok'});	
			}
		});
		
	});

	var port = Number(process.env.PORT || 5000);
	app.listen(port);

});



