var request = require('request');

function addPageIfNotAdded(pageId, pageTitle)
{
		
	request.get("http://secure-caverns-7325.herokuapp.com/add?article=" + pageTitle, function(error, response, body){
		if (error)
		{
			console.log("Error when saving " + pageTitle + ": " + error );
			return;
		}

		if ('error' in response)
		{
			console.log("Error when saving " + pageTitle + ": " + response.error );
			return;
		}

		console.log("Added: " + pageTitle);



	});

}

function curlPages(from, num, done)
{
	request.post('http://www.nissepedia.com/api.php', function(error, response, body){
		
		var responseObject = JSON.parse(body);

		if ('query' in responseObject)
		{
			if ('allpages' in responseObject['query'])
			{
				for(var key in responseObject['query']['allpages']) { 
					var obj = responseObject['query']['allpages'][key];

					var title = obj['title'];
					var pageid = obj['pageid'];

					addPageIfNotAdded(pageid, title);
				}
			}
		}

		// see if er should continue to query. In that case we will get back this beutiful response
		if ('query-continue' in responseObject)
		{
			if ('allpages' in responseObject['query-continue'])
			{
				if ('apcontinue' in responseObject['query-continue']['allpages'])
				{
					var nextEntryStart = responseObject['query-continue']['allpages']['apcontinue'];

					// curl next block
					curlPages(nextEntryStart, num, done);
					//done();

				}
			}
		}else
		{
			console.log("final entry");
			done();
		}


	}).form({action: 'query', list: 'allpages', apfrom: from ,aplimit: num, format: 'json'});
}

curlPages('', 50, function(){
	console.log("All found");
});