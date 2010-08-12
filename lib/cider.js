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
          lines[row][col] = char || "";
        }
      },
      remove : function() {
        if (lines[row] && lines[row][col]) {
          line = lines[row];
          lines[row] = line.substring(0, col) || "";
          lines[row] += line.substring(col+1) || "";
        }
      },
      removeLine : function() {
        lines.splice(row, 1);
        row--;
      },
      insertLine : function(string) {
        lines.splice(row, 0, string || "");
        row++;
      },
      insert : function(char) {
        if (!lines[row]) {
          createUntil(row);
        }

        var line = lines[row];
        lines[row] = line.substring(0, col) || "";
        lines[row] += char || "";
        lines[row] += line.substring(col) || "";
      },
      append : function(char) {
        if (lines.length < row) {
          return;
        }
        lines[row] += char || "";
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
        familiy : "monospace",
        size: 18
      },
      lines : options.lines || [],
      textOffset : {x: 0, y: 0}
    };

    carena.applyProperties(obj, {
      get textual() { return true; },
      render : function(renderer) {
        // TODO: consider moving this out
        var ctx = renderer.context;
        ctx.font = safe.font.size + "px " + safe.font.family;
        ctx.save();
        ctx.fillStyle = obj.background;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = obj.color;

        var offset = obj.getTextOffset(),
            len    = safe.lines.length;
        for (l=0; l<len; l++) {
            ctx.fillText(safe.lines[l],
                         obj.x + offset.x,
                         obj.y + (safe.font.size*(l+1))) + offset.y;
        }
        ctx.restore();
      },
      setTextOffset : function(offset) {
        safe.textOffset = offset;
      },
      getTextOffset : function() {
        return safe.textOffset;
      },
      pos : function(row, col) {
        return buildPosManip(safe.lines, row, col);
      },
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

  cider.feature.FocusTarget = (function() {
    var currentTarget = null; // there may only be one

    return function(obj, options) {

      if (!obj.event) {
        carena.feature.Eventable(obj, options);
      }

      if (currentTarget === null) {
        currentTarget = obj;
      }

      return carena.applyProperties(obj, {
        get focusTarget() { return true; },
        hasFocus : function() {
          return currentTarget === obj;
        },
        setFocus : function() {
          var oldTarget = currentTarget;
          currentTarget = obj;

          obj.event.trigger("focus.out", {
            target: oldTarget,
            next: currentTarget
          });

          obj.event.trigger("focus.in", {
            target: currentTarget
          });
        }
      });
    }

  })();

  cider.feature.Keyboard = function(obj, options) {
    var safe = {
      layouts : {}
    };

    safe.layouts.qwerty = {
      shiftKeys : {
        48:")", 49:"!", 50:"@", 51:"#", 52:"$", 53:"%", 54:"^",
        55:"&", 56:"*", 57:"(", 59:":", 61:"+", 65:"A", 66:"B",
        67:"C", 68:"D", 69:"E", 70:"F", 71:"G", 72:"H", 73:"I",
        74:"J", 75:"K", 76:"L", 77:"M", 78:"N", 79:"O", 80:"P",
        81:"Q", 82:"R", 83:"S", 84:"T", 85:"U", 86:"V", 87:"W",
        88:"X", 89:"Y", 90:"Z", 107:"+", 109:"_", 186: ":",
        187:"+", 188:"<", 189:"_", 190:">", 191:"?", 192:"~",
        219:"{", 220:"|", 221:"}", 222: "\""
      },
      printKeys : {
        32:' ', 48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5",
        54:"6", 55:"7", 56:"8", 57:"9", 59:";", 61:"=", 65:"a",
        66:"b", 67:"c", 68:"d", 69:"e", 70:"f", 71:"g", 72:"h",
        73:"i", 74:"j", 75:"k", 76:"l", 77:"m", 78:"n", 79:"o",
        80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v",
        87:"w", 88:"x", 89:"y", 90:"z", 107:"=", 109:"-",
        110:".", 186:";", 187:"=", 188:",", 189:"-", 190:".",
        191:"/", 192:"`", 219:"[", 220:"\\", 221:"]", 222:"\'"
      }
    };

    // set up key press event listener
    // TODO: calls to keybinder plugin
    carena.applyProperties(obj, {
      handleKey : function(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        // prevent keys from affecting the browser
        //if (editor.getFocus()) {
        //}
        var code = e.charCode || e.keyCode,
            char = "",
            casing = "";

        if (obj.keyboardLayout.printKeys[code]) {
          char = (e.shiftKey) ?
                  obj.keyboardLayout.shiftKeys[code] :
                  obj.keyboardLayout.printKeys[code];
          e.character = char;
        } else {
          e.key = code;
        }
        e.target = obj;
        obj.event.trigger("keyboard.press", e);
      }

    });

    window.addEventListener('keypress', obj.handleKey, true);
    window.addEventListener('keydown', obj.handleKey, true);

    obj.keyboardLayout = options.keyboardLayout || safe.layouts.qwerty;

    return obj;
  };

  // Editable
  cider.feature.Editable = function(obj, options) {
    // Editable requires children which means it should be a carena Node
    if (!obj.bounds) {
      carena.feature.Node(obj, options);
    }

    if (!obj.handleKey) {
      cider.feature.Keyboard(obj, options);
    }

    var safe = {};

    carena.applyProperties(obj, {
      get editable() { return true; }
    });

    // Add a cursor
    obj.add(carena.Build({}, [
      carena.feature.Node,
      carena.feature.Eventable,
      carena.feature.RelativeToParent,
      cider.feature.Cursor
    ]));


    // TODO: move this to a KeyMap feature
    return obj;
  };

  // Cursor
  cider.feature.Cursor = function(obj, options) {
    if (!obj.event) {
      carena.feature.Eventable(obj, options);
    }

    var safe = {};

    // cursor position
    var pos = {col: 0, row: 0},
        hideDuration     = 500,
        showDuration     = 500,
        opacity          = 0.5,
        x                = 10,
        y                = 10,
        charWidth        = 11,
        charHeight       = null,
        currentOperation = null;

    function onKeyPress(name, data) {
      charHeight = obj.parent.font.size.lineHeight();
      currentOperation = obj.show;
      if (data.character) {
        obj.parent.pos(pos.row, pos.col).insert(data.character);
        pos.col+=data.character.length;
      } else {
          switch (data.key)
          {
            case 13:
              if (pos.col > obj.parent.pos(pos.row,0).length()) {
                pos.row++;
                pos.col=0;
              } else {
                var start = obj.parent.pos(pos.row,0).toString()
                                      .substring(0,pos.col),
                    end   = obj.parent.pos(pos.row,0).toString()
                                      .substring(pos.col);
                obj.parent.pos(pos.row, pos.col).fromString(start || "");
                pos.row++;
                pos.col = 0;
                obj.parent.pos(pos.row, pos.col).insertLine(end || "");
              }
            break;

            case 8:
              // first char in a line
              if (pos.col === 0) {
                var prev = obj.parent.pos(pos.row,0).toString();
                if (pos.row > 0) {
                  prev = prev.substring(pos.col);
                  obj.parent.pos(pos.row, pos.col).removeLine();
                  pos.row--;
                  pos.col = obj.parent.pos(pos.row,0).length();
                  obj.parent.pos(pos.row,pos.col).append(prev || "");
                }
              // anywhere else in the line
              } else {
                pos.col--;
                obj.parent.pos(pos.row,pos.col).remove();
              }
            break;

            case 38: // up
              if (pos.row > 0) {
                pos.row--;
              }

              // position the cursor correctly on the col
              if (pos.col > obj.parent.pos(pos.row,0).length()) {
                pos.col = obj.parent.pos(pos.row,0).length();
              }
            break;

            case 40: // down
              if (pos.row < obj.parent.length()-1) {
                pos.row++;
              }

              // position the cursor correctly on the col
              if (pos.col > obj.parent.pos(pos.row,0).length()) {
                pos.col = obj.parent.pos(pos.row,0).length();
              }
            break;

            case 37: // left
              // start of line
              if (pos.row > 0 && pos.col === 0) {
                pos.row--;
                pos.col=obj.parent.pos(pos.row, 0).length();
              } else if (pos.col > 0){
                pos.col--;
              }
            break;

            case 39: // right
              // end of line
              if (pos.col > obj.parent.pos(pos.row, 0).length()-1) {
                if (pos.row < obj.parent.length()-1) {
                  pos.row++;
                  pos.col = 0;
                }
              } else {
                pos.col++;
              }
            break;
          }
      }
      return false;
    }

    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        if (data.previous) {
          data.previous.event.unbind("keyboard.press", onKeyPress);
        }

        data.current.event.bind("keyboard.press", onKeyPress);
      }
    });

    carena.applyProperties(obj, {
      show : function (renderer) {
        var posx   = obj.x + obj.parent.getTextOffset().x,
            posy   = obj.y + pos.row * charHeight, currentPosition,
            text   = obj.parent.pos(pos.row,0).toString()
                               .substring(0,pos.col),
            length = text.length,
            ctx    = renderer.context;

        if (length > 0) {
          posx += ctx.measureText(text).width;
        }
        ctx.save();
        ctx.fillStyle = obj.color || "white";
        ctx.fillRect(posx,posy,2,obj.parent.font.size.lineHeight());
        ctx.restore();
      },
      hide : function() {
        // fade out or something
      },
      cycleRenderOperation : function() {
        if (currentOperation === obj.hide) {
          currentOperation = obj.show;
          setTimeout(obj.cycleRenderOperation, showDuration);
        } else {
          currentOperation = obj.hide;
          setTimeout(obj.cycleRenderOperation, hideDuration);
        }
      },
      render : function(renderer) {
          currentOperation(renderer);
      }
    });

    // Setup cursor timer
    obj.cycleRenderOperation();

    return obj;
  };

  cider.feature.LineNumbers = function(obj, options) {
    // Ensure this is a node
    if (!obj.bounds) {
      carena.feature.Node(obj, options);
    }

    // Ensure this is Eventable
    if (!obj.event) {
      carena.feature.Eventable(obj, options);
    }

    // TODO: add the ability to detect a scroll event

    lineNumberOptions = options.linenumbers || {};
    var safe = {
      backgroundColor : lineNumberOptions.background || "black",
      textAlign       : lineNumberOptions.textAlign || "right",
      parentOffset    : {x:0, y:0}
    };

    obj.width = lineNumberOptions.width || 30;
    // On reparenting, revert the existing parent and add a text offset
    // to the new parent
    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        var offset;
        if (data.previous && data.previous.getTextOffset) {
          offset = data.previous.getTextOffset();
          offset.x -= obj.width
          data.previous.setTextOffset(offset);
        }

        if (data.current && data.current.getTextOffset) {
          offset = data.current.getTextOffset();
          offset.x += obj.width;
          data.current.setTextOffset(offset);
        }
      }
    });

    return carena.applyProperties(obj, {
      render : function(renderer) {
        var l          = 1,
            height     = obj.parent.height,
            lineHeight = obj.parent.font.size.lineHeight(),
            lines      = Math.ceil(height/lineHeight),
            ctx        = renderer.context;


        ctx.save();
        // Expected that the line numbers are a child of the editor
        ctx.font = obj.parent.font.get();
        ctx.fillStyle = safe.backgroundColor;
        ctx.fillRect(obj.parent.x,
                     obj.parent.y,
                     obj.width-2,
                     obj.parent.height);
        ctx.fillStyle = "white";//obj.color || "#DDD";
        ctx.textAlign = safe.textAlign;
        for (l; l<lines; l++) {
          ctx.fillText(l,
                       obj.parent.x + (obj.width-5),
                       obj.parent.y + (lineHeight)*l);
        };
        ctx.restore();
      }
    });
  };
}(window));
