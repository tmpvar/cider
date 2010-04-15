/*
 * Cider - Canvas Text Editor
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

(function(window, undefined) {

  var cider = function(canvas) {

    // private    
    var safe = {
      context    : canvas.getContext("2d"),
      plugins    : {},
      events     : {},
      lines      : [],
      textOffset : {x:0,y:0}
    };
    
    
    // public
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
      }
    };
    
    
    // Text Manipulation
    safe.instance.lines = function() {
    
      return {
        length : function() {
          return safe.lines.length;
        }, 
        get    : function(idx) {
          
        }
      
      };
    
    }
    
    
    return safe.instance;
    
  };
  /*
    place for hanging available plugins
    plugins are not registered automatically for flexibility.
  */
  cider.plugins = {};
  
  // expose cider to window scope
  window.cider = cider;
})(window);
 
 
/*
var cider = window.cider = (function () {
    // setup global scope of cider
    return function(canvas, config, plugins) {
      
      // Private scope
      var private = {
        textOffset : {x:0, y:0},
        ctx : null,
        lines : [],
        events : {},
        ctx : 
      };
      
      // TODO: this may move
      private.ctx.textBaseline = "top";
      private.ctx.font = "18px Courier New";
      
      // Public
      var self = {
        addPlugin : function(name, obj) {
          // TODO: either pass in cider options or expose them.
          private.plugins[name] = new obj(self);
          return; 
        },
        removePlugin : function(name) {
          delete private.plugins[name];
        },
        

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
            var line = private.lines[row];
            private.lines[row] = line.substring(0, col) + 
                              string + line.substring(col);
          }
        },
        removeChar : function(row, col) {
          if (private.lines[row] && private.lines[row][col]) {
            private.lines[row] = private.lines[row].substring(0, col) + 
                              private.lines[row].substring(col+1);
          }
        },
        context : function() {
          return private.ctx;
        },
        
        lines: function() {
          return {
            length : function() {
              return private.lines.length;
            },
            get    : function(row) {
              return {
                length : function() {
                  return (private.lines[number] && private.lines[number].length) ?
                          private.lines[number].length                        :
                          0;
                }
              }
            }
          }
        }
    };
    
    return self;
  };
})();*/
