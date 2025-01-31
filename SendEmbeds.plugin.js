/**
 * @name SendEmbeds
 * @author Fraserbc
 * @version 2.0.0
 * @description Allows you to send embeds
 * @source https://github.com/Fraserbc/BetterDiscord-Embeds
 * @updateUrl https://raw.githubusercontent.com/Fraserbc/BetterDiscord-Embeds/master/SendEmbeds.plugin.js
 */

 module.exports = class {
	load() {}
	unload() {}
	start() { this.attachHandler(); }
	onSwitch() { this.attachHandler(); }
	stop() {
		let el = document.querySelectorAll('form[class^="form-');
		if (el.length == 0) return;

		// Remove handlers and injected script
		el[0].removeEventListener("keydown", this.handler);
	}

	lastKey = 0;

	attachHandler() {
		this.handler = this.handleKeypress.bind(this);
		let el = document.querySelectorAll('form[class^="form-');
		if (el.length == 0) return;
	
		// Bind the handler
		el[0].addEventListener("keydown", this.handler, false);
	}

	// Function that sends the embed
	sendEmbed(embed) {
		// Get the ID of the channel we want ot send the embed to
		let channelID = window.location.pathname.split('/').pop();
	
		// Create the message
		let MessageQueue = DiscordInternals.WebpackModules.findByUniqueProperties(['enqueue']);
		let MessageParser = DiscordInternals.WebpackModules.findByUniqueProperties(['createBotMessage']);
	
		let msg = MessageParser.createBotMessage(channelID, "");
	
		// Send the message
		MessageQueue.enqueue({
			type: 0,
			message: {
				channelId: channelID,
				content: "",
				tts: false,
				nonce: msg.id,
				embed: embed
			}
		}, r => {
			return;
		});
	}

	// Handling the user input
	handleKeypress(e) {
		var code = e.keyCode || e.which;

		if (code !== 13) {
			this.lastKey = code;
			return;
		}

		//Catch Shift + Enter and allow multiline
		if (this.lastKey == 16) {
			return;
		}

		// Split a string on only the first delimeter
		function splitSingle(str, delimeter) {
			let part1 = str.substr(0, str.indexOf(delimeter));
			let part2 = str.substr(str.indexOf(delimeter) + 1);

			return [part1, part2]
		};

		// Get the deepest child of a parent
		function getDeepest(elem) {
			if(elem.firstChild == null) {
				return elem;
			} else {
				return getDeepest(elem.firstChild);
			}
		};

		// Parse the text
		let elements = Array.from(document.querySelectorAll('div[class^="textArea-')[0].children[0].children);
		let text = "";
		elements.forEach(function(l0) {
			Array.from(l0.children).forEach(function(l1) {
				Array.from(l1.children).forEach(function(elem) {
					elem = getDeepest(elem);
					if(elem.alt) {
						text += elem.alt;
					} else {
						text += elem.textContent;
					}
				});
			});
			text += "\n";
		});

		if (!text.startsWith("/e") && !text.startsWith("/embed")) {
			return;
		};

		// Cancel the event so we can handle it ourselves
		e.preventDefault();
		e.stopPropagation();

		// Strip and split the text
		text = text.replace("/e ", "");
		text = text.replace("\uFEFF", "");
		text = text.replace(/\n\n/g, "\n");
		text = text.split("\n");

		// Create the embed
		let fields = ["title", "description", "url", "color", "timestamp", "footer_image", "footer", "thumbnail", "image", "author", "author_url", "author_icon"];
		let embed = {};
		let last_attrb = ""
		for (var x = 0; x < text.length; x++) {
			let line = text[x]
			let split = splitSingle(line, ":");

			// Check if it is an attribute or continuation of previous
			if(fields.includes(split[0])) {
				// Check if there is a leading " "
				if(split[1].startsWith(" ")) {
					embed[split[0]] = split[1].slice(1);
				} else {
					embed[split[0]] = split[1];
				}

				// Store the last attribute to be set so we can have multi-line
				last_attrb = split[0];
			} else {
				embed[last_attrb] += "\n" + line;
			}
		}

		// Find the unused fields
		let unused = [];
		let keys = Object.keys(embed);
		for (var x = 0; x < keys.length; x++) {
			if (embed[keys[x]] == "") {
				unused.push(keys[x]);
			}
		}

		// Remove the unused fields
		for (var x = 0; x < unused.length; x++) {
			delete embed[unused[x]];
		}

		// Proccess color
		embed.color = embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0;

		// Convert the embed to Discord's format
		let discordEmbed = {
			type: "rich",
			footer: { text: "" },
			author: { name: "" }
		}
		keys = Object.keys(embed);
		for (var x = 0; x < keys.length; x++) {
			switch(keys[x]) {
				case "timestamp":
					if (embed.timestamp.toLowerCase() == "true") {
						let timestamp = (new Date).toISOString();
						discordEmbed.timestamp = timestamp;
					}
					break;
				case "footer_image":
					discordEmbed.footer.icon_url = embed.footer_image;
					break;
				case "footer":
					discordEmbed.footer.text = embed.footer;
					break;
				case "thumbnail":
					discordEmbed.thumbnail = {};
					discordEmbed.thumbnail.url = embed.thumbnail;
					break;
				case "image":
					discordEmbed.image = {};
					discordEmbed.image.url = embed.image;
					break;
				case "author":
					discordEmbed.author.name = embed.author;
					break;
				case "author_url":
					discordEmbed.author.url = embed.author_url;
					break;
				case "author_icon":
					discordEmbed.author.icon_url = embed.author_icon;
					break;
				default:
					discordEmbed[keys[x]] = embed[keys[x]];
					break;
			}
		}

		// Send the embed
		console.log(this);
		this.sendEmbed(discordEmbed);

		this.lastKey = 0;
	}
};