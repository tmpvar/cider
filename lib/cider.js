/*
 * Cider - Canvas Text Editor
 *   Licensed under the MIT (LICENSE.txt)
 */
"use strict";
(function(export) {
  var cider = export.cider = {

  };

  // Core constructs
  // Shared line manipulation method
  var buildPosManip = function(lines, row, col) {

    // create missing rows
    var createUntil = function(row) {
      var i = lines.length;
      for (i;i<=row;i++) {
        if (!lines[i]) {
          lines.push("");
        }
      }
    };

    // Line/Char modifiers
    return {
      get : function() {
        return (lines[row] && lines[row][col]) ?
                lines[row][col]                :
                null;
      },
      set : function(char) {
        // TODO: possibly expand the row/col to meet the requested row/col
        if (lines[row] && lines[row][col]) {
          lines[row][col] = char;
        }
      },
      remove : function() {
        if (lines[row] && lines[row][col]) {
          lines[row] = lines[row].substring(0, col) +
                            lines[row].substring(col+1);
        }
      },
      removeLine : function() {
        var start = lines.slice(0,row),
            rest = lines.slice(row+1);
        start.push.apply(start, rest);
        lines = start;
      },
      insertLine : function(string) {
        var start = lines.slice(0,row),
            rest = lines.slice(row);
        start.push(string || ""); // new line
        start.push.apply(start, rest);
        lines = start;
      },
      insert : function(char) {
        if (!lines[row]) {
          createUntil(row);
        }

        var line = lines[row];
        lines[row] = line.substring(0, col) + char + line.substring(col);
      },
      append : function(char) {
        if (lines.length < row) {
          return;
        }
        lines[row] += char;
      },

      length   : function() {
        return (lines[row]) ? lines[row].substring(col).length : 0;
      },
      toString : function() {
        return (lines[row])               ?
                lines[row].substring(col) :
                "";
      },
      fromString : function(string) {
        lines[row] = string;
      }
    };
  };


  // Features
  cider.feature = {};

  // Textual
  // This is basically a core carena editor object
  cider.feature.Textual = function(obj, options) {
    if (!obj.event) {
      carena.feature.Eventable(obj, options);
    }

    if (obj.text) {
      options.lines = obj.text.replace("\r", "").split("\n");
    }

    obj.background = obj.background || "#283133";
    obj.color      = obj.color || "white";
    var safe = {
      font : options.font || {
        familiy : "Verdana",
        size: 18
      },
      lines : options.lines || [],
      textOffset : 0,
    };

    carena.applyProperties(obj, {
      render : function(renderer) {
        // TODO: consider moving this out
        var ctx = renderer.context;
        ctx.save();
        ctx.fillStyle = obj.background;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = obj.color;
        ctx.font = safe.font.size + "px " + safe.font.family;

        var offset = {x:0,y:0},//editor.getTextOffset(),
            len    = safe.lines.length;
        for (l=0; l<len; l++) {
            ctx.fillText(safe.lines[l],
                         obj.x + offset.x,
                         obj.y + (safe.font.size*(l+1)));
        }
        ctx.restore();
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
    });
  };
}(window));
