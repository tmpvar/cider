/*
 * Cider - Canvas Text Editor
 *   Licensed under the MIT (LICENSE.txt)
 */

(function(window) {

  var cider = function(canvas) {

    // Private    
    var safe = {
      context    : canvas.getContext("2d"),
      plugins    : {},
      events     : {},
      lines      : [],
      textOffset : {x:0,y:0},
      focus      : false,
      font       : { family: "Courier New", size: 18}
    };
    
    // TODO: this may move
    safe.context.font = "18px Courier New";    
    
    // check editor focus state
    cider.focus = {
        setFocus : function () {
            if (safe.focus == false) {
                safe.focus = true;
            } else {
                safe.focus = false;
            }
        }
    };
    
    var buildPosManip = function(row,col) {

      // create missing rows 
      var createUntil = function(row) {
        var i = safe.lines.length;
        for (i;i<=row;i++) {
          if (!safe.lines[i]) {
            safe.lines.push("");
          }
        }
      };
      
      // Line/Char modifiers
      return {
        get : function() {
          return (safe.lines[row] && safe.lines[row][col]) ?
                  safe.lines[row][col]                     :
                  null;
        },
        set : function(char) {
          // TODO: possibly expand the row/col to meet the requested row/col
          if (safe.lines[row] && safe.lines[row][col]) {
            safe.lines[row][col] = char;
          }
        },
        remove : function() {
          if (safe.lines[row] && safe.lines[row][col]) {
            safe.lines[row] = safe.lines[row].substring(0, col) + 
                              safe.lines[row].substring(col+1);
          }        
        },
        removeLine : function() {
          var start = safe.lines.slice(0,row), 
              rest = safe.lines.slice(row+1);
          start.push.apply(start, rest);
          safe.lines = start;
        },
        insertLine : function(string) {
          var start = safe.lines.slice(0,row), 
              rest = safe.lines.slice(row);
          start.push(string || ""); // new line
          start.push.apply(start, rest);
          safe.lines = start;
        },        
        insert : function(char) {
          if (!safe.lines[row]) {
            createUntil(row);
          }
        
          var line = safe.lines[row];
          safe.lines[row] = line.substring(0, col) + char + line.substring(col);
        },
        append : function(char) {
          if (safe.lines.length < row) {
            return;
          }
          safe.lines[row] += char;
        },
        length   : function() {
          return (safe.lines[row]) ? safe.lines[row].substring(col).length : 0;
        },
        toString : function() {
          return (safe.lines[row])               ?
                  safe.lines[row].substring(col) :
                  "";
        },
        fromString : function(string) {
          safe.lines[row] = string;
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
          for (i; i<len; i++) {
            safe.events[name][i](data);
          }
        }
      },
      setTextOffset : function(offset) {
        safe.textOffset = offset;
      },
      getTextOffset : function() {
        return safe.textOffset;
      },
      pos : buildPosManip,
      length : function() {
        return safe.lines.length;
      },
      getFocus : function () {
          return safe.focus;
      },
      font   : {
        get  : function() {
          return safe.font.size + "px " + safe.font.family;
        },
        // format: 19px Verdana
        set  : function(fontString) {
          var split = fontString.split("px ");
          safe.font.size = split[0];
          safe.font.family = split[1];
        },
        size : {
          get : function() {
            return safe.font.size;
          },
          set : function(px) {
            safe.font.size = px;
          },
          lineHeight : function () {
            return safe.font.size;
          }
        },
        family : {
          get : function() {
            return safe.font.family;
          },
          set : function(string) {
            safe.font.family = string;
          }
        }
      },
      toString : function() {
        return safe.lines.join("\n");
      },
      fromString : function(text) {
        safe.lines = text.split("\n");
      }
    };    
    return safe.instance;
  };
  
  // Hang plugins here
  cider.plugins = {};
  
  // Expose cider to window scope
  window.cider = cider;
})(window);
