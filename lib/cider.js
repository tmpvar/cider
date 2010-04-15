/*
 * Cider - Canvas Text Editor
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

(function(window) {

  var cider = function(canvas) {

    // Private    
    var safe = {
      context    : canvas.getContext("2d"),
      plugins    : {},
      events     : {},
      lines      : [],
      textOffset : {x:0,y:0}
    };

    // TODO: this may move
    safe.context.textBaseline = "top";
    safe.context.font = "18px Courier New";    
    
    var buildPosManip = function(row,col) {
      
      function createUntil(row) {
        var i = safe.lines.length;
        for (i;i<=row;i++) {
          safe.lines.push("");
        }
      }
      
      return {
        set : function(char) {
        
        },
        remove : function(char) {
        
        },
        append : function(char) {
          if (!safe.lines[row]) {
            createUntil(row);
          }
        
          var line = safe.lines[row];
          safe.lines[row] = line.substring(0, col) + char + line.substring(col);
        }
      };
    };
    
    
    // Public
    safe.instance = {
      version : "0.0.1",
      length  : 0,
      context   : function() {
        return safe.context; 
      },
      addPlugin : function(name) {
        if (cider.plugins[name]) {
          safe.plugins[name] = cider.plugins[name](safe.instance);
        }
        return safe.instance;
      },
      removePlugin : function(name) {
        delete safe.plugins[name];
        return safe.instance;
      },
      bind : function(name, fn) {
        if (!safe.events[name]) {
          safe.events[name] = [];
        }
        safe.events[name].push(fn);
      },
      trigger : function(name, data) {
        
        if (safe.events[name]) {
          var i=0;len=safe.events[name].length;
          for (i; i<len; i++)
          {
            safe.events[name][i](data);
          }
        }
      },
      // TODO: rename this to text offset
      // TODO: provide an actual offset        
      setTextOffset : function(offset) {
        safe.textOffset = offset;
      },
      getTextOffset : function() {
        return safe.textOffset;
      },
      pos : buildPosManip
      
      
    };
    
    
    // Text Manipulation
    safe.instance.lines = function() {
    
      return {
        length : function() {
          return safe.lines.length;
        }, 
        get    : function(idx) {
          return {
            toString : function() {
                return safe.lines[idx];
            }
          }
          
          
        }
      
      };
    
    }
    
    
    return safe.instance;
    
  };
  
  
  // Hang plugins here
  cider.plugins = {};
  
  // Expose cider to window scope
  window.cider = cider;
})(window);
 
 
/*
        setText : function(text) {
          private.lines = text.split("\n");
        },
        getText : function() {
          return private.lines.join("\n");
        },
        setChar : function(row, col, char) {
          if (private.lines[row] && private.lines[row][col]) {
            private.lines[row][col] = char;
          }
        },
        addChar : function(row, col, char) {
            if (private.lines[row] && private.lines[row][col]) {
              private.lines[row][col] += char;
            }
        },
        getChar : function(row, col) {
          if (private.lines[row] && lines[row][col]) {
            return private.lines[row][col];
          }
          return null;
        },
        insertString : function(row, col, string) {
          if (private.lines[row] && private.lines[row][col]) {

          }
        },
        removeChar : function(row, col) {
          if (private.lines[row] && private.lines[row][col]) {
            private.lines[row] = private.lines[row].substring(0, col) + 
                              private.lines[row].substring(col+1);
          }
        },
    };
*/
