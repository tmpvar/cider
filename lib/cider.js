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
          lines.push({ value: "", color: obj.color || "black" });
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

      set : function(c, offset) {
        offset = offset || 0;
        c      = c || "";
        // TODO: possibly expand the row/col to meet the requested row/col
        if (!lines[row]) {
          lines[row] = [];
        }

        var oldValue = lines[row][col + offset] || {
          value : "",
          color : obj.color
        };

        lines[row][col + offset] = {
          value : c,
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

          // handle the undefined case
          if (!lines[row] || !lines[row].length) {
            lines[row] = [];
          }

          lines[row].splice(col,1);
          obj.event.trigger("text.line", {
            node: obj,
            previous: oldLine,
            current: line
          });
        }
      },
      removeLine : function() {
        var oldLength = lines.length,
            oldLine   = lines.splice(row, 1);

        row--;
        if (row < 0) { row = 0; }

        obj.event.trigger("text.lines.count", {
          node: obj,
          previous: oldLength,
          current: row
        });
        return oldLine[0] || oldLine;
      },
      breakLine : function(offset) {
        if (row < 0 || row > lines.length) { return; }

        offset = offset || 0;
        var l         = lines[row].length,
            start     = col+offset,
            nextLine  = lines[row].splice(start, l);
        row++;
        lines.splice(row, 0, nextLine);

        obj.event.trigger("text.lines.count", {
          node: obj,
          previous: l,
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
      insert : function(c) {
        if (!lines[row]) {
          createUntil(row);
        }

        var oldStr = this.toString();
        lines[row].splice(col, 0, { value: c, color: obj.color});

        obj.event.trigger("text.insert", {
          node: obj,
          previous: oldStr,
          current: this.toString()
        });

      },
      append : function(c) {
        if (lines.length < row || row < 0) {
          return;
        }

        // append a string
        if (c.toString() === c) {
          var oldStr = pos.toString();

          lines[row].push({
            value : c || "",
            color : obj.color
          });

          obj.event.trigger("text.append", {
            node: obj,
            previous: oldStr,
            current: pos.toString()
          });

        } else if (c.length) {
          Array.prototype.push.apply(lines[row], c);
        } else if (c.value && c.color) {
          lines[row].push(c);
        }
      },
      get length() {
        return (lines[row]) ? lines[row].length-col : 0;
      },
      toString : function() {
        if (!lines[row]) { return ""; }

        var i = 0, l = lines[row].length, ret = "", c;
        for (i; i<l; i++) {
          c = pos.get(i);
          if (c) {
            ret += pos.get(i).value;
          }
        }
        return ret;
      },
      fromString : function(string) {
        if (string && string.length && string.length > 0) {
          var i = 0, l = string.length;
          for (i; i<l; i++) {
            pos.set(string[i], i);
          }
        } else {
          lines[row] = [];
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
            hOffset    = Math.floor(obj.scrollX/cWidth),
            maxCols    = Math.ceil(width/cWidth),
            totalRows  = obj.totalRows,
            startCol   = hOffset,
            hLimit     = (hOffset+maxCols)-1,
            r          = startCol,
            text,
            character  = "",
            textColor  = obj.color;

        for (l; l<totalRows && l<maxLines; l++) {
          // only render within parents bounds
          text = obj.pos(l, hOffset);
          for (r=startCol; r<hLimit; r++) {
            character = text.get(r-hOffset);
            if (!character || !character.color) {
              continue;
            } else if (textColor !== character.color) {
              textColor = character.color;
              ctx.fillStyle = textColor;
            }
            // TODO OPTIMIZE: calling fill ops is expensive, queue up the text
            //                and render it
            ctx.fillText(character.value,
                    obj.x + offsetX + (cWidth*(r-hOffset)),
                    (obj.y-3) + (safe.font.size*(l+1)) + offsetY - obj.scrollY);
          }
        }
        ctx.restore();
      },
      get totalCols() {
        // loop through lines and check lengths
        for (var i=0; i<safe.lines.length; i++) {
          var line = safe.lines[i];
          if (line && line.length > storage.totalCols) {
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
            l = safe.lines.length;

        for (i; i<l; i++) {
          ret.push(obj.pos(i, 0).toString());
        }
        return ret.join("\n");
      },
      fromString : function(text) {
        // reset
        safe.lines = [];

        var splitText = text.split("\n"),
            i         = 0,
            l         = splitText.length;

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
      cache   : {},
      specialDown : {
        shiftKey : false,
        ctrlKey  : false,
        altKey   : false
      },
      special : {
        16 : 'shiftKey',
        17 : 'ctrlKey',
        18 : 'altKey',
      }
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

        carenaEvent.ctrlKey  = safe.specialDown.ctrlKey;
        carenaEvent.shiftKey = safe.specialDown.shiftKey;
        carenaEvent.altKey   = safe.specialDown.altKey;
        carenaEvent.target   = obj;
        return carenaEvent;
      },
      keyDown : function(ev) {
        if (safe.special[ev.keyCode]) {
          safe.specialDown[safe.special[ev.keyCode]] = true;
        }

        if (obj.hasFocus) {
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
        if (safe.special[ev.keyCode]) {
          safe.specialDown[safe.special[ev.keyCode]] = false;
        }
        var carenaEvent = obj.carenaEvent(ev);
        if (safe.cache[carenaEvent.key]) {
          clearTimeout(safe.cache[carenaEvent.key]);
          delete safe.cache[carenaEvent.key];
          if (obj.hasFocus) {
            obj.event.trigger("keyboard.up", carenaEvent);
          }
        }
      }
    });

    var keydownHandler = function(ev) {
      // allow propagation if ctrl+r is hit TODO: change this
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

  // TextualSelection
  carena.addFeature("cider.TextualSelection", function(obj, options, storage) {
    carena.require("carena.Eventable", arguments);
    carena.require("cider.Textual", arguments);
    carena.require("carena.Renderable", arguments);

    var selecting = false, _render = obj.render, ranges = [];

    obj.event.bind("keyboard.down", function(name, data) {
      if (!data.shiftKey) {
        ranges = [];
      }
      selecting = data.shiftKey;
    });
    obj.event.bind("keyboard.up", function(name, data) {
      selecting = data.shiftKey;
    });
    obj.event.bind("mouse.down", function(name, data) {
      if (!selecting) {
        ranges = [];
      }
    });

    obj.event.bind("cursor.*", function(name, data) {
      var range, c = data.node, src, dest;
      if (selecting) {
        // continue an existing selection
        if (ranges[0]) {
          range = ranges[0];
          dest = range.dest;
          switch (name) {
            case "cursor.col":
              range.dest = {
                x: data.current,
                y: dest.y
              }
            break;

            case "cursor.row":
              range.dest = {
                x: dest.x,
                y: data.current
              }
            break;
          }
        // start new selection
        } else {
          range = obj.range(c.col, c.row, c.col, c.row);
          src = range.src;
          switch (name) {
            case "cursor.col":
              range.src = {
                x: data.previous,
                y: src.y
              }
            break;

            case "cursor.row":
              range.src = {
                x: src.x,
                y: data.previous
              }
            break;
          }
        }
      }
    });

    return carena.applyProperties(obj, {
      range : function(x1, y1, x2, y2) {
        var src = {x: x1, y: y1},
            dest = {x: x2, y: y2},
            id   = ranges.length,
            ret  = {
              get src() { return src; },
              // TODO: emit event
              set src(val) { src = val; },

              get dest() { return dest; },

              // TODO: emit event
              set dest(val) { dest = val; },

              remove : function() {
                ranges.splice(id,1);
              }
            };

        ranges.push(ret);
        return ret;
      },
      render : function(renderer) {
        //console.log("rendering selection", shift);
        _render.apply(obj, arguments);

        // Render the ranges
        var i=0, l=ranges.length, r, j, lines, first, last,
            firstText, firstTextWidth,
            lastText, lastTextWidth,
            lineY, lineX = obj.x+obj.style.paddingLeft-obj.scrollX,
            lineHeight = obj.font.size.lineHeight(),
            ctx = renderer.context;

        for (i; i<l; i++) {
          r = ranges[i];

          // find the side of the range that is closest to the top
          if (r.src.y < r.dest.y) {
            first = r.src;
            last  = r.dest;
          } else if (r.dest.y < r.src.y) {
            first = r.dest;
            last  = r.src;
          // src and dest are on the same line, figure out which is first
          } else {
            if (r.src.x < r.dest.x) {
              first = r.src;
              last  = r.dest;
            } else {
              first = r.dest;
              last  = r.src;
            }
          }

          lines = last.y-first.y;
          for (j=first.y; j<=first.y+lines; j++) {

            ctx.save();
            ctx.fillStyle = "rgba(255,0,255,0.4)";

            lineY = obj.y+obj.style.paddingTop + (j*lineHeight)-obj.scrollY;

            // handle filling an entire line
            if (lines > 0) {
              // not on the first or last line of the selection,
              // fill the entire line
              if (j > first.y) {
                // Make sure this isnt the last line
                if (last.y !== j) {
                  ctx.fillRect(lineX,
                               lineY,
                               obj.style.innerWidth,
                               lineHeight);
                // last line, only select a subset
                } else {

                  lastText   = obj.pos(last.y,0).toString()
                                                    .substring(0,last.x);

                  lastTextWidth = renderer.context.measureText(lastText).width;
                  ctx.fillRect(lineX, lineY, lastTextWidth, lineHeight);
                }
              // First line, render from beginning of selection to the end of the line
              } else {

                firstText   = obj.pos(first.y,0).toString()
                                                  .substring(0,first.x);

                firstTextWidth = ctx.measureText(firstText).width;

                ctx.fillRect(lineX+firstTextWidth,
                             lineY,
                             obj.style.innerWidth-firstTextWidth,
                             lineHeight);

              }
            } else {

              firstText   = obj.pos(first.y,0).toString()
                                                .substring(0,first.x);

              lastText   = obj.pos(first.y,first.x).toString()
                                                .substring(0,last.x-first.x);

              firstTextWidth = renderer.context.measureText(firstText).width;
              lastTextWidth = renderer.context.measureText(lastText).width;

              ctx.fillRect(lineX+firstTextWidth,
                           lineY,
                           lastTextWidth,
                           lineHeight);
            }

            renderer.context.restore();
          }


        }
      }

    });
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

      if (data.character && !data.ctrlKey) {
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

          default:
            // allow the browser to have unmapped control functions
            return true;
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
              obj.parent.pos(obj.row,obj.col).breakLine();
              obj.col = 0;
              obj.row++;
            }
          break;

          case 8: // backspace
            // first char in a line
            if (obj.col === 0) {
              if (obj.row <= 0) {
                break;
              }
              // store the current line
              var line = obj.parent.pos(obj.row,0).removeLine();

              // append the line to to the previous line
              obj.row--;
              obj.col = obj.parent.pos(obj.row,0).length;
              obj.parent.pos(obj.row,0).append(line);

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
            if (obj.col >= eol) {
              // ensure this is not EOF
              if (obj.row >= obj.parent.length-1) {
                return;
              }
              var nextLine = obj.parent.pos(obj.row+1,0).removeLine();
              obj.parent.pos(obj.row,0).append(nextLine);
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
            if (obj.col >= obj.parent.pos(obj.row, 0).length) {
              if (obj.row < obj.parent.length) {
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
            scrollY = obj.parent.scrollY,
            maxRows = obj.parent.height/obj.parent.font.size.lineHeight(),
            offsetY = obj.parent.scrollY/obj.parent.font.size.lineHeight(),
            tempHeight = 0;

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

        // selecting partial last line scrolls it into view
        if (Math.floor(maxRows) == obj.row-offsetY) {
          tempHeight += obj.parent.font.size.lineHeight();
        }

        // set col to text end if mouse pick is beyond text end
        if (obj.col > obj.parent.pos(obj.row, 0).length) {
          obj.col = obj.parent.pos( obj.row, 0).length;
        }

        // forcefully set the scrollX/Y to avoid jumping around
        obj.parent.scrollX = scrollX;
        obj.parent.scrollY = scrollY + tempHeight;
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
        if (obj.hasFocus || obj.parent.hasFocus) {
          var height   = obj.parent.style.innerHeight || obj.parent.height,
              visLines = Math.ceil((height+obj.parent.scrollY)/charHeight)-2;

          var posx   = obj.parent.x -
                       obj.parent.scrollX +
                       (obj.parent.style.paddingLeft || 0),

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

          // don't show the cursor when its out of the parents viewable area
          if (!obj.parent.containsPoint(posx, posy) ||
              !obj.parent.containsPoint(posx, posy + height))
          {
            return;
          }

          ctx.save();
          ctx.fillStyle = obj.color || "white";
          ctx.fillRect(posx,posy,1,height);
          ctx.restore();
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
    var lineNumberOptions = options.linenumbers || {},
    safe = {
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

  carena.addFeature("cider.ScrollBars",  function(obj, options, storage) {
    carena.require("carena.Node", arguments);
    carena.require("carena.Eventable", arguments);

    obj.event.bind("node.parent", function(name, data) {

    });

    var scrollBarOptions = options.scrollbars || {},
        safe             = {
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
          end        = obj.parent.width+obj.parent.x-safe.scrollBarMinHeight-obj.width-2;
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
          bottom = obj.parent.height+obj.parent.y-safe.scrollBarMinHeight-obj.width-2,
          // this method will work once we are able to scroll partial line heights
          // factor of: pixels scroll bar can move to the lineOffset
          // scrollFactorY = Math.floor((lineOffset*lineHeight)/(obj.parent.height-scrollbarY.height-obj.width-2)),
          scrollFactorY = Math.ceil((lineOffset*lineHeight)/(obj.parent.height-scrollbarY.height-obj.width-2)),
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
      // using lineHeight instead of scrollFactorY until we are able to scroll
      // partial lineHeights ie: smooth scrolling isntead of line based scrolling
      // sync scrollbarY with text
      scrollFactorY = Math.ceil(scrollFactorY/lineHeight)*lineHeight;
      if (scrollFactorY*scrollPosY > lineOffset*lineHeight) {
        obj.parent.scrollY = lineOffset*lineHeight;
      } else {
        obj.parent.scrollY = Math.ceil(scrollFactorY*scrollPosY);
      }
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
            }
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

          var tmpWidth = scrollbarX.width;

          if (safe.yPadding == false) {
            obj.parent.style.paddingBottom += scrollbarX.height+safe.ePadding;
            safe.yPadding = true;
          }
          if (scrollbarX.width > safe.scrollBarMinHeight || scrollbarX.width == 0) {
            scrollbarX.width = obj.parent.style.innerWidth-colOffset-obj.width-2;
            if (tmpWidth !== scrollbarX.width) {
              scrollbarX.x = obj.parent.x+obj.parent.width-viewWidth+colOffset;
            }
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


  /**

  TEMPORARY

  **/

  cider.highlight = function(instance) {
    var keywords = ['function', 'var','if', 'return', 'throw'],
        i        = 0,
        l        = keywords.length;

  };




}(window));
