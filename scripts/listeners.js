//
// Programmer:   Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date: Fri Mar  4 20:44:44 PST 2016
// Last Modified: Fri Mar  4 20:44:47 PST 2016
// Filename:      testroll/listeners.js
// Web Address:   http://josquin.stanford.edu/testroll/listeners.js
// Syntax:        JavaScript 1.8/ECMAScript 5; jQuery 2.0
// vim:           ts=3: ft=javascript
//
// Description:   Basic JavaScript utility functions for JRP pages
//                which is loaded on all pages.
//


//////////////////////////////
//
// DOMContentLoaded event listener -- What to do if the page
//    has finished loading.
//

window.addEventListener("DOMContentLoaded", function(event) {
   InitializeWorklist();
   loadSvgImage('#svg-container');
   prepareHelpMenu('#help-container');
   prepareTitle('#title-container');
   loadMp3Redirect('redirect-mp3.txt');
   loadWorklist('/worklist/worklist.txt');
});



//////////////////////////////
//
// keydown event listener -- What to do when a key is pressed.
//

window.addEventListener('keydown', processKeyCommand);


//////////////////////////////
//
// processDigit --
//

function processDigit(event) {
   var index = event.keyCode - ZeroKey;
   var vcount = VOICES.length;
   var i;

   if (index > vcount) {
      // not enough voices
      return;
   }

   if (index == 0) {
   	var anyon = false;
   	for (i=0; i<vcount; i++) {
      	anyon |= VOICES[i].checked;
   	}
   	if (!anyon) {
   		for (i=0; i<vcount; i++) {
      		VOICES[i].checked = true;
   		}
   	} else {
   		for (i=0; i<vcount; i++) {
      		VOICES[i].checked = false;
   		}
   	}
   	for (i=0; i<vcount; i++) {
      	displayVoice(VOICES[i].checked, vcount - i);
   	}
		return;
	}

   index--;

	if (event.shiftKey) {
      var otherstate = false;
      for (i=0; i<vcount; i++) {
         if (i != index) {
         	otherstate |= VOICES[i].checked;
         }
      }
      if (VOICES[index].checked && !otherstate) {
         for (i=0; i<vcount; i++) {
 				if (i != index) {
					VOICES[i].checked = true;
            } else {
               VOICES[i].checked = false;
            }
         }
		} else {
         for (i=0; i<vcount; i++) {
 				if (i != index) {
					VOICES[i].checked = false;
            } else {
               VOICES[i].checked = true;
            }
         }
      }
   	for (i=0; i<vcount; i++) {
      	displayVoice(VOICES[i].checked, vcount - i);
		}
	} else {
      VOICES[index].checked = !VOICES[index].checked;
		TRACK_STATES = VOICES[index].checked ? 1 : 0;
		displayVoice(VOICES[index].checked, index+1);
	}
}



//////////////////////////////
//
// processKeyCommand --
//

function processKeyCommand(event) {
	if (event.metaKey) {
         // Ignore keypress if the command key is also pressed.
			return;
	}

	var widthbox = document.querySelector("input#width");
	if (event.target && (event.target.id === widthbox.id)) {
      // Ignore numeric commands if typing numbers in the
      // width box:
		switch (event.keyCode) {
			case ZeroKey:  case OneKey:   case TwoKey:
			case ThreeKey: case FourKey:  case FiveKey:
			case SixKey:   case SevenKey: case EightKey:
			case NineKey:  case MinusKey: case PlusKey:
				return;
		}
	}

   if ((event.keyCode >= ZeroKey) && (event.keyCode <= NineKey)) {
      processDigit(event);
      return;
   }

	switch(event.keyCode) {

			case BKey:
				var svg = document.querySelector("svg");
				if (svg) {
					var background = svg
                                 .querySelector("rect.background");
					if (background) {
						var opacity = background.getAttribute("opacity");
						if (!opacity) {
							opacity = 1.0;
						}
						opacity = 1.0 - opacity;
						background.setAttribute("opacity", opacity);
					}
				}
				break;

			case TKey:
				toggleTitleDisplay();
				break;

			case GKey:
				var gs = document.querySelector("#grand-staff");
				gs.checked = !gs.checked;
				displayStafflines(gs.checked);
				break;

			case IKey:
				ICOUNT++;
				if (ICOUNT == 1) {
					var helpelem = document.querySelector("#search-help");
					console.log(helpelem);
					helpelem.className   = "";
					helpelem.style.display = "block";
					helpelem.background = "red";
					helpelem.innerHTML   = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;by <i>GraphMusic</i>";
					helpelem.style.marginLeft = "150px";
					// helpelem.style.color = "#634f29";
					helpelem.style.color = "#888888";
					helpelem.style.fontSize    = "180%";
					helpelem.style.marginTop = "21px";
					var aud2 = document.querySelector("#audio2");
					aud2.style.display = "none";
					aud2.style.visibility = "invisible";
					var inputs = document.querySelectorAll("input");
					for (var i=0; i<inputs.length; i++) {
						inputs[i].style.display = "none";
					}
				}
				if (ICOUNT == 2) {
					var names = document.querySelectorAll("label");
					console.log(names);
					for (var j=0; j<names.length; j++) {
						names[j].style.display = "none";
					}
				}
				break;
				

			case HKey:
				displayFullHeight();
				break;

			case LKey:
				var conn = document.querySelector("#note-connectors");
				conn.checked = !conn.checked;
				displayLines(conn.checked);
				break;

			case NKey:
				var minima = document.querySelector("#minima");
				minima.checked = !minima.checked;
				displayMinima(minima.checked);
				break;

			case RKey:
				var round = document.querySelector("#round-notes");
				round.checked = !round.checked;
				displayRound(round.checked);
				break;

			case WKey:
				displayFullWidth();
				break;

			case XKey:
				var maxima = document.querySelector("#maxima");
				maxima.checked = !maxima.checked;
				displayMaxima(maxima.checked);
				break;

			case SpaceKey:
				var audio = document.querySelector("audio");
				if (!audio) {
					PlayAudioFile2(getJrpid());
					var audio = document.querySelector("audio");
					if (audio) {
						audio.pause();
					}
				}
				if (audio) {
					if (audio.paused) {
						audio.play();
					} else {
						audio.pause();
					}
				}
				break;

			case SlashKey:
            toggleHelpMenu();
				break;

			case EscKey:
            toggleHelpMenu(0);
				break;

			case MinusKey:
				var width = document.querySelector("#width");
				var value = width.value;
				value = parseInt(value) - 50;
				if (value < 100) {
				value = 100;
				}
				width.value = value;
				displayWidth(value);
            svgCenterVertically();
				break;

			case EqualsKey:
				var width = document.querySelector("#width");
				var value = width.value;
				value = parseInt(value) + 50;
				if (value > 2800) {
				value = 2800;
				}
				width.value = value;
				displayWidth(value);
            svgCenterVertically();
				break;

			case RightArrowKey:
				if (event.shiftKey) {
					if (event.ctrlKey) {
						displayNextRepertoryPage();
					} else {
						displayNextWorkPage();
					}
				}
				break;
	
			case LeftArrowKey:
				if (event.shiftKey) {
					if (event.ctrlKey) {
						displayPreviousRepertoryPage();
					} else {
						displayPreviousWorkPage();
					}
				}
				break;

	}
	 
}


//////////////////////////////
//
// click event listener --  What to do when when clicking
//    in the window: if clicking on a rect, then start
//    playing the audio at that point.
//

window.addEventListener("click", function(event) {
	if (event.target.nodeName !== "rect") {
		return;
	}
	var clas = event.target.className.baseVal;
	if (!clas) {
		return;
	}
	var matches;
	var info = document.querySelector("#info");
	if (info && (matches = clas.match(/key-(\d+)/))) {
		var key = matches[1];
		console.log("KEY = ", key);
		info.innerHTML = "Pitch: " + MidiToDiatonicPC(key);
	}

   // start playing at that point in music
   var audio = document.querySelector("audio");
   if (!audio) {
      PlayAudioFile2(getJrpid());
      var audio = document.querySelector("audio");
      if (audio) {
         audio.pause();
      }
   }
   var child = audio.firstChild;
   if (child.nodeName !== "SOURCE") {
      PlayAudioFile2(getJrpid());
      audio.pause();
   } else {
      // do nothing
   }
   var matches;
   var ontime = 0;
   if (!audio.paused) {
      audio.pause();
   }
   if (matches = clas.match(/ont-([^\s]+)/)) {
      ontime = matches[1].replace(/d/, '.');
      STARTTIME = parseFloat(ontime) - OFFSET - 0.01;
      if (STARTTIME < 0) {
         STATTIME = 0.001;
      }
      audio.play();
   }
});

