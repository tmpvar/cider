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
  var buildPosManip = function(obj, lines, row, col) {

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
          var oldValue = lines[row][col];
          lines[row][col] = char || "";
          obj.event.trigger("text.character", {
            node: obj,
            previous: oldValue,
            current: lines[row][col]
          });
        }
      },
      remove : function() {
        if (lines[row] && lines[row][col]) {
          var oldLine = lines[row];
          line = lines[row];
          lines[row] = line.substring(0, col) || "";
          lines[row] += line.substring(col+1) || "";
          obj.event.trigger("text.line", {
            node: obj,
            previous: oldLine,
            current: line
          });
        }
      },
      removeLine : function() {
        lines.splice(row, 1);
        var oldLength = row;
        row--;
        obj.event.trigger("text.lines.count", {
          node: obj,
          previous: oldLength,
          current: row
        });
      },
      insertLine : function(string) {
        lines.splice(row, 0, string || "");
        var oldLength = row;
        row++;
        obj.event.trigger("text.lines.count", {
          node: obj,
          previous: oldLength,
          current: row
        });
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

  // Carena Features

  // Textual
  // This is basically a core carena editor object
  carena.addFeature("cider.Textual",  function(obj, options, storage) {
    carena.require("carena.Eventable", arguments);
    storage.text = storage.text || obj.text || options.text ||  "";

    if (storage.text) {
      options.lines = storage.text.replace("\r", "").split("\n");
    }

    obj.background = obj.background || "#283133";
    obj.color      = obj.color || "white";
    obj.offset     = obj.offset || {x: 0, y: 0};

    var safe = {
        font : options.font || {
          family: "Courier New",
          size: 16
        },
        lines : options.lines || [],
        textOffset : obj.offset
    };
    carena.applyProperties(obj, {
      render : function(renderer) {
        // TODO: consider moving this out
        var ctx = renderer.context;
            ctx.font = safe.font.size + "px " + safe.font.family;
            ctx.save();
            ctx.fillStyle = obj.background;
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            ctx.fillStyle = obj.color;

        var offset     = obj.getTextOffset(),
            lines      = safe.lines.length,
            visLines   = Math.ceil(obj.height/safe.font.size)-1;
  
        for (l=0; l<lines; l++) {
          // only render within parents bounds
          if (l < visLines) {

            var text       = safe.lines[l],
                length     = text.length,
                sChar      = safe.lines[l].substring(0, 1),
                col        = ctx.measureText(sChar).width,
                columns    = Math.ceil((obj.width-offset.x)/col);

            if (length > columns && columns > 0) {
              text = safe.lines[l].substring(0, columns);
            }

            ctx.fillText(text,
                obj.x + offset.x,
                (obj.y-3) + (safe.font.size*(l+1)) + offset.y);
          } else {
            break;
          }
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
        return buildPosManip(obj, safe.lines, row, col);
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
      },
      dehydrate : function() {
        storage.text = obj.toString();
        return storage;
      }
    });
  });

  carena.addFeature("cider.FocusTarget",  (function() {
    var currentTarget = null, // there may only be one
        targets = {};
    
    return function(obj, options, storage) {

      carena.require("carena.Eventable", arguments);

      // When a focus target is removed, remove it from the queue
      obj.event.bind("node.parent", function(name, data) {
        if (data.node === obj) {
          
          if (targets[data.node.myId]) {
            delete targets[data.node.myId];
            for (var t in targets) {
              if (targets.hasOwnProperty(t)) {
                targets[t].setFocus();
              }
            }
          } else {
            targets[obj.myId] = obj;
          }
        }
      });
      
      if (currentTarget === null) {
        currentTarget = obj;
      }
      
      // TODO: handle tab in some fashion.
      
      obj.event.bind("mouse.down", function(name, data) {
        if (obj === data.target) {
          obj.setFocus();
        }
      })
      return carena.applyProperties(obj, {
        get focusTarget() { return true; },
        get hasFocus() {
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
  })());

  carena.addFeature("cider.Keyboard",  function(obj, options, storage) {
    var safe = {
      layouts : {},
      cache   : {}
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
      keyCodeToChar : function(ev) {
       var code = ev.keyCode;
       if (obj.keyboardLayout.printKeys[code]) {
          return (ev.shiftKey) ?
                  obj.keyboardLayout.shiftKeys[code] :
                  obj.keyboardLayout.printKeys[code];
        }
      },
      carenaEvent : function(ev) {
        var carenaEvent = {
              key: ev.keyCode,
              character: obj.keyCodeToChar(ev)
            };
        carenaEvent.ctrlKey  = (ev.ctrlKey)  ? true : false;
        carenaEvent.shiftKey = (ev.shiftKey) ? true : false;
        carenaEvent.altKey   = (ev.altKey)   ? true : false;
        carenaEvent.target   = obj;
        return carenaEvent;
      },
      keyDown : function(ev) {
        if (obj.hasFocus !== false) {
          var carenaEvent = obj.carenaEvent(ev);
          // is this key already being pressed?
          if (safe.cache[carenaEvent.key]) { return; }
          // TODO: this should move elsewhere.
          // Because every os has a different way of handling key repeats,
          // and we want to make sure we dont get double binds and such..
          safe.cache[carenaEvent.key] = setTimeout(function() {
            if (safe.cache[carenaEvent.key]) {
              safe.cache[carenaEvent.key] = setTimeout(function quick() {
                obj.event.trigger("keyboard.repeat", carenaEvent);
                if (safe.cache[carenaEvent.key]) {
                  safe.cache[carenaEvent.key] = setTimeout(quick, 10);
                }
              }, 10); // emit a repeat
            }
          }, 500); // wait to repeat

          if (obj.event.trigger("keyboard.down", carenaEvent) === false) {
            return false;
          }
        }
      },
      keyUp : function(ev) {
        var carenaEvent = obj.carenaEvent(ev);
        if (safe.cache[carenaEvent.key]) {
          clearTimeout(safe.cache[carenaEvent.key]);
          delete safe.cache[carenaEvent.key];
          if (obj.hasFocus !== false) {
            obj.event.trigger("keyboard.up", carenaEvent);
          }
        }
      }
    });

    var keydownHandler = function(ev) {
      if (ev.keyCode == "8") {
        ev.preventDefault();
        ev.stopPropagation();
      }
      if (obj.keyDown(ev) === false) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    };

    window.addEventListener('keydown', keydownHandler, true);
    window.addEventListener('keyup', obj.keyUp, true);

    obj.event.bind("node.parent", function(name, data) {
      window.removeEventListener("keydown", keydownHandler, true);
      window.removeEventListener("keyup", obj.keyUp, true);

      // bind again!
      if (data.current !== null && data.node === obj) {
        window.addEventListener("keydown", keydownHandler, true);
        window.addEventListener("keyup", obj.keyUp, true);
      }
    });

    obj.keyboardLayout = options.keyboardLayout || safe.layouts.qwerty;
    return obj;
  });

  // Editable
  carena.addFeature("cider.Editable",  function(obj, options, storage) {
    carena.require("carena.Node", arguments);
    carena.require("cider.Keyboard", arguments);

    var safe = {};

    carena.applyProperties(obj, {
      get editable() { return true; }
    });

    // Add a cursor
    obj.add(carena.build({}, [
      "carena.Node",
      "carena.Eventable",
      "carena.RelativeToParent",
      "cider.Cursor"
    ]));

    // TODO: move this to a KeyMap feature
    return obj;
  });

  // Cursor
  carena.addFeature("cider.Cursor",  function(obj, options, storage) {
    carena.require("carena.Eventable", arguments);

    var safe = {
      timer : null
    };

    // cursor position
    var pos              = {col: 0, row: 0},
        hideDuration     = 500,
        showDuration     = 500,
        opacity          = 0.5,
        x                = 10,
        y                = 10,
        charWidth        = 11,
        charHeight       = null,
        currentOperation = null;

    function onKeyDown(name, data) {
      charHeight = obj.parent.font.size.lineHeight();
      currentOperation = obj.show;
      clearTimeout(safe.timer);
      safe.timer = setTimeout(obj.cycleRenderOperation, showDuration);

      if (data.character) {
        obj.parent.pos(pos.row, pos.col).insert(data.character);
        pos.col+=data.character.length;
      } else if (data.ctrlKey) {
        switch (data.key) {
          case 36: // ctrl+home
            pos.row = 0;
            pos.col = 0;
          break;

          case 35: // ctrl+end
            pos.row = obj.parent.length()-1;
            // set end of line
            pos.col = obj.parent.pos(pos.row,0).length();
          break;
        }
      } else {
        switch (data.key)
        {
          case 13: // return
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

          case 8: // backspace
            // first char in a line
            if (pos.col === 0) {
              var prev = obj.parent.pos(pos.row,0).toString();
              if (pos.row > 0) {
                prev = prev.substring(pos.col);
                obj.parent.pos(pos.row, pos.col).removeLine();
                pos.row--;
                pos.col = obj.parent.pos(pos.row,0).length();
                obj.parent.pos(pos.row).append(prev || "");
              }
            // anywhere else in the line
            } else {
              pos.col--;
              obj.parent.pos(pos.row,pos.col).remove();
            }
          break;

          case 46: // delete
            // set end of line
            var eol = obj.parent.pos(pos.row,0).length();

            // check if were at the end of the line
            if (pos.col == eol) {
              pos.row++;
              var next = obj.parent.pos(pos.row,0).toString();
              next = next.substring(0);
              obj.parent.pos(pos.row, pos.col).removeLine();
              pos.row--;

              obj.parent.pos(pos.row).append(next || "");
            } else {
              // remove character
              obj.parent.pos(pos.row,pos.col).remove();
            }
          break;

          case 9: // tab
            options.tabChar = " ";
            options.tabSize = 2;
            for (l=0; l<options.tabSize; l++) {
              obj.parent.pos(pos.row, pos.col).insert(options.tabChar);
              pos.col++;
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

          case 36: // home
            pos.col = 0;
          break;

          case 35: // end
            // set end of line
            var eol = obj.parent.pos(pos.row,0).length();
            pos.col = eol;
          break;

          // the event wasnt caught, then send it on its way
          default:

            return true;
          break;
        }
      }
      obj.dirty = true;
      return false;
    }

    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        if (data.previous) {
          data.previous.event.unbind("keyboard.down", onKeyDown);
          data.previous.event.unbind("keyboard.repeat", onKeyDown);
        }

        data.current.event.bind("keyboard.down", onKeyDown);
        data.current.event.bind("keyboard.repeat", onKeyDown);
      }
    });

    carena.applyProperties(obj, {
      show : function (renderer) {
        if (obj.hasFocus !== false && obj.parent.hasFocus !== false) {
          
          var visLines = Math.ceil(obj.parent.height/charHeight)-2;
          // check if pos.row is growing past visible area
          if (pos.row > visLines) {
            pos.row = visLines;
          }
          
          var posx   = obj.parent.x + obj.parent.getTextOffset().x,
              posy   = obj.parent.y + pos.row * charHeight, currentPosition,
              text   = obj.parent.pos(pos.row,0).toString()
                                 .substring(0,pos.col),
              length = text.length,
              ctx    = renderer.context;

          if (length > 0) {
            posx += ctx.measureText(text).width,
            tWidth = ctx.measureText(text).width,
            visWidth = obj.parent.width-obj.parent.getTextOffset().x;

            // if posx breaches visible region, cap it
            if (tWidth > visWidth) {
              posx = obj.parent.width+obj.parent.x;
            }
          }
          ctx.save();
          ctx.fillStyle = obj.color || "white";
          ctx.fillRect(posx,posy,1,obj.parent.font.size.lineHeight());
          ctx.restore();
        }
      },
      hide : function() {
        // fade out or something
      },
      cycleRenderOperation : function() {
        if (currentOperation === obj.hide) {
          currentOperation = obj.show;
          safe.timer = setTimeout(obj.cycleRenderOperation, showDuration);
        } else {
          currentOperation = obj.hide;
          safe.timer = setTimeout(obj.cycleRenderOperation, hideDuration);
        }
      },
      render : function(renderer) {
          currentOperation(renderer);
      }
    });

    // Setup cursor timer
    obj.cycleRenderOperation();

    return obj;
  });

  carena.addFeature("cider.LineNumbers",  function(obj, options, storage) {
    carena.require("carena.Node", arguments);
    carena.require("carena.Eventable", arguments);

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
        ctx.fillStyle = "#bbbbbb";
        ctx.textAlign = safe.textAlign;
        for (l; l<lines; l++) {
          ctx.fillText(l,
                       obj.parent.x + (obj.width-5),
                       (obj.parent.y-3) + (lineHeight)*l);
        };
        ctx.restore();
      }
    });
  });
}(window));

