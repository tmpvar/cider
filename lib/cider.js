/*
 * Cider - Canvas Text Editor
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 */

(function() {
	var
	pos = {col: 0, row: 0},
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
			ctx.font = "18px Arial";

			setInterval(function() {
				cider.fn.paint(ctx);
			}, 30);

			document.addEventListener('keydown', function(event){
				cider.fn.handleKeyPress(event);
			}, false);
	    },
	    
	    handleKeyPress : function(event)
	    {
	    	event.preventDefault();

	    	var code = event.keyCode;
	    	var append = false;
	    	var firstLine;
	    	switch (code) {
		        // backspace
		        case 8 :
		        	if (this.lines[pos.row].length === 0) {
		        		pos.row--;
		        	}
	        		char = this.lines[pos.row].substring(0, this.lines[pos.row].length-1 || 0);

		        break;
 		        /* space
		        case 32:
		        	char = this.lines[pos.row].substring(0, this.lines[pos.row].length+5 || 0);
	    	    break;*/
    	    	// return
	   	        case 13:
	   	        	pos.row++;
	   	        	var char = null;
	   	        	var append = true;
		        break;
		        default:
		        	var char = String.fromCharCode(code);
					var casing = (event.shiftKey) ? char.toUpperCase : char.toLowerCase;
					char = casing.call(char);
					var append = true;
			    break;
	    	}

	    	this.store(char, append);
	    },
	    
	    store : function(char, append)
	    {
	    	if(!this.lines[pos.row]) {
	    		this.lines[pos.row] = char;
	    	} else if (this.lines[pos.row].length + 1 < 100) {
	    		if (append === true) {
	    			this.lines[pos.row] += char;
	    		} else {
	    			this.lines[pos.row] = char;
	    		}
	    	} else {
	    	  pos.row++;
	    	  this.lines[pos.row] = char;
	    	}
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
			var lineHeight = 10;
			
			if (this.lines) {
				for (var l = 0; l < cider.fn.lines.length; l++) {
					ctx.fillText(cider.fn.lines[l], 10, lineHeight);
					lineHeight += 20;
				}
			}
		}
	};	
})();