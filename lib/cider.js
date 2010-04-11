/*
 * Cider - Canvas Text Editor
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

(function () {
    var
    plugins = {},     // store all of the plugins here
    renderQueue = [], // plugins that need to be rendered (painters algo)
    updateQueue = [], // plugins that need to be updated on a cycle
    
    // remove me from here
    pos = {col: 0, row: 0},
    
    // local copy of cider
    cider = function (canvas) {
        cider.fn.init(canvas);
    };

    // setup global scope of cider
    window.cider = cider;
    
    cider.fn = {
        // lines array
        lines : [],

        addPlugin : function(name, obj) {
          // TODO: either pass in cider options or expose them.
          plugins[name] = new obj(cider.fn);  
        },
        removePlugin : function(name) {
          delete plugins[name];
        },
        addRenderStep : function(fn) {
          renderQueue.push(fn);
        },
        addUpdateStep : function(fn) {
          renderQueue.push(fn);
        },
        

        init : function (canvas)
        {            
            var ctx = canvas.getContext("2d");
                ctx.textBaseline = "top";
                ctx.font = "18px Arial";

                
            setInterval(function() {
                var step=0;len = renderQueue.length;
                for (step; step<len; step++) {
                  renderQueue[step](ctx);
                }

            }, 30);

            document.addEventListener('keydown', function(event){
                cider.fn.handleKeyPress(event);
            }, false);
        },
        
        handleKeyPress : function (event)
        {
           

            var code = event.keyCode,
                append = false,
                char = "",
                casing = "",
                line = this.lines;

                modKeys = {
                    16:'shift', 17:'ctrl', 18: 'alt'
                };
                shiftKeys = {
                    48:")", 49:"!", 50:"@", 51:"#", 52:"$", 53:"%", 54:"^", 55:"&", 56:"*",
                    57:"(", 59:":", 61:"+", 65:"A", 66:"B", 67:"C", 68:"D", 69:"E", 70:"F",
                    71:"G", 72:"H", 73:"I", 74:"J", 75:"K", 76:"L", 77:"M", 78:"N", 79:"O",
                    80:"P", 81:"Q", 82:"R", 83:"S", 84:"T", 85:"U", 86:"V", 87:"W", 88:"X",
                    89:"Y", 90:"Z", 107:"+", 109:"_", 188:"<", 190:">", 191:"?",
                    192:"~", 219:"{", 220:"|", 221:"}"
                };
                funcKeys = {
                    8: 'backspace',  9: 'tab',  13: 'return',  19: 'pause',  27: 'escape',  
                    33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home', 37: 'left',
                    38: 'up', 39: 'right', 40: 'down', 44: 'printscreen', 45: 'insert',
                    46: 'delete', 112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 116: 'f5',
                    117: 'f7', 119: 'f8', 120: 'f9', 121: 'f10', 122: 'f11', 123: 'f12',
                    144: 'numlock', 145: 'scrolllock'
                };
                printKeys = {
                    32:' ', 48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7",
                    56:"8", 57:"9", 59:";", 61:"=", 65:"a", 66:"b", 67:"c", 68:"d", 69:"e",
                    70:"f", 71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l", 77:"m", 78:"n",
                    79:"o", 80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w",
                    88:"x", 89:"y", 90:"z", 107:"=", 109:"-", 110:".", 188:",", 190:".",
                    191:"/", 192:"`", 219:"[", 220:"\\", 221:"]", 222:"\""
                };

                if (event.shiftKey) {
                    if (event.shiftKey && event.keyCode != '16') {
                        char = shiftKeys[code];
                        append = true;
                        
                        this.store(char, append);
                    } else {
                        char = "skip";
                    }
                } else  {
                    char = printKeys[code];
                    char = char;
                append = true;
                this.store(char, append);
            }
      /*
            switch (code) {
                // backspace
                case 8 :
                    if (line[pos.row] !== undefined && line[pos.row].length === 0) {
                        pos.row--;
                    }addRenderStep
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
        */
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
        }
    };
})();
