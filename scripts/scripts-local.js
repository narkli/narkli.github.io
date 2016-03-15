//
// Programmer:		Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date:	Sat Mar  5 07:13:29 PST 2016
// Last Modified:	Tue Mar  8 08:09:38 PST 2016
// Filename:		testroll/scripts-local.js
// Web Address:	http://josquin.stanford.edu/testroll/scripts-local.html
// Syntax:			JavaScript 1.8/ECMAScript 5; jQuery 2.0
// vim:				ts=3: ft=javascript
//
// Description:	Piano-roll display controls.
//

var LASTHEIGHT     = -1;
var LASTWIDTH      = -1;
var POLL_FREQUENCY = 20;
var LAST_TIME      = -1;
var CURRENT_TIME   = -1;
var STARTTIME      = -1;
var OFFSET         =  0.0;
var PLAY_STATE     =  0;
var NOTE_OFF_TIMES = [];
var NOTE_ON_TIMES  = [];
var RECTS          = [];
var VOICES         = [];
var NEXT_WORK      = "";
var PREVIOUS_WORK  = "";
var ANCHOR_STOP;
var REFRESH;


//////////////////////////////
//
// getJrpid -- return the JRP ID# for the work which should 
//      be displayed.
//

var cgiinit = -1;
function getJrpid() {
	var CgiParameters;
	cgiinit++;
	CgiParameters = GetCgiParameters();
   if (cgiinit > 0) {
		return localStorage.PIANOROLLjrpid;
   }

	if (localStorage.PIANOROLLjrpid === "undefined") {
		localStorage.removeItem("PIANOROLLjrpid");
	}

	if (typeof CgiParameters['id'] !== "undefined") {
		localStorage.PIANOROLLjrpid = CgiParameters['id'];
	} else if (typeof CgiParameters['f'] !== "undefined") {
		localStorage.PIANOROLLjrpid = CgiParameters['f'];
	} else {
		if (typeof localStorage.PIANOROLLjrpid === 'undefined') {
			localStorage.PIANOROLLjrpid = "Jos2721";
		}
		if (localStorage.PIANOROLLjrpid === "undefined") {
			localStorage.PIANOROLLjrpid = "Jos2721";
		}
	}
	return localStorage.PIANOROLLjrpid;
}



//////////////////////////////
//
// MidiToDiatonicPC -- Convert MIDI key numbers into
//     diatonic pitch class with default pitch
//     inflection.
//

function MidiToDiatonicPC(value) {
	value = parseInt(value);
	var octave = parseInt(value / 12);
	var pc12 = parseInt(value % 12);
	var output = "";
	switch (pc12) {
		case 0:  output += "C";  break;
		case 1:  output += "C#"; break;
		case 2:  output += "D";  break;
		case 3:  output += "Eb"; break;
		case 4:  output += "E";  break;
		case 5:  output += "F";  break;
		case 6:  output += "F#"; break;
		case 7:  output += "G";  break;
		case 8:  output += "G#"; break;
		case 9:  output += "A";  break;
		case 10: output += "Bb"; break;
		case 11: output += "B";  break;
	}
	output += octave;
	return output;
}



////////////////////////
//
// prepareTimemap -- Read class names starting with
//     "ont-" and "offt-" which encode starting and
//     stopping times in seconds to match with audio
//     files.
//

function prepareTimemap() {
	var svg = document.querySelector("svg");
	// var offt = svg.querySelectorAll("[class^='offt-']");
	RECTS = svg.querySelectorAll("rect");
	NOTE_OFF_TIMES = [];
	NOTE_ON_TIMES  = [];
	var matches;
	var offtime;
	var ontime;
	for (var i=0; i<RECTS.length; i++) {

		if (matches = RECTS[i].className.baseVal.match(/ont-([^\s]+)/)) {
			ont = parseFloat(matches[1].replace(/d/, "."));
			NOTE_ON_TIMES.push({time: ont - OFFSET, index: i});
		}

		if (matches = RECTS[i].className.baseVal.match(/offt-([^\s]+)/)) {
			offtime = parseFloat(matches[1].replace(/d/, "."));
			NOTE_OFF_TIMES.push({time: offtime - OFFSET, index: i});
		}

	}
}



//////////////////////////////
//
// PlayAudioFile2 -- play/pause an audio file for the piano roll.
//     (Replaces PlauAudioFile from the scripts-common.js file).
//

function PlayAudioFile2(jrpid, element, time) {
   if (!element) {
      element = document.querySelector("#audio2");
   }

	// The JRPID is not the same as the currently playing file
	// (or there is no file playing).  So start the new one.
	if (!AUDIO) {
		AUDIO = document.getElementById('audio');
	}
	if (!AUDIO) {
		document.body.innerHTML += '<audio id="audio"></audio>\n';
		AUDIO = document.getElementById('audio');
	}
	if (!AUDIO) {
		console.log('Error: could not set up audio interface\n');
		return false;
	}
	AUDIO.setAttribute('controls', 'controls');
	AUDIO.style.position = 'fixed';
	AUDIO.style.bottom   = '0';
	AUDIO.style.right    = '0';
	AUDIO.style.zIndex   = '1';

   if (time) {
      AUDIO.currentTime(time);
   }

   AUDIO.addEventListener('pause', pauseCallback);
   AUDIO.addEventListener('play', playCallback);

	var audiobutton;
	if (jrpid != AUDIOjrpid) {
		if (!!AUDIOid) {
			// turn of previously playing audio file:
			audiobutton = document.getElementById(AUDIOid);
			if (!!audiobutton && !!audiobutton.className) {
				if (audiobutton.className.match(/mp3/)) {
					audiobutton.className = 'mp3play';
				} else {
					audiobutton.className = 'play';
				}
			}
		}
		AUDIO.removeAttribute('controls');
		AUDIO.pause();
		
		AUDIOid = element.id;
		var source = '';
		source += '<source src="index.mp3" type="audio/mpeg"/>\n';
		AUDIO.innerHTML = source;

		AUDIOjrpid = jrpid;
		AUDIO.load();
		AUDIO.play();
		AUDIO.setAttribute('controls', 'controls');
		var newelement = document.getElementById(AUDIOid);
		
		if (newelement.className.match(/mp3/)) {
			newelement.className = 'play';
		} else {
			newelement.className = 'pause';
		}
		return;
	}

	// The audio file is the same, so start it or pause it depending
	// on its current state:
	if (AUDIO.paused) {
		audiobutton = document.getElementById(AUDIOid);
 		if (!audiobutton) {
			return;
		}
		if (audiobutton.className.match(/mp3/)) {
			audiobutton.className = 'play';
		} else {
			audiobutton.className = 'pause';
		}
		if (element.className.match(/mp3/)) {
			element.className = 'play';
		} else {
			element.className = 'pause';
		}
		AUDIO.play();
		AUDIO.setAttribute('controls', 'controls');
	} else {
		audiobutton = document.getElementById(AUDIOid);
 		if (!audiobutton) {
			return;
		}
		if (audiobutton.className.match(/mp3/)) {
			audiobutton.className = 'play';
		} else {
			audiobutton.className = 'pause';
		}
		if (element.className.match(/mp3/)) {
			element.className = 'play';
		} else {
			element.className = 'pause';
		}
		AUDIO.pause();
		AUDIO.removeAttribute('controls');
	}
}



//////////////////////////////
//
// pauseCallback -- What to do when the audio is stopped.
//

function pauseCallback() {
   PLAY_STATE = 0;
   unhighlightAll(NOTE_ON_TIMES);
}



//////////////////////////////
//
// unhighlightAll -- Remove "highlight" class from all given 
//      elemments.
//

function unhighlightAll(list) {
   var cn;
   var matches;
   for (var i=0; i<list.length; i++) {
      turnOffNote(list[i].index);
   }
}



//////////////////////////////
//
// turnOnNote -- Add the highlight class to element.
//

function turnOnNote(index) {
   var rects = document.querySelectorAll("svg rect");
   // var note = RECTS[index];
   var note = rects[index];
   var cn = note.className.baseVal;
   if (!cn.match(/highlight/)) {
      cn += " highlight";
      note.className.baseVal = cn;
   }
}



//////////////////////////////
//
// tunOffNote -- Remove highlight class from element.
//

function turnOffNote(index) {
   var rects = document.querySelectorAll("svg rect");
   var note = rects[index];
   var cn = note.getAttribute('class');
   if (cn.match(/highlight/)) {
      cn = cn.replace(/highlight/, '');
      note.setAttribute('class', cn);
   }
}



//////////////////////////////
//
// playCallback -- What to do when the audio starts playing.
//

function playCallback(event) {
	var iface = document.querySelector("audio");
   if (STARTTIME > 0) {
      iface.currentTime = STARTTIME;
      STARTTIME = -1;
   }
	LAST_TIME = iface.currentTime;
	PLAY_STATE = 1;
	var that = this;
	REFRESH = setInterval(function() {
		if (PLAY_STATE == 0) {
			clearInterval(REFRESH);
			return;
		}
      var duration = iface.duration;
      if (duration > 0) {
         var fraction = iface.currentTime / duration;
         centerSvg(fraction);
      }
		var delta = iface.currentTime - LAST_TIME;
		if (delta == 0.0) {
			return;
		}
		checkTimeMaps(iface.currentTime);
		LAST_TIME = iface.currentTime;
	}, POLL_FREQUENCY);
}



/////////////////////////////
//
// centerSvg -- center the SVG image at the given
//     fractional position in the middle of the window.
//

function centerSvg(fraction) {
   var svg = document.querySelector("#svg-container svg");
   var box = svg.getBoundingClientRect();

   var sw = box.width;
   var ww = window.innerWidth;
   var newx = sw * fraction - ww / 2.0;
   if (newx < 0) {
      newx = 0;
   }
   var oldx = window.scrollX;


   var diff = Math.abs(newx - oldx);

   var factor = 0.9999;
   if ((newx < oldx)) {
      if (newx > oldx - ww/2.0) {
         // don't scroll if catching up to center of window.
         return;
      } else {
         factor = 0.99;
      }
   }
   if (diff > 3) {
      if (newx < oldx) {
         newx = newx + diff * factor;
      } else {
         newx = oldx + diff * factor;
      }
   }
   window.scroll(newx, window.scrollY);
}



//////////////////////////////
//
// checkTimeMaps --  See if any notes should be turned on or off.
//

function checkTimeMaps(nowtime) {
	var tmon  = NOTE_ON_TIMES;
	var tmoff = NOTE_OFF_TIMES;

	if (!tmon)  { return; }
	if (!tmoff) { return; }

   var i;
	var ttime;
	var lasttime = LAST_TIME;

	for (i=0; i<tmon.length; i++) {
		ttime = tmon[i].time;
      if ((ttime >= lasttime) && (ttime <= nowtime + 0.015)) {
         turnOnNote(tmon[i].index);
      }
   }

	for (i=0; i<tmoff.length; i++) {
		ttime = tmoff[i].time;
      if ((ttime >= lasttime) && (ttime <= nowtime + 0.015)) {
         turnOffNote(tmon[i].index);
      }
   }
}



//////////////////////////////
//
// loadSvgImage -- Get the SVG image from the server and
//     then setup the controls for the page.
//

function loadSvgImage(selector) {
   var request = new XMLHttpRequest();
   // request.open("GET", "piano-roll.svg");
   var jrpid = getJrpid();
   localStorage.PROLLjrpid = jrpid;
   var url = "index.svg";
   request.open("GET", url);
   request.addEventListener("load", function() {
      var element = document.querySelector(selector);
      if (!element) {
         console.log("Cannot find selector", selector);
         return;
      }
      element.innerHTML = request.responseText;
	   prepareTimemap();

	   var grandstaff = document.querySelector("#grand-staff");
	   displayStafflines(grandstaff.checked);
	   var rounded = document.querySelector("#round-notes");
	   displayRound(rounded.checked);
	   var lines = document.querySelector("#note-connectors");
	   displayLines(lines.checked);
	   var maxima = document.querySelector("#maxima");
	   displayMaxima(maxima.checked);
	   var width = document.querySelector("#width");
	   displayWidth(width.value);
	   var svg = document.querySelector("svg");
	   svg.style.display = 'block';


      setVoiceLabelColors();
      fillInTracks();
		displayFullHeight();

   });
   request.send();
}



//////////////////////////////
//
// svgCenterVertically -- Center the SVG image in the middle of the window,
//    or the center of the space left over if the title is showing.  This
//    is done by positining the svg absolutely, and positining the top
//    left corner of the image based on the window geometry.  (This could be
//    enhanced by also calling this function in a callback for window resizing).
//

function svgCenterVertically() {
   var svgholder = document.querySelector("#svg-container");
   var svg       = document.querySelector("#svg-container svg");
   var box       = svg.getBoundingClientRect();
   if (svgholder) {
      var face = document.querySelector('#title-header');
      var windowheight = window.innerHeight;
      var consoleheight = 0;
      if (face.style.display !== 'none') {
         var fbox = face.getBoundingClientRect();
         var tweak = window.innerHeight / 2
         consoleheight = fbox.height;
      }
      var center = (windowheight - consoleheight) / 2
      var toppos = center - box.height/2;
      toppos += consoleheight;

      // svgholder.style.top = toppos + "px";
      svgholder.style.top = fbox.height + "px";
   }
}



//////////////////////////////
//
// displayVoice -- Show/hide voices.
//

function displayVoice(state, track) {
	var svg = document.querySelector("svg");
	var list = svg.querySelectorAll(".track-" + track);
	var list2 = svg.querySelectorAll(".note-background-" + track);
	for (var i=0; i<list.length; i++) {
			if (state) {
				list[i].style.visibility = 'visible';
			} else {
				list[i].style.visibility = 'hidden';
			}
	}
}



//////////////////////////////
//
// displayStafflines -- Show/hide grand staff.
//

function displayStafflines(state) {
	var svg = document.querySelector("svg");
	var list = svg.querySelectorAll(".staff-lines");
	for (var i=0; i<list.length; i++) {
			if (state) {
				list[i].style.visibility = 'visible';
			} else {
				list[i].style.visibility = 'hidden';
			}
	}
}



//////////////////////////////
//
// displayLines -- Show/hide melody connector lines.
//

function displayLines(state) {
	var svg = document.querySelector("svg");
	var list = svg.querySelectorAll(".note-lines");
	for (var i=0; i<list.length; i++) {
			if (state) {
				list[i].style.visibility = 'visible';
			} else {
				list[i].style.visibility = 'hidden';
			}
	}
}



//////////////////////////////
//
// displayMaxima -- Highlight maxima of range.
//

function displayMaxima(state) {
	var svg = document.querySelector("svg");
	var i;
	var list = svg.querySelectorAll(".maxima");
	for (i=0; i<list.length; i++) {
			if (state) {
				list[i].setAttribute("fill", "red");
			} else {
				list[i].setAttribute("fill", "");
			}
	}
}



//////////////////////////////
//
// displayMinima -- Highlight minima of vocal range.
//

function displayMinima(state) {
	var svg = document.querySelector("svg");
	var i;
	var list = svg.querySelectorAll(".minima");
	for (i=0; i<list.length; i++) {
			if (state) {
				list[i].setAttribute("fill", "red");
			} else {
				list[i].setAttribute("fill", "");
			}
	}
}



//////////////////////////////
//
// displayRound -- Switch between round and square notes.
//

function displayRound(state) {
	var svg = document.querySelector("svg");
	var list = svg.querySelectorAll("rect[rx]");
	for (var i=0; i<list.length; i++) {
			if (state) {
				list[i].setAttribute('rx', 1);
				list[i].setAttribute('ry', 1);
			} else {
				list[i].setAttribute('rx', 0);
				list[i].setAttribute('ry', 0);
			}
	}
}



//////////////////////////////
//
// displayWidth -- Adjust size of image, either to show the full 
//     width of the image in the window, or use the previous scaling
//     size of the image before it was made full-width.
//

function displayWidth(width) {
	var fullwidth = window.innerWidth;
	var svg = document.querySelector("svg");
	var viewbox = svg.getAttribute("viewBox");
	var pieces = viewbox.split(" ");
	var ratio = pieces[3] / pieces[2];
	svg.setAttribute("width", fullwidth * width / 100);
	svg.setAttribute("height", fullwidth * width / 100 * ratio);
}



//////////////////////////////
//
// displayFullHeight -- Adjust size of image to full screen height (minus
//     the title bar if it is visible).  This will toggle between full height
//     and what the previous size was before it was set to full height.
//

function displayFullHeight() {
	var svg        = document.querySelector("svg");
	var fullheight = window.innerHeight;
   var titlebox   = document.querySelector("#title-header");
   if (titlebox && (titlebox.style.display !== 'none')) {
		fullheight -= titlebox.getBoundingClientRect().height;
	}

	var imageheight = fullheight;
	var fullwidth = window.innerWidth;
	var viewbox = svg.getAttribute("viewBox");
	var pieces = viewbox.split(" ");
	var ratio = pieces[3] / pieces[2];
	var width = document.querySelector("#width");

	currentWidth  = svg.getAttribute("width");
	currentHeight = svg.getAttribute("height");

	if (Math.abs(imageheight - currentHeight) < 1) {
		svg.setAttribute("width", LASTWIDTH);
		width.value = parseInt(LASTWIDTH/fullwidth*100+0.5);
		svg.setAttribute("height", LASTHEIGHT);
	} else {
		LASTWIDTH  = currentWidth;
		LASTHEIGHT = currentHeight;
		svg.setAttribute("width", imageheight / ratio);
		width.value = parseInt(imageheight/ratio/fullwidth*100+0.5);
		svg.setAttribute("height", imageheight);
	}
   
   svgCenterVertically();
}



//////////////////////////////
//
// displayFullWidth -- Adjust size of image to full screen height.
//

function displayFullWidth() {
	// var fullheight = window.innerHeight;
	var svg = document.querySelector("svg");

	var fullwidth = window.innerWidth;
	var viewbox = svg.getAttribute("viewBox");
	var pieces = viewbox.split(" ");
	var ratio = pieces[3] / pieces[2];
	var width = document.querySelector("#width");

	currentWidth  = svg.getAttribute("width");
	currentHeight = svg.getAttribute("height");

	if (LASTWIDTH < 0) {
		LASTWIDTH  = currentWidth;
		LASTHEIGHT = currentHeight;
	} 

	if ((LASTWIDTH < 0) || (Math.abs(fullwidth - currentWidth) < 1)) {
		svg.setAttribute("width", LASTWIDTH);
		width.value = parseInt(LASTWIDTH/fullwidth*100+0.5);
		svg.setAttribute("height", LASTHEIGHT);
	} else if (LASTWIDTH > 0) {
		LASTWIDTH  = currentWidth;
		LASTHEIGHT = currentHeight;
		svg.setAttribute("width", fullwidth);
		svg.setAttribute("height", fullwidth * ratio);
		width.value = 100.0;
	}
   svgCenterVertically();
}



//////////////////////////////
//
// fillInTitle -- Get the title and voice of a work from WORKLIST.
//

function fillInTitle(selector, title) {
   var element = document.querySelector(selector);
   if (!element) {
      return;
   }
	element.innerHTML = title;
}



//////////////////////////////
//
// prepareHelpMenu -- Get the file "help.txt" from the server and then
//     fill in the help window with its contents.  Entries in help.txt
//     are in the form:
//         key    [tab]    description
//     other non-blank lines (such as for headings) will be echoed as is.
//

function prepareHelpMenu(selector) {
   var request = new XMLHttpRequest();
   request.open("GET", "/help/help.txt");
   request.addEventListener("load", function() {
      fillInHelpContainer(selector, request.responseText);
   });
   request.send();
}



//////////////////////////////
//
// prepareTitle -- Get the file "title.txt" from the server and then
//     fill in the title with its contents.
//

function prepareTitle(selector) {
   var request = new XMLHttpRequest();
   request.open("GET", "title.txt");
   request.addEventListener("load", function() {
      fillInTitle(selector, request.responseText);
   });
   request.send();
}



//////////////////////////////
//
// fillInHelpContainer -- Convert the text file with the help
//    contents into a table shown in the help window.
//

function fillInHelpContainer(selector, data) {
   var lines = data.match(/[^\r\n]+/g);
   var help = document.querySelector(selector);
   if (!help) {
      return;
   }
   var output = "";

   output += '<table id="help-table">\n';

// output += '<tr><td colspan="2">\n';
// output += ' <b style="font-size:110%;">Keyboard commands</b>';
// output += '</td></tr>\n';
   
   var line; 
   for (var i=0; i<lines.length; i++) {
      line = lines[i];
      var matches = line.match(/^\s*(.*)\s*\t\s*(.*)\s*$/);
      if (matches) {
         var key  = matches[1];
         var desc = matches[2];
         output += '<tr><td><b>' 
         output += '<span style="color:#d8ab5c; cursor:pointer;"';
         output += " onclick='processKeyCommand(";
         output += '{keyCode: "' + key + '".charCodeAt(0)}' + ");'";
         output += '>';
         output += key 
         output += '</span>';
         output += '</b></td>';
         output += '<td>' + desc + '</td></tr>';
      } else if (!line.match(/^\s*$/)) {
         output += '<tr><td colspan="2">';
         output += line;
			output += '</td></tr>\n';
      }
   }
   output += '</table>\n';
   help.innerHTML = output;
}



//////////////////////////////
//
// fillInVoices -- Print a list of voices in the work according to the
//      voice list from the WORKLIST entry.
//

function fillInTracks() {
   var element = document.querySelector("#voice-container");
   if (!element) {
      return;
   }

   var svg = document.querySelector("svg");
   var tracks = svg.querySelectorAll('g[class^="track-"]');

   var trackcount = tracks.length;

   var output = "";
   output += "<table><tr>"; 
   var i;
   var name;
   for (i=0; i<trackcount; i++) {
      output += "<td>";

      output += '<input onchange="displayVoice(this.checked, ';
      output += (i+1);
      output += ');" id="v';
      output += (i+1);
      output += '" type=checkbox checked>\n';
      output += "&nbsp;";

      name = "voice " + (i+1);
		output += '<label for="v' + (trackcount-i) + '">';
      output += '<span>';
      output += name;
      output += '</span>';
		output += '</label>';

      output += "</td>";
   }
   output += "</tr></table>"; 
   element.innerHTML = output;

   VOICES = [];
   var velem;
   for (i=0; i<trackcount; i++) {
      velem = document.querySelector("#v" + (trackcount - i));
		var item = document.querySelector("#v" + (trackcount - i) + " + label > span");
      item.style.color = tracks[i].style.fill;
      item.style.fontSize = "150%";
      VOICES.push(velem);
   }
   VOICES.reverse();
}



//////////////////////////////
//
// toggleTitleDisplay --
//

function toggleTitleDisplay() {
	var tcon = document.querySelector("#title-header");
	if (tcon.style.visibility === 'hidden') {
		tcon.style.visibility = 'visible';
		tcon.style.display = 'block';
	} else {
		tcon.style.visibility = 'hidden';
		tcon.style.display = 'none';
	}
   // The reason to hide the title would be to maximize
   // the display, so do it automatically:
	displayFullHeight();
}



//////////////////////////////
//
// toggleHelpMenu --
//

function toggleHelpMenu(state) {
	var help = document.querySelector("#help-container");
   if (!help) {
      return;
   }
   if (typeof state === 'undefined') {
      state = help.style.display === 'none' ? 0 : 1;
   	state = !state;
   }

   if (state) {
		help.style.display = 'block';
   } else {
		help.style.display = 'none';
   }
}



//////////////////////////////
//
// displayNextWorkPage --
//

function displayNextWorkPage() {
   window.location = NEXT_WORK;
}



//////////////////////////////
//
// displayPreviousWorkPage --
//

function displayPreviousWorkPage() {
   window.location = PREVIOUS_WORK;
}



//////////////////////////////
//
// displayPreviousRepertoryPage --
//

function displayPreviousRepertoryPage() {
	var i;
	SECTIONS = [];
	if ((localStorage.PROLLjrpid == null) || (localStorage.PROLLjrpid == "")) {
		localStorage.PROLLjrpid = "Jos2721";
	}
	InitializeWorklist();
	var pieces = localStorage.PROLLjrpid.match(/^([A-Z][a-z][a-z])/);
	if (pieces == null) {
		return;
	}
	var repertory = pieces[1];
	
	for (i=0; i<WORKLIST.length; i++) {
		if (repertory.match(WORKLIST[i].repid)) {
			if (i == 0) {
				localStorage.PROLLjrpid = WORKLIST[WORKLIST.length-1].works[0].id;
			} else {
				localStorage.PROLLjrpid = WORKLIST[i-1].works[0].id;
			}
			displayWork(localStorage.PROLLjrpid);
			return false;
		}
	}
}



//////////////////////////////
//
// displayNextRepertoryPage --
//

function displayNextRepertoryPage() {
	var i;
	InitializeWorklist();
	SECTIONS = [];
	var pieces = localStorage.PROLLjrpid.match(/^([A-Z][a-z][a-z])/);
	var repertory = pieces[1];
	
	for (i=0; i<WORKLIST.length; i++) {
		if (repertory.match(WORKLIST[i].repid)) {
			if (i == WORKLIST.length - 1) {
				localStorage.PROLLjrpid = WORKLIST[0].works[0].id;
			} else {
				localStorage.PROLLjrpid = WORKLIST[i+1].works[0].id;
			}
			displayWork(localStorage.PROLLjrpid);
			return false;
		}
	}
}



//////////////////////////////
//
// displayWork --
//

function displayWork(jrpid) {
   window.location = "/proll/?id=" + jrpid;
}



//////////////////////////////
//
// setVoiceLabelColors --
//

function setVoiceLabelColors() {
   var svg = document.querySelector("svg");
   var tracks = svg.querySelectorAll('g[class^="track-"]');
   var i;
   for (i=0; i<tracks.length; i++) {
      color = tracks[i].style.fill;
		var box = document.querySelector("#v" + (i+1) + " + label");
      if (!box) {
         continue;
      }
      box.style.color = color;
   }


}



//////////////////////////////
//
// loadWorklist -- load an ordered list of the works to use with shift-arrow keys.
//
//

function loadWorklist(url) {
   var request = new XMLHttpRequest();
   request.open("GET", url);
   request.addEventListener("load", function() {
	   prepareWorklist(request.responseText);
   });
   request.send();
}



//////////////////////////////
//
// prepareWorklist --
//

function prepareWorklist(content) {
   var page = location.pathname.replace(/\//g, "");
   var list = content.match(/[^\r\n]+/g);
	var index = list.indexOf(page);
   var nextindex;
   var previousindex;
   if (index >= 0) {
      nextindex = index+1;
      previousindex = index-1;
   } else {
      nextindex = 0;
      previousindex = list.length - 1;
   }
   if (nextindex >= list.length) {
      nextindex = 0;
   }
   if (previousindex < 0) {
      previousindex = list.length-1;
   }
   NEXT_WORK = "/" + list[nextindex]
   PREVIOUS_WORK = "/" + list[previousindex]
}


