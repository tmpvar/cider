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
          lines.push({ val: "", color: obj.color || "black" });
        }
      }
    },

    // Line/Char modifiers
    pos = {
      set color(val) {
        if (lines[row] && lines[row][col]) {
          lines[row][col].color = val;
        }
      },
      get color() {
        return (lines[row] && lines[row][col] && lines[row][col].color) ?
                lines[row][col].color          :
                obj.color;
      },

      get : function(offset) {
        offset = offset || 0;
        return (lines[row] && lines[row][col+offset]) ?
                lines[row][col+offset]                :
                null;
      },

      set : function(char, offset) {
        offset = offset || 0;
        // TODO: possibly expand the row/col to meet the requested row/col
        if (!lines[row]) {
          lines[row] = [];
        }

        var oldValue = lines[row][col + offset] || {
          value : "",
          color : obj.color
        };

        lines[row][col + offset] = {
          value : char || "",
          color : obj.color
        };

        obj.event.trigger("text.character", {
          node: obj,
          previous: oldValue,
          current: lines[row][col + offset]
        });
      },
      remove : function() {
        if (lines[row] && lines[row][col] && lines[row].splice) {
          var oldLine = lines[row],
              line    = lines[row];

          lines[row].splice(col,1);
          obj.event.trigger("text.line", {
            node: obj,
            previous: oldLine,
            current: line
          });
        }
      },
      removeLine : function() {
        var oldLength = lines.length;
        lines.splice(row, 1);

        row--;
        if (row < 0) { row = 0; }

        obj.event.trigger("text.lines.count", {
          node: obj,
          previous: oldLength,
          current: row
        });
      },
      insertLine : function(string) {
        lines.splice(row, 0, []);
        var oldLength = row;
        row++;
        obj.pos(row,0).fromString(string);
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
        var oldStr = this.toString();
        lines[row].splice(col, 0, { value: char, color: obj.color});

        obj.event.trigger("text.insert", {
          node: obj,
          previous: oldStr,
          current: this.toString()
        });

      },
      append : function(char) {
        if (lines.length < row) {
          return;
        }
        var oldStr = this.toString();

        lines[row].push({
          value : char || "",
          color : obj.color
        });

        obj.event.trigger("text.append", {
          node: obj,
          previous: oldStr,
          current: this.toString()
        });
      },
      get length() {
        return (lines[row]) ? lines[row].length-col : 0;
      },
      toString : function() {
        var i = col, l = lines[row].length, ret = "";
        for (i; i<l; i++) {
          ret += pos.get(i-col).value;
        }
        return ret;
      },
      fromString : function(string) {
        var i = 0, l = string.length;
        for (i; i<l; i++) {
          pos.set(string[i], i);
        }
      }
    };
    return pos;

  };

  // Carena Features

  // Textual
  // This is basically a core carena editor object
  carena.addFeature("cider.Textual",  function(obj, options, storage) {
    carena.require("carena.Eventable", arguments);
    carena.require("carena.Box", arguments);

    storage.text = storage.text || obj.text || options.text ||  "";

    if (storage.text) {
      options.lines = storage.text.replace("\r", "").split("\n");
    }
    storage.scrollY = 0;
    storage.scrollX = 0;
    storage.totalCols = 0;
    storage.totalRows = 0;

    obj.background  = obj.background || "#283133";
    obj.color       = obj.color || "white";

    var canvas = carena.createCanvas();
    canvas.width = 100;
    canvas.height = 200;
    var safe   = {
          font : options.font || {
            family: "Courier New",
            size: 16
          },
          lines  : [],
          ctx : canvas.getContext("2d")
        };

    carena.applyProperties(obj, {
      render : function(renderer) {

        // ideally we would render to an intermediary -- var ctx = safe.ctx;
        var ctx = renderer.context;
            ctx.font = safe.font.size + "px " + safe.font.family;
            ctx.save();
            ctx.fillStyle = obj.background;
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            ctx.fillStyle = obj.color;

        var offsetX    = obj.style.paddingLeft || 0,
            offsetY    = obj.style.paddingTop || 0,
            l          = obj.scrollY/obj.font.size.lineHeight(),
            height     = obj.style.innerHeight || obj.height,
            width      = obj.style.innerWidth  || obj.width,
            maxLines   = Math.floor(height/safe.font.size) + l,
            cWidth     = obj.font.size.width = ctx.measureText("M").width,
            hOffset    = obj.scrollX/cWidth,
            maxCols    = Math.ceil(width/cWidth),
            totalRows  = obj.totalRows,
            startCol   = 0,
            hLimit     = hOffset+maxCols,
            r          = startCol,
            text,
            character  = "",
            textColor  = obj.color;

// && l<maxLines
        for (l; l<totalRows; l++) {
          // only render within parents bounds
          text = obj.pos(l, hOffset);
          for (r=startCol; r<hLimit; r++) {
            character = text.get(r-hOffset);
            if (!character) {
              break;
            } else if (textColor !== character.color) {
              textColor = character.color;
              ctx.fillStyle = textColor;
            }

            ctx.fillText(character.value,
                    obj.x + offsetX + (cWidth*(r-hOffset)),
                    (obj.y-3) + (safe.font.size*(l+1)) + offsetY - obj.scrollY);
          }
        }
        ctx.restore();
      },
      get totalCols() {
        // loop through lines and check lengths
        for (i=0; i<safe.lines.length; i++) {
          var line = safe.lines[i];
          if (line.length > storage.totalCols) {
            storage.totalCols = line.length;
          }
        }
        return storage.totalCols || 0;
      },
      get totalRows() {
        storage.totalRows = safe.lines.length;
        return storage.totalRows || 0;
      },
      get scrollX() { return storage.scrollX || 0 },
      set scrollX(value) {
        var oldValue = obj.scrollX;
        storage.scrollX = value;
        obj.event.trigger("node.scroll.x",{
          node     : obj,
          previous : oldValue,
          current  : value
        });
      },
      get scrollY() { return storage.scrollY; },
      set scrollY(value) {
        var oldValue = obj.scrollY;
        storage.scrollY = value
        obj.event.trigger("node.scroll.y",{
          node     : obj,
          previous : oldValue,
          current  : value
        });
      },
      pos : function(row, col) {
        return buildPosManip(obj, safe.lines, row, col);
      },
      get length() {
        return safe.lines.length;
      },
      font   : {
        get  : function() {
          return safe.font.size + "px " + safe.font.family;
        },
        // format: 19px Verdana
        set  : function(fontString) {
          var split = fontString.split("px ");
          safe.font.size = parseFloat(split[0]);
          safe.font.family = split[1];
        },
        size : {
          get : function() {
            return safe.font.size;
          },
          set : function(px) {
            safe.font.size = parseInt(px);
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
        var ret = [],
            i = 0,
            l = splitText.length;

        for (i; i<l; i++) {
          ret.push(obj.pos(i, 0).toString());
        }
        return ret.join("\n");
      },
      fromString : function(text) {
        var splitText = text.split("\n"),
            i = 0, l = splitText.length;
        for (i; i<l; i++) {
          obj.pos(i, 0).fromString(splitText[i]);
        }
      },
      dehydrate : function() {
        storage.text = obj.toString();
        return storage;
      }
    });

    // Setup Text if any
    obj.fromString(storage.text);

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
        setFocus : function(bool) {
          if (bool !== false) {
            var oldTarget = currentTarget;
            currentTarget = obj;

            obj.event.trigger("focus.out", {
              target: oldTarget,
              next: currentTarget
            });

            obj.event.trigger("focus.in", {
              target: currentTarget
            });
          } else {
            obj.event.trigger("focus.out", {
              target: currentTarget,
              next: null
            });
            currentTarget = null;
          }
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
          return (ev.shiftKey && obj.keyboardLayout.shiftKeys[code]) ?
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
    carena.require("cider.Textual",arguments);
    carena.require("carena.Node", arguments);
    carena.require("cider.Keyboard", arguments);

    var safe = { };

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

    // Track the cursor movements
    obj.event.bind('cursor.row', function(name, data) {
      var fh      = obj.font.size.lineHeight(),
          topRow  = Math.floor(obj.scrollY/fh),
          height  = obj.style.innerHeight || obj.height,
          botRow  = Math.floor(obj.style.innerHeight/fh) + topRow,
          current = data.current;

      if (data.current > data.previous) {
        if (current >= botRow) {
          obj.scrollY += fh;
        }
      } else if (data.current < data.previous) {
        if (current < topRow) {
          obj.scrollY -= fh;
          if (obj.scrollY < 0) {
            obj.scrollY = 0;
          }
        }
      }
    });

    obj.event.bind('cursor.col', function(name, data) {

      // TODO: to make this work with non-monospace fonts
      //       this will need to actually measure the text
      //       instead of using lineHeight
      var fw       = obj.font.size.width || 7,
          leftCol  = Math.floor(obj.scrollX/fw),
          rightCol = Math.floor(obj.style.innerWidth/fw) + leftCol,
          current  = data.current,
          l;

      if (data.current > data.previous) {
        if (current >= rightCol) {
          obj.scrollX = (current - (rightCol - leftCol)) * fw;
        } else {
          obj.scrollX = 0;
        }
      } else if (data.current < data.previous) {
        if (current === 0) {
          obj.scrollX = 0;
        } else if (current < leftCol) {
          obj.scrollX -= fw;
        } else if (current > rightCol) {
          // Test if a column was removed
          for (var i=0; i<obj.length; i++) {
            if (obj.pos(i, o).length+1 > obj.pos(data.node.row, 0).length &&
                i !== data.node.row)
            {
              l = true;
              break;
            }
          }
          if (!l) {
            obj.scrollX -= fw;
          }
        }

        if (obj.scrollX < 0) {
          obj.scrollX = 0;
        }
      } else {
        obj.scrollX = 0;
      }
    });
    return obj;
  });

  // Cursor
  carena.addFeature("cider.Cursor",  function(obj, options, storage) {
    carena.require("carena.Eventable", arguments);
    // TODO::You wouldn't know you had access to textual because theres nothing
    //       here
    options.tabChar = options.tabChar || " ";
    options.tabSize = options.tabSize || 2;
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
        obj.parent.pos(obj.row, obj.col).insert(data.character);
        obj.col+=data.character.length;
      } else if (data.ctrlKey) {
        switch (data.key) {
          case 36: // ctrl+home
            obj.row = 0;
            obj.col = 0;
          break;

          case 35: // ctrl+end
            obj.row = obj.parent.length-1;
            // set end of line
            obj.col = obj.parent.pos(obj.row,0).length;
          break;
        }
      } else {
        switch (data.key)
        {
          case 13: // return
            if (obj.col > obj.parent.pos(obj.row,0).length) {
              obj.row++;
              obj.col=0;
            } else {
              var start = obj.parent.pos(obj.row,0).toString()
                                    .substring(0,obj.col),
                  end   = obj.parent.pos(obj.row,0).toString()
                                    .substring(obj.col);
              obj.parent.pos(obj.row, obj.col).fromString(start || "");
              obj.row++;
              obj.col = 0;
              obj.parent.pos(obj.row, obj.col).insertLine(end || "");
            }
          break;

          case 8: // backspace
            // first char in a line
            if (obj.col === 0) {
              var prev = obj.parent.pos(obj.row,0).toString();
              if (obj.row > 0) {
                prev = prev.substring(obj.col);
                obj.parent.pos(obj.row, obj.col).removeLine();
                obj.row--;
                obj.col = obj.parent.pos(obj.row,0).length;
                obj.parent.pos(obj.row).append(prev || "");
              }
            // anywhere else in the line
            } else {
              obj.col--;
              obj.parent.pos(obj.row,obj.col).remove();
            }
          break;

          case 46: // delete
            // set end of line
            var eol = obj.parent.pos(obj.row,0).length;

            // check if were at the end of the line
            if (obj.col == eol) {
              obj.row++;
              var next = obj.parent.pos(obj.row,0).toString();
              next = next.substring(0);
              obj.parent.pos(obj.row, obj.col).removeLine();
              obj.row--;

              obj.parent.pos(obj.row).append(next || "");
            } else {
              // remove character
              obj.parent.pos(obj.row,obj.col).remove();
            }
          break;

          case 9: // tab
            if (!data.shiftKey) {
              for (l=0; l<options.tabSize; l++) {
                obj.parent.pos(obj.row, obj.col).insert(options.tabChar);
                obj.col++;
              }
            } else {
              for (l=0; l<options.tabSize; l++) {
                if (obj.parent.pos(obj.row, 0).get() === options.tabChar) {
                  obj.parent.pos(obj.row, 0).remove();
                  obj.col--;
                }
              }
            }
          break;

          case 38: // up
            if (obj.row > 0) {
              obj.row--;
            }

            // position the cursor correctly on the col
            if (obj.col > obj.parent.pos(obj.row,0).length) {
              obj.col = obj.parent.pos(obj.row,0).length;
            }
          break;

          case 40: // down
            if (obj.row < obj.parent.length-1) {
              obj.row++;
            }

            // position the cursor correctly on the col
            if (obj.col > obj.parent.pos(obj.row,0).length) {
              obj.col = obj.parent.pos(obj.row,0).length;
            }
          break;

          case 37: // left
            // start of line
            if (obj.row > 0 && obj.col === 0) {
              obj.row--;
              obj.col=obj.parent.pos(obj.row, 0).length;
            } else if (obj.col > 0){
              obj.col--;
            }
          break;

          case 39: // right
            // end of line
            if (obj.col > obj.parent.pos(obj.row, 0).length-1) {
              if (obj.row < obj.parent.length-1) {
                obj.row++;
                obj.col = 0;
              }
            } else {
              obj.col++;
            }
          break;

          case 36: // home
            obj.col = 0;
          break;

          case 35: // end
            // set end of line
            var eol = obj.parent.pos(obj.row,0).length;
            obj.col = eol;
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

    function clickHandler(name, data) {
      if (data.target === obj.parent) {
        currentOperation = obj.show;
        clearTimeout(safe.timer);
        safe.timer = setTimeout(obj.cycleRenderOperation, showDuration);
        var scrollX = obj.parent.scrollX,
            scrollY = obj.parent.scrollY;

        obj.col = Math.floor((data.mouse.x -
                              (obj.parent.x + obj.parent.style.paddingLeft - scrollX)
                             ) / obj.parent.font.size.width);

        obj.row = Math.floor((data.mouse.y -
                              (obj.parent.y + obj.parent.style.paddingTop - scrollY)
                             ) / obj.parent.font.size.lineHeight());

        // selecting empty rows puts pos at the end of last line
        if (obj.row >= obj.parent.length) {
          obj.row = obj.parent.length - 1;
          obj.col = obj.parent.pos(obj.row, 0).length;
        }

        // set col to text end if mouse pick is beyond text end
        if (obj.col > obj.parent.pos(obj.row, 0).length) {
          obj.col = obj.parent.pos( obj.row, 0).length;
        }

        // forcefully set the scrollX/Y to avoid jumping around
        obj.parent.scrollX = scrollX;
        obj.parent.scrollY = scrollY;
      }
    }

    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        if (data.previous) {
          data.previous.event.unbind("keyboard.down", onKeyDown);
          data.previous.event.unbind("keyboard.repeat", onKeyDown);
          data.previous.event.unbind("mouse.down", clickHandler);
        }

        data.current.event.bind("keyboard.down", onKeyDown);
        data.current.event.bind("keyboard.repeat", onKeyDown);
        data.current.event.bind("mouse.down", clickHandler);
      }
    });

    carena.applyProperties(obj, {
      show : function (renderer) {
        if (obj.hasFocus !== false && obj.parent.hasFocus !== false) {
          var height = obj.parent.style.innerHeight || obj.parent.height,
              visLines = Math.ceil((height+obj.parent.scrollY)/charHeight)-2;

          var posx   = obj.parent.x - obj.parent.scrollX + (obj.parent.style.paddingLeft || 0),
              posy   = obj.parent.y -
                       obj.parent.scrollY +
                       (obj.parent.style.paddingTop || 0) +
                       obj.row * obj.parent.font.size.lineHeight(),
              text   = obj.parent.pos(obj.row,0).toString()
                                                .substring(0,obj.col),
              ctx    = renderer.context,
              height = obj.parent.font.size.lineHeight();

          if (text.length > 0) {
            posx += ctx.measureText(text).width;
          }

          // only show cursor when its within viewable bounds
          if (posx <= obj.parent.style.innerWidth+obj.parent.x+obj.parent.style.paddingLeft) {
            ctx.save();
            ctx.fillStyle = obj.color || "white";
            ctx.fillRect(posx,posy,1,height);
            ctx.restore();
          }
        }
      },
      get col() { return pos.col; },
      set col(value) {
        var oldValue = pos.col;
        pos.col = value;
        obj.event.trigger('cursor.col',{
          node : obj,
          previous : oldValue,
          current  : value
        });
      },
      get row() { return pos.row },
      set row(value) {
        var oldValue = pos.row;
        pos.row = value;
        obj.event.trigger('cursor.row', {
          node: obj,
          previous: oldValue,
          current : value
        });
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
      width           : lineNumberOptions.width || 25
    };

    obj.width = safe.width;

    // On reparenting, revert the existing parent and add a text offset
    // to the new parent
    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        if (data.previous && data.previous.style) {
          data.previous.style.paddingLeft -= obj.width;
        }

        if (data.current && data.current.style) {
          data.current.style.paddingLeft += obj.width;
        }
      }
    });

    return carena.applyProperties(obj, {
      render : function(renderer) {
        var l          = 1,
            lineOffset = (obj.parent.scrollY > 0) ?
                          Math.floor(obj.parent.scrollY/obj.parent.font.size.lineHeight()) :
                          0,
            lineHeight = obj.parent.font.size.lineHeight(),
            maxLines   = Math.ceil(obj.parent.height/lineHeight),
            ctx        = renderer.context,
            // font width TODO: calc font width automatically
            fw         = 7;

        ctx.save();
        // Expected that the line numbers are a child of the editor
        ctx.font = obj.parent.font.get();
        ctx.fillStyle = safe.backgroundColor;
        ctx.fillRect(obj.parent.x,
                     obj.parent.y,
                     obj.width,
                     obj.parent.height);
        ctx.fillStyle = "#bbbbbb";
        ctx.textAlign = safe.textAlign;
        for (l; l<maxLines; l++) {
          ctx.fillText((l+lineOffset) + "",
                       obj.parent.x + (obj.width-5),
                       (obj.parent.y-3) + (lineHeight)*l);

          var lineNumWidth = new String(l+lineOffset);

          if (obj.width < lineNumWidth.length*fw+fw) {
            obj.width = obj.width+fw;
            obj.parent.style.paddingLeft += fw;
          }
        };
        ctx.restore();
      }
    });
  });

  carena.addFeature("cider.TextSelection", function(obj, option, storage) {
    carena.require("carena.Node");
    carena.require("carena.Eventable");

    storage.selections = [];

    return carena.applyProperties(obj, {
      get selection() { return storage.selections[0] || null},
      setSelection : function(start, end) {
        var oldSelection = obj.selection;
        storage.selections = [{ start: start, end: end }];
        obj.event.trigger("text.select", {
          node     : obj,
          previous : oldSelection,
          current  : storage.selections
        });
      },
      render : function(renderer) {

      }
      // TODO: add/remove for multiple selections
    });
  });

  carena.addFeature("cider.ScrollBars",  function(obj, options, storage) {
    carena.require("carena.Node", arguments);
    carena.require("carena.Eventable", arguments);

    obj.event.bind("node.parent", function(name, data) {

    });

    scrollBarOptions = options.scrollbars || {};

    var safe = {
      scrollBackColor    : scrollBarOptions.background || "#24292a",
      scrollBarColor     : scrollBarOptions.scrollbar  || "#1e2122",
      scrollBarMinHeight : scrollBarOptions.minHeight  || 20,
      // TODO: make this an event that checks if theres an x or y offset
      yPadding           : false,
      xPadding           : false,
      // bottom and right padding in editor when scrollbars are visible
      ePadding           : 5
    };

    obj.width = scrollBarOptions.width || 16;

    var scrollbarX = carena.build ({
      x          : 0,
      y          : 0,
      height     : 16
    },["carena.Node","carena.Draggable","carena.RelativeToParent","carena.Box"]);

    // scrollbarX drag and scroll bounds
    scrollbarX.dragging = function(node, mouse) {
      var fw         = obj.parent.font.size.width || 7,
          viewWidth  = obj.parent.style.innerWidth,
          colOffset  = obj.parent.totalCols-Math.floor(viewWidth/fw),
          totalWidth = obj.parent.totalCols*fw,
          leftMargin = obj.parent.x+obj.parent.width-viewWidth,
          limit      = leftMargin+colOffset,
          end        = obj.parent.width+obj.parent.x-safe.scrollBarMinHeight;
          // factor of: pixels scroll bar can move to the offset width
          if (safe.xPadding == false) {
            var scrollFactorX = (totalWidth-viewWidth)/(viewWidth-scrollbarX.width-obj.width-2);
          } else {
            // have to factor in editor padding
            var leftMargin = obj.parent.x+obj.parent.width-viewWidth-obj.width-safe.ePadding,
                limit      = leftMargin+colOffset+obj.width+safe.ePadding,
                // obj.width not needed because its factored into viewWidth
                scrollFactorX = (totalWidth-viewWidth)/(viewWidth-scrollbarX.width+safe.ePadding-2);
          }
      // scrollbar position
      var scrollPosX = node.x-leftMargin;

      node.x = mouse.x + mouse.offset.x;

      if (node.x < leftMargin) {
        node.x = leftMargin;
      } else if (node.x > limit && limit < end) {
        node.x = limit;
      } else if (node.x > end) {
        node.x = end;
      }

      // sync scrollbarX with text
      obj.parent.scrollX = scrollFactorX*scrollPosX;
    }

    var scrollbarY = carena.build ({
      x          : 0,
      y          : 0,
      width      : 16
    },["carena.Node","carena.Draggable","carena.RelativeToParent","carena.Box"]);

    // scrollbarY drag and scroll bounds
    scrollbarY.dragging = function(node, mouse) {
      var lineHeight = obj.parent.font.size.lineHeight(),
          lineOffset = obj.parent.totalRows-Math.floor(obj.parent.height/lineHeight),
          end = obj.parent.y+lineOffset,
          bottom = obj.parent.height+obj.parent.y-safe.scrollBarMinHeight,
          // factor of: pixels scroll bar can move to the lineOffset
          scrollFactorY = (lineOffset*lineHeight)/(obj.parent.height-scrollbarY.height-obj.width-2),
          // scrollbar position
          scrollPosY = node.y-obj.parent.y;

      node.y = mouse.y + mouse.offset.y;

      if (node.y < obj.parent.y) {
        node.y = obj.parent.y;
      } else if (node.y > end && end < bottom) {
        node.y = end;
      } else if (node.y > bottom) {
        node.y = bottom;
      }

      // sync scrollbarY with text
      obj.parent.scrollY = scrollFactorY*scrollPosY;
    }

    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        scrollbarX.style.backgroundColor = safe.scrollBarColor;
        scrollbarX.y = obj.parent.height+obj.parent.y-scrollbarX.height-1;
        obj.add(scrollbarX);

        scrollbarY.style.backgroundColor = safe.scrollBarColor;
        scrollbarY.x = obj.parent.width+obj.parent.x-obj.width-1;
        obj.add(scrollbarY);
      }
    });

    return carena.applyProperties(obj, {
      render : function(renderer) {
        var l          = 1,
            lineHeight = obj.parent.font.size.lineHeight(),
            lineOffset = obj.parent.totalRows-Math.floor(obj.parent.height/lineHeight),
            maxLines   = Math.ceil(obj.parent.height/lineHeight),
            offsetX    = obj.parent.style.paddingLeft || 0,
            fw         = obj.parent.font.size.width || 7,
            viewWidth  = obj.parent.style.innerWidth,
            colOffset  = obj.parent.totalCols-Math.floor(viewWidth/fw),
            rightCol   = Math.floor(viewWidth/fw) + colOffset,
            maxCols    = Math.floor(viewWidth/fw),
            ctx        = renderer.context;

        ctx.save();

        // show scrollbar
        if (maxLines < (lineOffset+maxLines)) {
          // Expected that the scrollbars are a child of the editor
          ctx.fillStyle = safe.scrollBackColor;
          // subtractions are done for appearances
          ctx.fillRect(obj.parent.width+obj.parent.x-obj.width-1,
                       obj.parent.y,
                       obj.width,
                       obj.parent.height-obj.width-2);

          var tmpHeight  = scrollbarY.height;

          if (safe.xPadding == false) {
            obj.parent.style.paddingRight += scrollbarY.width+safe.ePadding;
            safe.xPadding = true;
          }
          if (scrollbarY.height > safe.scrollBarMinHeight || scrollbarY.height == 0) {
            scrollbarY.height = obj.parent.height-lineOffset-obj.width-2;
            if (tmpHeight !== scrollbarY.height) {
              scrollbarY.y = obj.parent.y+lineOffset;
              tmpHeight = scrollbarY.height;
            }
          } else {
            scrollbarY.height = safe.scrollBarMinHeight;
          }
        } else {
          // hide scrollbar
          scrollbarY.height = 0;
          if (safe.xPadding == true) {
            obj.parent.style.paddingRight -= scrollbarY.width+safe.ePadding;
            safe.xPadding = false;
          }
        }

        if (maxCols < rightCol) {
          ctx.fillStyle = safe.scrollBackColor;
          // subtractions are done for appearances
          ctx.fillRect(offsetX+obj.parent.x,
                       obj.parent.height+obj.parent.y-obj.width-1,
                       obj.parent.width-offsetX-obj.width-2,
                       obj.width);

          var tmpWidth   = scrollbarX.width;

          if (safe.yPadding == false) {
            obj.parent.style.paddingBottom += scrollbarX.height+safe.ePadding;
            safe.yPadding = true;
          }
          if (scrollbarX.width > safe.scrollBarMinHeight || scrollbarX.width == 0) {
            scrollbarX.width = obj.parent.style.innerWidth-colOffset-obj.width-2;
            if (tmpWidth !== scrollbarX.width) {
              scrollbarX.x = obj.parent.x+obj.parent.width-viewWidth+colOffset;
              tmpHeight = scrollbarX.width;
            }
          } else {
            scrollbarX.width = safe.scrollBarMinHeight;
          }
        } else {
          // hide scrollbar
          scrollbarX.width = 0;
          if (safe.yPadding == true) {
            obj.parent.style.paddingBottom -= scrollbarX.height+safe.ePadding;
            safe.yPadding = false;
          }
        }

        // adds corner square for scroll bars
        if (scrollbarX.width > 0 || scrollbarY.height > 0) {
          ctx.fillStyle = safe.scrollBarColor;
          // subtract 1 px for appearances
          ctx.fillRect(obj.parent.width+obj.parent.x-obj.width-1,
                       obj.parent.height+obj.parent.y-obj.width-1,
                       obj.width,
                       obj.width);
        }

        ctx.restore();
      }
    });
  });
}(window));
