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
    textOffset = {x:0, y:0},
    // local copy of cider
    cider = function (canvas) {
        cider.fn.init(canvas);
    };

    // setup global scope of cider
    window.cider = cider;
    
    cider.fn = {
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
        setText : function(text) {
          cider.fn.lines = text.split("\n");
        },
        getText : function() {
          return cider.fn.lines.join("\n");
        },
        setChar : function(row, col, char) {
          if (cider.fn.lines[row] && cider.fn.lines[row][col]) {
            cider.fn.lines[row][col] = char;
          }
        },
        getChar : function(row, col) {
          if (cider.fn.lines[row] && cider.fn.lines[row][col]) {
            return cider.fn.lines[row][col];
          }
          return null;
        },
        insertString : function(row, col, string) {
          if (cider.fn.lines[row] && cider.fn.lines[row][col]) {
            var line = cider.fn.lines[row];
            cider.fn.lines[row] = line.substring(0, col) + string + line.substring(col);
          }
        },
        removeChar : function(row, col) {
          if (cider.fn.lines[row] && cider.fn.lines[row][col]) {
            cider.fn.lines[row] = cider.fn.lines[row].substring(0, col) + 
                                  cider.fn.lines[row].substring(col+1);
          }
        },
        setOffset : function(x, y) {
          textOffset = {x:x ,y:y};
        },
        getOffset : function() {
          return textOffset;
        },        
        
        // lines array
        lines : [],
        
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
        }
    };
})();
