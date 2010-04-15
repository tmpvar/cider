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
    },
    ctx = null,
    lines = [],
    events = {};

    // setup global scope of cider
    window.cider = cider;
    
    cider.fn = {
    
/** @#$@!!$%@$!@#$!@#$!@#$@!#$!@#$!@#$!@#$!@#$!@#$!@#$
TODO: MOVE THIS INTO PRIVATE SCOPE */
        lines : [],
/* @#$@!!$%@$!@#$!@#$!@#$@!#$!@#$!@#$!@#$!@#$!@#$!@#$ **/
    
    
    
    
        addPlugin : function(name, obj) {
          // TODO: either pass in cider options or expose them.
          plugins[name] = new obj(cider.fn);  
        },
        removePlugin : function(name) {
          delete plugins[name];
        },
        bind : function(name, fn) {
          if (!events[name]) {
            events[name] = [];
          }
          events[name].push(fn);
        },
        trigger : function(name, data) {
          if (events[name]) {
            var i=0;len=events[name].length;
            for (i; i<len; i++)
            {
              events[name][i].call(this, data);
            }
          }
        },

        setText : function(text) {
          lines = text.split("\n");
        },
        getText : function() {
          return lines.join("\n");
        },
        setChar : function(row, col, char) {
          if (lines[row] && lines[row][col]) {
            lines[row][col] = char;
          }
        },
        addChar : function(row, col, char) {
            if (lines[row] && lines[row][col]) {
              lines[row][col] += char;
            }
        },
        getChar : function(row, col) {
          if (lines[row] && lines[row][col]) {
            return lines[row][col];
          }
          return null;
        },
        insertString : function(row, col, string) {
          if (lines[row] && lines[row][col]) {
            var line = lines[row];
            lines[row] = line.substring(0, col) + string + line.substring(col);
          }
        },
        removeChar : function(row, col) {
          if (lines[row] && lines[row][col]) {
            lines[row] = lines[row].substring(0, col) + 
                                  lines[row].substring(col+1);
          }
        },
        setOffset : function(offset) {
          textOffset = offset;
        },
        getOffset : function() {
          return textOffset;
        },
        context : function() {
          return ctx;
        },
        
        line : function(number) {
          return {
            length : function() {
              return (lines[number] && lines[number].length) ?
                      lines[number].length                   :
                      0;
            }
          };
        },
        
        init : function (canvas)
        {            
          ctx = canvas.getContext("2d");
          ctx.textBaseline = "top";
          ctx.font = "18px Courier New";
        }
    };
})();
