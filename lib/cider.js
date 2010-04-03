/*
 * Cider - Canvas Text Editor
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 */

(function() {
	var

	// local copy of cider
    cider = function() {
        cider.fn.init();
    };

	// setup global scope of cider
	window.cider = cider;
	
	cider.fn = {
		// lines array
		lines : [],

	    init : function()
	    {
			// insert cavas object into document
			document.body.innerHTML = '<canvas id="canvas" height="600" width="600"></canvas>';
			
			var canvas = document.getElementById("canvas");
			var ctx = canvas.getContext("2d");

			ctx.textBaseline = "top";
			ctx.font = "20px Arial";

			setInterval(function() {
				cider.fn.paint(ctx);
			}, 30);

			document.addEventListener('keydown', function(event){
				cider.fn.handleKeyPress(event);
			}, false);
	    },
	    
	    handleKeyPress : function(event)
	    {
	    	var code = event.keyCode;


			
			var char = String.fromCharCode(code);
			
	    	this.store(char);
	    },
	    
	    store : function(char)
	    {
	    		var pos = {col: 0, row: 0};
    		
	    	if(!this.lines[pos.row]) {
	    		this.lines[pos.row] = char;
	    	} else {
	    		this.lines[pos.row] += char;
	    	}
	    	console.log(this.lines);
	    	console.log(this.lines[pos.row]);
	    	console.log(this.lines[pos.row].length);
	    },

	    paint : function(ctx) {
			var background = "#2A3335";
			var foreground = "#FFFFFF";
			
			// clearRect isn't set first time around
			if(ctx.clearRect) {
				ctx.clearRect (0, 0, 600, 600);
			};
			
			ctx.fillStyle = background;
			ctx.fillRect (0, 0, 600, 600);
			
			ctx.fillStyle = foreground;
			var lineHeight = 15;
			var y = lineHeight;
			
			if (this.lines) {
				for (var l = 0; l < cider.fn.lines.length; l++) {
					ctx.fillText(cider.fn.lines[l], 10, y);
					y += lineHeight;
				}
			}
		}
			
/*			
			var lines = [""], line = 0, level = 10;

			function clearLine(num) {
			    var width = ctx.measureText(lines[num]).width || lines[line].length * 20;
			    ctx.fillStyle = background;
			    ctx.fillRect(10,10*(num-1),width + 10, 20);
			}

			document.addEventListener("keydown", function(event) {
				var code;
				  
				if (event.keyCode) {
				    code = event.keyCode;
				} else if (event.which) {
				    code = event.which;
				}

				switch (code) {
				    // backspace
				    case 8 :
				    	clearLine(line);
					    lines[line] = lines[line].substring(0, lines[line].length-1 || 0);
					    event.preventDefault();
				    break;
				    // space
				    case 32:
				    	lines[line] += String.fromCharCode(code);
				    	event.preventDefault();
				    break;
				    // return
				    case 13:
				    	event.preventDefault();
				    	level += 30;
				    	lines[line] = lines[line].substring(0, lines[line].length = 0 || 0);
						clearLine(line);
				    break;
				    // standard keys
				    default:
					    var char = String.fromCharCode(code);
					    var casing = (event.shiftKey) ? char.toUpperCase : char.toLowerCase;
					    lines[line] += casing.call(char);
				    break;
				}
  
				clearLine(line);
				 
				
//console.log(lines[line]);
				if (lines.length <= 100) {
					ctx.fillText(lines, 10, level);
				} else {
					ctx.fillText(lines, 10, 40);
				}
			}, false);
		}*/
	};	
})();