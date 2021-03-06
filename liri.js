/* 
	LIRI for Node

	Run "npm install" before running liri.js.

	Table of Contents
	---------------------------------------------------------------------------
	1 - Configuration	- configure twitter account info and default behavior
	2 - Log file		- log file operations
	3 - OMDB 			- omdb api operations
	4 - Spotify			- spotify api operations
	5 - Twitter			- twitter api operations
	6 - Helpers			- helper functions
	7 - Main			- define and run main application
*/
// globaly required modules
try {
	var keys = require( "./keys.json"); // api keys
	var fs = require('fs');
	var moment = require("moment-twitter"); // for time formatting
} catch (e) {
	var msg = "";
	if ( e.code === 'MODULE_NOT_FOUND') {
		msg = e.message + "\nPlease install dependencies by running the following command: \"npm install\"";
	} else {
		msg = e.message;
	}
	return console.log(msg);
}

/*
-------------------------------------------------------------------------------
1 - Configuration

Global variables for configuring account info and default behavior.
-------------------------------------------------------------------------------
*/
var twitterUserName = "jpdTests";
var defaultMovie = "Mr. Nobody";
var defaultSong = "The Sign";

// relative path and file name for log file
var logFile = "log.txt";  

/*
-------------------------------------------------------------------------------
2 - Log file

Methods and properties for logging to text file.
-------------------------------------------------------------------------------
*/
// Log provides a single method: 'append' used to add data to the logFile.
var Log = (function() {
	// get the arguments passed to Liri.js
	var command = process.argv.slice(2).join(" ");

	// Appends data as a string to logFile
	var appendToLog = function(data) {
		// do nothing if error occurs while appending to the log file
		fs.appendFile(logFile, data, function() {});
	}
	return {
		// Appends an entry to the log file
		append: function(entry) {
			var entryTime = moment().format(); // time stamp string			
			// apply formatting to the string to append to the log
			var entry = "\n\n" + "=".repeat(50) + "\n\n" + 
				entryTime + "\n" + command + ":\n" + entry;
			// add entry to log
			appendToLog(entry);
		}
	};
})();
/*
-------------------------------------------------------------------------------
3 - OMDB

Methods and properties for handling requests and rendering output for the
omdb api.
-------------------------------------------------------------------------------
*/
var omdb = {
	host: "http://www.omdbapi.com/?",
	apiKey: keys.omdb,
	movieTitle: "",
	
	// Displays move data on command line
	render: function(movie) {

		// handle undefined data
		movie.Released = !movie.Released ? "unavailable" : movie.Released;
		movie.imdbRating = !movie.imdbRating ? "unavailable" : movie.imdbRating;
		movie.Country = !movie.Country ? "unavailable" : movie.Country;
		movie.Language = !movie.Language ? "unavailable" : movie.Language;
		movie.Actors = !movie.Actors ? "unavailable" : movie.Actors;
		movie.Plot = !movie.Plot ? "unavailable" : movie.Plot;
		
		// get rotten tomatoes rating if it is available
		var rottenTomatoes = "unavailable";
		if ( movie.Ratings ) {
			for ( var i = 0; i < movie.Ratings.length; i++ ) {
				var rating = movie.Ratings[i];
				if ( rating.Source === "Rotten Tomatoes" ) {
					rottenTomatoes = rating.Value;
				}
			}
		}
		
		// build output string for command line
		var s = 
			"\nTitle: " + movie.Title +
			"\nReleased: " + movie.Released +
			"\nIMDb Rating: " + movie.imdbRating +
			"\nRotten Tomatoes: " + rottenTomatoes+
			"\nCountry: " + wordWrap(movie.Country, 50).join("\n") +
			"\nLanguage: " + movie.Language +
			"\nActors: " + wordWrap(movie.Actors, 50).join("\n") +
			"\nPlot:\n" + wordWrap(movie.Plot, 50).join("\n");
		if ( omdb.movieTitle === defaultMovie ) {
			// build url for movie on imdb website
			var imdbUrl = "url unavailible";
			if ( !!movie.imdbID ) {
				// imdbID exists, set the url
				imdbUrl =  "http://www.imdb.com/title/" + movie.imdbID;
			}
			// append default movie message to output string
			s += wordWrap(
				"\n\nIf you haven't watched \"" + movie.Title + 
					",\" then you should: " + imdbUrl + ". It's probably on Netflix.", 
				50).join("\n");
		}
		
		// update log file
		Log.append(s);		
		// display output on cmd line
		console.log("\n" + addBorders(s));
	},
	
	// Request movie data from omdb api and call this.render, returns a promise
	request: function(movieTitle) {
		this.movieTitle = movieTitle;
		// get http request client
		var request = require("request");

		// setup paremeters for request
		var apiKey = "apikey=" + omdb.apiKey;
		movieTitle = "t=" + encodeURIComponent(movieTitle);		
		var queryUrl = this.host + apiKey + "&" + movieTitle;
		
		// request movie data from OMDB api
		request(queryUrl, function(error, response, body) {
			if ( !error && response.statusCode === 200 ) {
				body = JSON.parse(body);

				// handle no match found by omdb api
				if ( !body.Title ) {
					// display message
					console.log(
						"\nI couldn't find a matching movie title. Try something else.");					
					// update log file
					Log.append("OMDB Api returned 0 matches.");

				// omdb request succesful, display the data
				} else {
					omdb.render(body);
				}

			// handle error responses
			} else if (error) {
				// display error message
				console.log("\nI wasn't able to process your request. I'm sorry. Goodbye.");
				// update log file
				Log.append("OMDB Error:\n" + JSON.stringify(error,null,2));

			// handle all other responses
			} else {
				// display message
				console.log("\nMy magic movie finder didn't turn anything up. " +
					"Try searching for something else.");
				// update log file
				Log.append("Unexpected api response status:\n" + response.statusCode + " " + response.statusMessage);
			}
		});

	}
};
/*
-------------------------------------------------------------------------------
4 - Spotify

Container for handling requests and rendering output for the Spotify API.
-------------------------------------------------------------------------------
*/
var spot = {
	// Displays song info on the command line
	render: function(song) {
		// undefined song properties should display as "unavailable"
		song.artists = !song.artists ? "unavailable" : song.artists;
		song.name = !song.name ? "unavailable" : song.name;
		song.preview_url = !song.preview_url ? "unavailable" : song.preview_url;
		song.album.name = !song.album.name ? "unavailable" : song.album.name;
		
		// get list of artists as a string
		var artists = "";
		for ( var i = 0; i < song.artists.length; i++ ) {
			artists += ", " + song.artists[i].name;
		}
		artists = artists.substring(2);

		// format and display song data on cmd line
		var s =
			"\nArtist(s): " + artists +
			"\nSong: " + song.name +
			"\nPreview song: " + song.preview_url +
			"\nAlbum: " + song.album.name;

		// add to log file
		Log.append(s);
		// display on command line with borders
		console.log(addBorders(s));
	},

	// Request song data from spotify api and call this.render
	request: function(songName) {
		try {
			// get spotify api client
			var Spotify = require('node-spotify-api');
			var spotify = new Spotify(keys.spotify);

			// request song data from spotify api
			spotify.search(
				{
					type: 'track',
					// place song name in quotes for exact word match
					// that is not case sensitive
					query: '"' + songName + '"',
					limit: 1
				},
				function(err, data) {
					if ( err ) {
						// update log file
						Log.append(
							"Spotify API Error:\n" + wordWrap(err.toString(), 50).join("\n"));
						// display message to user
						return console.log(
							"\nHmmm. I didn't have any luck searching for '" + songName + "'.");
					}
					// render the song
					spot.render(data.tracks.items[0]);
				}
			);

		// handle error connecting to Spotify API
		} catch (e) {
			// update log
			Log.append("Error connecting to Spotify:\n" + 
				wordWrap(e.toString(), 50).join("\n"));			
			// display error message
			return console.log("I'm afraid that Spotify and I are not on speaking terms.");
		}
	}
};
/*
-------------------------------------------------------------------------------
5 - Twitter

Container for handling requests and rendering output for the Twitter API.
-------------------------------------------------------------------------------
*/
var twitterThing = {	
	// Returns a formatted string for a single tweet rendering with the
	// likeness of a dialog bubble
	getTweetString: function(text, time) {		
		var textLength = 47;
		var bubbleLines = [
			"     + + + + + + + + + + + + + + + + + + + + + + + + + +  ",
			"   +                                                     +"
		];
		var bottomLines = [
			"   +                                                     +",
			"     + +     + + + + + + + + + + + + + + + + + + + + + +  ",
			"       +   +                                              ",
			"     +  +                                                 "
		];
		var placeHolder = "%s";
		var textFormat = "  +    %s    +           ";
		// get the width for the entire dialog bubble "image"
		var lineWidth = bubbleLines[0].length;
		// add a time stamp formatted as with twitter mobile app (i.e. "4h", "2d", etc.)
		text += " (" + moment(time).twitter() + ")";		
		var wrappedText = wordWrap(text, textLength); // returns array
		
		// add lines to array for each line of tweet text formatted for the bubble
		for ( var i = 0; i < wrappedText.length; i++ ) {
			// add space to make line length = textLength
			if ( wrappedText[i].length < textLength ) {
				wrappedText[i] += " ".repeat(textLength - wrappedText[i].length);
			}
			// place text in formatted line and add to lines array.
			bubbleLines.push(textFormat.replace(placeHolder, wrappedText[i]));
		}
		bubbleLines = bubbleLines.concat(bottomLines);
		// return as a string
		return bubbleLines.join("\n");
	},
	
	// Displays tweets on the command line
	renderTweets: function(tweets) {		
		var out = []; // array of strings to render
		var logArr = []; // array of strings for log file

		// populate out and logArr with tweets
		for ( var i =0; i < tweets.length; i++ ) {
			var tweet = tweets[i];
			// get string for log file
			logArr.push(
				"Time: " + tweet.created_at + "\n" +
				wordWrap(tweet.text, 50)
			);
			// get formatted string for output
			out.push(twitterThing.getTweetString(tweet.text, tweet.created_at));
		}
		// update log file
		Log.append("\n" + logArr.join("\n\n"));
		// display tweet on command line
		console.log("\n" + out.join("\n\n"));
	},
	
	// Requests most recent tweets up to 20 and call this.renderTweets
	reqeuest: function() {
		var tweets;		
		var user = twitterUserName; // from global var at top of this file

		// paremeters for GET search/tweets
		var queryParams = {
			q: "from:" + user,
			count: 20
		};
		
		// get twitter client
		var Twitter = require('twitter');
		var client = new Twitter(keys.twitter);
			
		// get the tweets
		client.get('search/tweets', queryParams, function(err, tweets, response) {			
			// handle error
			if ( err ) {
				// update log file
				Log.append("Twitter API Error:\n" + JSON.stringify(err, null, 2));
				// display message and stop application
				return console.log("I wasn't able to retrieve your tweets. I might be ill.");
			}

			// render the tweets
			twitterThing.renderTweets(tweets.statuses);
		});	
	}
};
/*
-------------------------------------------------------------------------------
6 - Helpers

Utility functions
-------------------------------------------------------------------------------
*/
// Adds a simple border above and below string 50 characters in width
function addBorders(s) {
	var border = "\n" + "-".repeat(50);
	return border + s + border;
}
// Wraps text without splitting words at a specified length in characters.
function wordWrap (s, lineLength) {
	var words = s.split(" ");
	var lines = [""];
	for ( var i = 0; i < words.length; i++ ) {
		var remainingChars = lineLength - lines[lines.length - 1].length;
		if ( words[i].length + 1 > lineLength ) {
			// break word into two parts
			words = words.slice(0, i)
				.concat(
					[
						words[i].substr(0, remainingChars - 1),
						words[i].substring(remainingChars - 1)
					],
					words.slice(i+1)
				); 
		}
		// determines if the next word with a space is too long
		if (  words[i].length + 1 > remainingChars ) {
			// start the next line
			lines.push("");
		}
		if ( lines[lines.length - 1].length > 0 ) {
			// add a space before the word
			words[i] = " " + words[i];
		}
		// add the word to the current line
		lines[lines.length - 1] += words[i];
	}
	return lines;
}
/*
-------------------------------------------------------------------------------
7 - Main

Run the application
-------------------------------------------------------------------------------
*/
function main(args) {
	var command = args[0];

	// run the specified command
	switch ( command ) {

		/* ----- twitter commands ----- */
		case "my-tweets":		
			twitterThing.reqeuest();
			break;
		
		/* ----- music commands ----- */
		case "spotify":
		case "spotify-this-song":
			if ( args[1] ) {
				spot.request(args.slice(1).join(" "));
			} else {
				// no song title was entered, display default song
				spot.request(defaultSong);
			}
			break;
		
		/* ----- movie commands ----- */
		case "movie-this":
		// check for movie title
		if ( args[1] ) {			
			// join args for multi word title and run command
			omdb.request(args.slice(1).join(" "));
		} else {
			// display default movie when no movie title specified
			omdb.request(defaultMovie);
		}
		break;
		
		/* ----- misc commands ----- */
		case "do-what-it-says":
			// get contents from random.txt
			fs.readFile(
				"random.txt", 
				"utf8", 
				function(err, data) {
					// handle error
					if ( err ) {
						return console.log("I'm having a case of \
							the Mondays. Please ask me to do \
							something else.");
					}
					var arrData = data.split(",");
					// prevent an infinite loop
					if ( arrData[0] === "do-what-it-says" ) {
						// give the user some sass
						return console.log(
							"You want me to do what? Take a long walk off a short pier.");
					}
					// execute the command in the file
					main(data.split(","));
				});			
			break;
		
		// no command or invalid command was passed
		default:
			console.log(
				"I'm sorry. I didn't understand that request. Please\n" +
				"enter one of the following commands: \n" +
				"   my-tweets          spotify-this-song      movie-this\n" +
				"   do-what-it-says\n"
			);
	}
}
main( process.argv.slice(2) );