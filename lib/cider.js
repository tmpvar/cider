/*
 * Cider - Canvas Text Editor
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 */

(function () {
	var

	// local copy of cider
    cider = function () {
        cider.fn.init();
    };

	// setup global scope of cider
	window.cider = cider;
	
	cider.fn = {
	    init : function ()
	    {
			// insert cavas object into document
			document.body.innerHTML = '<canvas id="canvas" height="600" width="600"></canvas>';
			
			var canvas = document.getElementById("canvas");
			var ctx = canvas.getContext("2d");
			var background = "#2A3335";
			 
			ctx.fillStyle = background;
			ctx.fillRect (0, 0, 600, 600);
			ctx.textBaseline = "top";
			ctx.font = "20px Arial";

			var lines = [""], line = 0, level = 10;

			function clearLine(num) {
			    var width = ctx.measureText(lines[num]).width || lines[line].length * 20;
			    ctx.fillStyle = background;
			    ctx.fillRect(10,10,width + 10, 20);
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
					  lines[line] = lines[line].substring(0, lines[line].length-2 || 0);
				    break;
				    // space
				    case 32:
				    	lines[line] += String.fromCharCode(code);
				    	event.preventDefault();
				    break;
				    // return
				    case 13:
				    	lines[line] += String.fromCharCode(code);
				    	level += 30;
				    break;
				    // standard keys
				    default:
					    var char = String.fromCharCode(code);
					    var casing = (event.shiftKey) ? char.toUpperCase : char.toLowerCase;
					    lines[line] += casing.call(char);
				    break;
				}
  
				clearLine(line);
				 
				ctx.fillStyle = "#FFFFFF";
//console.log(lines[line]);
				if (lines.length <= 100) {
					ctx.fillText(lines, 10, level);
				} else {
					ctx.fillText(lines, 10, 40);
				}
			}, false);
		}
	};
})();