var redis = require('redis');
var express = require('express');
var md5 = require('MD5');

var app = express();


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


var client = redis.createClient(11022, 'crestfish.redistogo.com');

client.on('error', function (err) {
	console.log('Error ' + err);
});

client.auth('1cf8607cffe1c62d53b5ee481ec148ff', function() {
	console.log('Connected!');

	/*
	 client.set('an_article', '{"some":"json", "here":"then"}', redis.print);
	 client.get('an_article', function(err, reply){
		console.log('Found this: ' + reply);
	 });
	*/

/*
	client.hset('test_articles', 'First article', md5('First article'), redis.print);
	client.hset('test_articles', 'Second article', md5('Second article'), redis.print);
	client.hset('test_articles', 'Third article', md5('Third article'), redis.print);
	client.hset('test_articles', 'Fourth article', md5('Fourth article'), redis.print);
	*/


	app.use('/static', express.static(__dirname + '/public'));


	app.get('/add', function(req, res){

		if (!('article' in req.query))
		{
			res.send(500, {error: 'must provide query article'});
			return;
		}

		var name = req.query.article;
		var hash = md5(req.query.article);

		client.hset('test_articles', name, hash, function(err, result)
		{
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
				return;
			}

			var defaultObj = 
			{
				title: name,
				include: false,
				comment: 'no',
				id: 1234
			};

			client.hmset(hash, defaultObj, function(err, result)
			{
				if (err)
				{
					res.send(500, {error: 'failed with: ' + err});
					return;
				}
				res.send('OK');
			});

			
		});

	});

	app.get('/list', function(req, res){

		client.hgetall("test_articles", function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send(obj);	
			}
		});
		
	});

	app.get('/get', function(req, res){

		if (!('hash' in req.query))
		{
			res.send(500, {error: 'must provide query hash'});
			return;
		}

		var hash = req.query.hash;

		client.hgetall(hash, function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send(obj);	
			}
		});
		
	});

	app.get('/set', function(req, res){

		if (!('hash' in req.query))
		{
			res.send(500, {error: 'must provide query hash'});
			return;
		}

		if (!('key' in req.query))
		{
			res.send(500, {error: 'must provide query key'});
			return;
		}

		if (!('value' in req.query))
		{
			res.send(500, {error: 'must provide query value'});
			return;
		}

		var hash = req.query.hash;
		var key = req.query.key;
		var value = req.query.value;

		var keys = ['comment', 'include', 'id'];
		if (keys.indexOf(key) === -1)
		{
			res.send(500, {error: 'wrong key. only: ' + keys.join()});
			return;
		}

		client.hset(hash, key, value, function (err, obj) {
			if (err)
			{
				res.send(500, {error: 'failed with: ' + err});
			}else
			{
				res.send("OK");	
			}
		});
		
	});

	app.listen(3000);

});

