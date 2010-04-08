/*
 * Cider - Canvas Text Editor
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 */

(function () {
    var

    // remove me from here
    pos = {col: 0, row: 0},
    
    // local copy of cider
    cider = function () {
        cider.fn.init();
    };

    // setup global scope of cider
    window.cider = cider;
    
    cider.fn = {
        // lines array
        lines : [],

        init : function ()
        {
            // insert cavas object into document
            document.body.innerHTML = '<canvas id="canvas" height="600" width="600"></canvas>';
            
            var canvas = document.getElementById("canvas"),
                ctx = canvas.getContext("2d");
                ctx.textBaseline = "top";
                ctx.font = "18px Arial";

            setInterval(function() {
                cider.fn.paint(ctx);
            }, 30);

            document.addEventListener('keydown', function(event){
                cider.fn.handleKeyPress(event);
            }, false);
        },
        
        handleKeyPress : function (event)
        {
            event.preventDefault();

            var code = event.keyCode,
                append = false,
                char = "",
                casing = "",
                line = this.lines;

            switch (code) {
                // backspace
                case 8 :
                    if (line[pos.row] !== undefined && line[pos.row].length === 0) {
                        pos.row--;
                    }
                    if (line[pos.row] === undefined) {
                        pos.row++;
                    }
                    if (line[pos.row] !== undefined) {
                        char = line[pos.row].substring(0, line[pos.row].length-1 || 0);
                    } else {
                        char = "skip";
                    }
                break;
                // return
                case 13:
                    pos.row++;
                    char = "";
                    append = true;
                break;
                // default functionality for all keys
                default:                    
                    char = String.fromCharCode(code);
                    casing = char.toLowerCase;
                    char = casing.call(char);
                    if (event.shiftKey) {
                        if (event.shiftKey && event.keyCode != '16') {
                            casing = char.toUpperCase;
                            char = casing.call(char);
                        } else {
                            char = "skip";
                        }
                    }
                    append = true;
                break;
            }
            if (char !== "skip") {
                this.store(char, append);
            }
        },
        
        store : function (char, append)
        {
            var line = this.lines;
            
            if(!line[pos.row]) {
                line[pos.row] = char;
            } else if (line[pos.row].length + 1 < 100) {
                if (append === true) {
                    line[pos.row] += char;
                } else {
                    line[pos.row] = char;
                }
            } else {
                pos.row++;
                line[pos.row] = char;
            }
        },

        paint : function (ctx) {
            var background = "#2A3335",
                foreground = "#FFFFFF",
                lineHeight = 10,
                l = 0;
            
            // clearRect isn't set first time around
            if (ctx.clearRect) {
                ctx.clearRect (0, 0, 600, 600);
            }
            
            ctx.fillStyle = background;
            ctx.fillRect (0, 0, 600, 600);
            
            ctx.fillStyle = foreground;
            
            if (this.lines) {
                for (l; l < cider.fn.lines.length; l++) {
                    ctx.fillText(cider.fn.lines[l], 10, lineHeight);
                    lineHeight += 20;
                }
            }
        }
    };
})();