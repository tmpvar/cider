/*
 * Cider - Canvas Text Editor
 *   Licensed under the MIT (LICENSE.txt)
 */
"use strict";
(function(exports) {
  var cider = exports.cider = {

  };

  // Core constructs
  // Shared line manipulation method
  var buildPosManip = function(obj, lines, row, col) {
    // create missing rows
    var createUntil = function(row) {
      var i = lines.length;
      for (i;i<=row;i++) {
        if (!lines[i]) {
          lines[i] = [];
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
        obj.dirty = true;
      },
      remove : function() {
        if (row<0) {
          row = 0;
        }

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
          obj.dirty = true;
        }
      },
      removeLine : function() {
        var oldLength = lines.length,
            oldLine   = lines.splice(row, 1);

        row--;
        if (row < 0) { row = 0; }

        obj.event.trigger("text.lines", {
          node: obj,
          previous: oldLength,
          current: row
        });
        obj.dirty = true;
        return oldLine[0] || oldLine;
      },
      breakLine : function(offset) {
        if (row < 0 || row > lines.length) { return; }

        if (!lines[row]) {
          createUntil(row);
        }

        offset = offset || 0;
        var l         = lines[row].length,
            start     = col+offset,
            nextLine  = lines[row].splice(start, l);
        row++;
        lines.splice(row, 0, nextLine);

        obj.event.trigger("text.lines", {
          node: obj,
          previous: l,
          current: row
        });
        obj.dirty = true;
      },
      insertLine : function(string) {
        lines.splice(row, 0, []);
        var oldLength = row;
        row++;
        obj.pos(row,0).fromString(string);
        obj.event.trigger("text.lines", {
          node: obj,
          previous: oldLength,
          current: row
        });
        obj.dirty = true;
      },
      insert : function(c) {
        if (!lines[row]) {
          createUntil(row);
        }

        lines[row].splice(col, 0, { value: c, color: obj.color});
        obj.dirty = true;
        obj.event.trigger("text.insert", {
          node: obj,
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
        obj.dirty = true;
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
        obj.dirty = true;
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
    carena.require("carena.Renderable", arguments);

    // TODO: possibly move this to a "multiline" feature (optimization)
    carena.require("carena.Backbuffer", arguments);

    storage.text = storage.text || obj.text || options.text ||  "";

    if (storage.text) {
      options.lines = storage.text.replace("\r", "").split("\n");
    }
    storage.scrollY = 0;
    storage.scrollX = 0;
    storage.totalCols = 0;
    storage.totalRows = 0;

    obj.style.color       = obj.style.color || "white";

    var canvas = carena.createCanvas();

    canvas.width = 100;
    canvas.height = 200;
    var safe   = {
          font : options.font || {
            family: "Courier New",
            size: 16
          },
          lines  : [],
          ctx : canvas.getContext("2d"),
          bounds : {}
        };

    carena.applyProperties(obj, {
      localBounds : function() {
      obj.dirty = true;
        var width  = obj.style.innerWidth + (obj.font.size.width*2),
            height = obj.style.innerHeight + (obj.font.size.lineHeight()*2);

        if (width < obj.width) { width = obj.width; }
        if (height < obj.height) { height = obj.height; }

        return {
          x       : obj.x,
          y       : obj.y,
          width   : width,
          height  : height,
          x2      : obj.x + width,
          y2      : obj.y + height
        };
      },
      get totalCols() {
        // TODO PERFORMANCE: only run this calc once (it is VERY SLOW).
        //if (!storage.totalCols) {
          storage.totalCols = 0;
          // loop through lines and check lengths
          for (var i=0; i<safe.lines.length; i++) {
            var line = safe.lines[i];
            if (line && line.length > storage.totalCols) {
              storage.totalCols = line.length;
            }
          }
        //}
        return storage.totalCols;
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
          },
          width : 0
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
        obj.dirty = true;
      },
      dehydrate : function() {
        storage.text = obj.toString();
        return storage;
      },
      append : function(str) {
        obj.fromString(obj.toString() + str);
      },
      prepend : function(str) {
        obj.fromString(str + obj.toString());
      },
      renderBackbuffer : function(renderer, ctx) {

        var w = obj.width,
            h = obj.height,
            x = (obj.scrollX%obj.font.size.width) || 0,
            y = (obj.scrollY%obj.font.size.lineHeight()) || 0,
            data;

          try {
            data = ctx.getImageData(x,y,w,h);
            renderer.context.putImageData(data, x+obj.x, y+obj.y);
          } catch (e) {
            console.log(e);
          }

      }

    });


    obj.renderSteps.push(function(renderer, options) {
      renderer.clear();
      obj.clean();

      var ctx        = renderer.context,
          offsetX    = (obj.style.paddingLeft || 0) - obj.scrollX,
          offsetY    = (obj.style.paddingTop || 0)-obj.scrollY,
          lh         = obj.font.size.lineHeight(),
          l          = Math.floor(obj.scrollY/lh),
          height     = obj.style.innerHeight || obj.height,
          width      = obj.style.innerWidth  || obj.width,
          maxLines   = Math.floor(height/lh) + l + 1,
          cWidth = obj.font.size.width,
          hOffset    = Math.floor(obj.scrollX/cWidth),
          maxCols    = Math.ceil(width/cWidth),
          totalRows  = obj.totalRows,
          startCol   = hOffset,
          hLimit     = (hOffset+maxCols)-1,
          r          = startCol,
          character  = "",
          textColor  = obj.color,
          text,
          bounds     = obj.bounds;

      if (l<0) {
        l = 0;
      }

      ctx.font = safe.font.size + "px " + safe.font.family;
      ctx.fillStyle = obj.style.backgroundColor;
      ctx.fillRect(0, 0, obj.width, obj.height);
      ctx.fillStyle = obj.color;

      var measured = ctx.measureText("M").width

      if (measured !== obj.font.size.width) {
        obj.font.size.width = measured;
        obj.dirty = true;
        bounds  = obj.bounds;
      }

      cWidth = obj.font.size.width;

      for (l; l<maxLines && l<obj.length; l++) {
        // only render within parents bounds
        text = obj.pos(l, 0);
        for (r=hOffset; r<hLimit; r++) {
          character = text.get(r);
          if (!character || !character.color) {
            continue;
          } else if (textColor !== character.color) {
            textColor = character.color;
            ctx.fillStyle = textColor;
          }
          // TODO OPTIMIZE: calling fill ops is expensive, queue up the text
          //                and render it
          ctx.fillText(character.value,
                        obj.x + offsetX + cWidth*r,
                        (obj.y-3) + (safe.font.size*(l+1)) + offsetY);
        }
      }
    });

    // Setup Text if any
    obj.fromString(storage.text);
    return obj;
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
      repeat  : {},
      modifierState : {
        shift   : false,
        control : false,
        alt     : false,
        meta    : false
      },
      modifiers : {
        16 : 'shift',
        17 : 'control',
        18 : 'alt',
        91 : 'meta'
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
      createUserEvent : function(ev) {
        var ev = {
              key: ev.keyCode,
              character: obj.keyCodeToChar(ev)
            };

        ev.modifier = safe.modifierState;
        ev.target   = obj;
        return ev;
      },
      keyDown : function(ev) {

        if (safe.modifiers[ev.keyCode]) {
          safe.modifierState[safe.modifiers[ev.keyCode]] = true;
        }

        if (obj.hasFocus) {
          var createUserEvent = obj.createUserEvent(ev);
          // is this key already being pressed?
          if (safe.repeat) {
            clearTimeout(safe.repeat);
            safe.repeat = false;
          }

          // TODO: this should move elsewhere.
          // Because every os has a different way of handling key repeats,
          // and we want to make sure we dont get double binds and such..
          safe.repeat = setTimeout(function() {
            if (safe.repeat) {
              safe.repeat = setTimeout(function quick() {
                obj.event.trigger("keyboard.repeat", createUserEvent);
                if (safe.repeat) {
                  safe.repeat = setTimeout(quick, 10);
                }
              }, 10); // emit a repeat
            }
          }, 500); // wait to repeat
          if (obj.event.trigger("keyboard.down", createUserEvent) === false) {
            return false;
          }
        }
      },
      keyUp : function(ev) {
        if (safe.modifiers[ev.keyCode]) {
          safe.modifierState[safe.modifiers[ev.keyCode]] = false;
        }
        var createUserEvent = obj.createUserEvent(ev);
        if (safe.repeat) {
          clearTimeout(safe.repeat);
          safe.repeat = false;
          if (obj.hasFocus) {
            obj.event.trigger("keyboard.up", createUserEvent);
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

    var onBlur = function(ev) {
      if (ev        &&
          ev.target &&
          (ev.target.carenaEnabled || ev.target === window))
      {
        for (var i in safe.cache) {
          clearTimeout(safe.cache[i]);
        }
      }
      obj.event.trigger("node.blur", {
        node: obj
      })
    };

    // Cancel repeats when the canvas loses focus
    window.addEventListener("blur", onBlur, true);
    window.addEventListener('keydown', keydownHandler, true);
    window.addEventListener('keyup', obj.keyUp, true);

    obj.keyboardLayout = options.keyboardLayout || safe.layouts.qwerty;
    return obj;
  });

  // Editable
  carena.addFeature("cider.Editable",  function(obj, options, storage) {
    carena.require("cider.Textual",arguments);
    carena.require("carena.Node", arguments);
    carena.require("cider.Keyboard", arguments);

    var safe = {
      cursor : options.cursor || carena.build({
        textual: obj,
        style  : {
          color : obj.style.color || "white"
        }
      }, [
        "carena.Node",
        "carena.Eventable",
        "carena.RelativeToParent",
        "cider.Cursor"
      ])
    };

    carena.applyProperties(obj, {
      get editable() { return true; },
      get cursor() {
        return safe.cursor;
      }
    });

    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        // Add a cursor
        obj.add(safe.cursor);
      }
    })

    // Track the cursor movements
    obj.cursor.event.bind('cursor.row', function(name, data) {
      var fh      = obj.font.size.lineHeight(),
          topRow  = Math.floor(obj.scrollY/fh),
          height  = obj.style.innerHeight || obj.height,
          botRow  = Math.floor(obj.style.innerHeight/fh) + topRow,
          current = data.current,
          curY    = current*fh - obj.scrollY ,
          deltaY  = 0;

      if (data.current > data.previous) {
        deltaY = curY - obj.height;
        if (deltaY > -fh) {
          obj.scrollY += deltaY+fh;
        }
      } else if (data.current < data.previous) {
        if (curY < 0) {
          obj.scrollY += curY;
        }
      }
    });

    obj.cursor.event.bind('cursor.col', function(name, data) {

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
    carena.require("carena.Box", arguments);

    var selecting = false,
        shiftKey  = false,
        ranges    = [];

    obj.event.bind("mouse.down", function() {
      if (!shiftKey) {
        obj.clearSelections();
      }
    });

    obj.event.bind("node.blur", function() {
      selecting = false;
    });

    carena.require("carena.Draggable", arguments);
    obj.event.bind("keyboard.down", function onSelectionKeydown(name, data) {
      if (!data.modifier.shift && !data.modifier.control && !data.modifier.meta) {
        obj.clearSelections();
      }
      selecting = shiftKey = (data.modifier.shift && !data.character);
      if (selecting) {
        // TODO: run the appropriate methods
      }
    });

    obj.event.bind("keyboard.up", function(name, data) {
      selecting = shiftKey = data.modifier.shift;
    }, true);
    obj.event.bind("mouse.up", function(name, data) {
      if (!shiftKey && !selecting) {
        obj.clearSelections();
      }
    });

    obj.dragstart = function(node, mouse) {
      if (!shiftKey) {
        obj.clearSelections();
      }

      selecting = true;
      obj.cursor.dirty = true;
      obj.cursor.row = Math.floor(((mouse.y-obj.y) + obj.scrollY - obj.style.paddingTop)  / obj.font.size.lineHeight());
      obj.cursor.col = Math.floor(((mouse.x-obj.x) + obj.scrollX - obj.style.paddingLeft) / obj.font.size.width);
      obj.cursor.queueShow();
      return obj;
    };

    obj.dragging = function(node, mouse) {
      obj.cursor.dirty = true;
      obj.cursor.row = Math.floor(((mouse.y-obj.y- obj.style.paddingTop) + obj.scrollY )  / obj.font.size.lineHeight());
      obj.cursor.col = Math.floor(((mouse.x-obj.x- obj.style.paddingLeft) + obj.scrollX ) / obj.font.size.width);
      obj.cursor.queueShow();
    };

    obj.dragend = function() {
      obj.cursor.dirty = true;
      //selecting = false;
    };

    obj.cursor.event.bind("cursor.*", function(name, data) {
      var range, c = data.node, src, dest, changed = false,
          changeEventData = {
            previous: null,
            current : null,
            node    : obj
          };

      if (selecting) {
        // continue an existing selection
        if (ranges[0]) {
          range = ranges[0];
          // TODO: manual clone? really?
          changeEventData.previous = {
            src : {
              x : range.src.x,
              y : range.src.y
            },
            dest : {
              x : range.dest.x,
              y : range.dest.y
            }
          };


          dest = range.dest;
          switch (name) {
            case "cursor.col":
              range.dest = {
                x: data.current,
                y: dest.y
              };
              changed = true
            break;

            case "cursor.row":
              range.dest = {
                x: dest.x,
                y: data.current
              };
              changed = true;
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
              };
              changed = true
            break;

            case "cursor.row":
              range.src = {
                x: src.x,
                y: data.previous
              };
              changed = true;
            break;
          }
        }

        if (changed) {
          changeEventData.current = {
            src : {
              x : range.src.x,
              y : range.src.y
            },
            dest : {
              x : range.dest.x,
              y : range.dest.y
            }
          };
          obj.event.trigger("selection.change", changeEventData);
        }
      }
    });

    carena.applyProperties(obj, {
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
      get ranges() {
        return ranges;
      },
      clearSelections : function() {
        obj.event.trigger("selection.change", {
          previous: ranges[0],
          current : null,
          node    : obj
        });
        ranges = [];
        selecting = false;
        obj.dirty = true;
      }
    });

    obj.renderSteps.push(function(renderer) {
      obj.clean();

      // Render the ranges
      var i=0, l=ranges.length, r, j, lines, first, last,
          firstText, firstTextWidth,
          lastText, lastTextWidth,
          lineY, lineX = obj.x+obj.style.paddingLeft,
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
          ctx.fillStyle = obj.style.selectionColor || "rgba(255,0,255,0.4)";

          lineY = (obj.y+obj.style.paddingTop + (j*lineHeight)) - obj.scrollY;

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
    });

    return obj;
  });

  // Cursor
  carena.addFeature("cider.Cursor",  function(obj, options, storage) {
    carena.require("carena.Eventable", arguments);
    carena.require("carena.Box", arguments);

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

      var passControl = false;
      charHeight = obj.textual.font.size.lineHeight();
      currentOperation = obj.show;
      clearTimeout(safe.timer);
      safe.timer = setTimeout(obj.cycleRenderOperation, showDuration);

      if (data.character && !data.modifier.control && !data.modifier.meta) {
        obj.textual.pos(obj.row, obj.col).insert(data.character);
        obj.col+=data.character.length;
      } else if (data.modifier.control) {
        switch (data.key) {
          case 36: // ctrl+home
            obj.row = 0;
            obj.col = 0;
          break;

          case 35: // ctrl+end
            obj.row = obj.textual.length-1;
            // set end of line
            obj.col = obj.textual.pos(obj.row,0).length;
          break;

          default:
            // allow the browser to have unmapped control functions
            passControl = true;
          break;
        }
      }

      switch (data.key)
      {
        case 13: // return
          if (obj.col > obj.textual.pos(obj.row,0).length) {
            obj.row++;
            obj.col=0;
          } else {
            obj.textual.pos(obj.row,obj.col).breakLine();
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
            var line = obj.textual.pos(obj.row,0).removeLine();

            // append the line to to the previous line
            obj.row--;
            obj.col = obj.textual.pos(obj.row,0).length;
            obj.textual.pos(obj.row,0).append(line);

          // anywhere else in the line
          } else {
            obj.col--;
            obj.textual.pos(obj.row,obj.col).remove();
          }
        break;

        case 46: // delete
          // set end of line
          var eol = obj.textual.pos(obj.row,0).length;

          // check if were at the end of the line
          if (obj.col >= eol) {
            // ensure this is not EOF
            if (obj.row >= obj.textual.length-1) {
              return;
            }
            var nextLine = obj.textual.pos(obj.row+1,0).removeLine();
            obj.textual.pos(obj.row,0).append(nextLine);
          } else {
            // remove character
            obj.textual.pos(obj.row,obj.col).remove();
          }
        break;

        case 9: // tab
          if (!data.shiftKey) {
            for (l=0; l<options.tabSize; l++) {
              obj.textual.pos(obj.row, obj.col).insert(options.tabChar);
              obj.col++;
            }
          } else {
            for (l=0; l<options.tabSize; l++) {
              if (obj.textual.pos(obj.row, 0).get() === options.tabChar) {
                obj.textual.pos(obj.row, 0).remove();
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
          if (obj.col > obj.textual.pos(obj.row,0).length) {
            obj.col = obj.textual.pos(obj.row,0).length;
          }
        break;

        case 40: // down
          if (obj.row < obj.textual.length-1) {
            obj.row++;
          }

          // position the cursor correctly on the col
          if (obj.col > obj.textual.pos(obj.row,0).length) {
            obj.col = obj.textual.pos(obj.row,0).length;
          }
        break;

        case 37: // left
          // start of line
          if (obj.row > 0 && obj.col === 0) {
            obj.row--;
            obj.col=obj.textual.pos(obj.row, 0).length;
          } else if (obj.col > 0){
            obj.col--;
          }
        break;

        case 39: // right
          // end of line
          if (obj.col >= obj.textual.pos(obj.row, 0).length) {
            if (obj.row < obj.textual.length-1) {
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
          var eol = obj.textual.pos(obj.row,0).length;
          obj.col = eol;
        break;

        // the event wasnt caught, then send it on its way
        default:
          passControl = true;
        break;
      }

      return passControl;
    }

    function clickHandler(name, data) {
      if (data.target === obj.textual) {
        currentOperation = obj.show;
        clearTimeout(safe.timer);
        safe.timer = setTimeout(obj.cycleRenderOperation, showDuration);
        var scrollX = obj.textual.scrollX,
            scrollY = obj.textual.scrollY,
            maxRows = obj.textual.height/obj.textual.font.size.lineHeight(),
            offsetY = obj.textual.scrollY/obj.textual.font.size.lineHeight(),
            tempHeight = 0;

        obj.col = Math.floor((data.mouse.x -
                              (obj.textual.x + obj.textual.style.paddingLeft - scrollX)
                             ) / obj.textual.font.size.width);

        obj.row = Math.floor((data.mouse.y -
                              (obj.textual.y + obj.textual.style.paddingTop - scrollY)
                             ) / obj.textual.font.size.lineHeight());

        // selecting empty rows puts pos at the end of last line
        if (obj.row >= obj.textual.length) {
          obj.row = obj.textual.length - 1;
          obj.col = obj.textual.pos(obj.row, 0).length;
        }

        // selecting partial last line scrolls it into view
        if (Math.floor(maxRows) == obj.row-offsetY) {
          tempHeight += obj.textual.font.size.lineHeight();
        }

        // set col to text end if mouse pick is beyond text end
        if (obj.col > obj.textual.pos(obj.row, 0).length) {
          obj.col = obj.textual.pos( obj.row, 0).length;
        }

        // forcefully set the scrollX/Y to avoid jumping around
        obj.textual.scrollX = scrollX;
        obj.textual.scrollY = scrollY + tempHeight;
      }
    }

    // always put the default as the last step
    obj.textual.event.bind("keyboard.down", onKeyDown, true);
    obj.textual.event.bind("keyboard.repeat", onKeyDown);
    obj.textual.event.bind("mouse.down", clickHandler);

    carena.applyProperties(obj, {
      show : function (renderer) {
        if (obj.textual.hasFocus) {
          var p        = obj.textual,
              height   = p.style.innerHeight || p.height,
              visLines = Math.ceil((height)/charHeight)-2,

              posy     = obj.textual.y -
                         obj.textual.scrollY +
                         (p.style.paddingTop || 0) +
                         obj.row * p.font.size.lineHeight()-1,

              posx     = (p.x+p.style.paddingLeft -
                          obj.textual.scrollX +
                         (obj.col*p.font.size.width)),
              text     = p.pos(obj.row,0).toString()
                                         .substring(0,obj.col),
              ctx      = renderer.context,
              height   = p.font.size.lineHeight();

          ctx.save();
          ctx.fillStyle = obj.style.color || "white";
          ctx.fillRect(posx-2, posy-1, 1, height);
          ctx.restore();
        }
      },
      get col() { return pos.col; },
      set col(value) {
        // lock the cusor's col to reasonable bounds
        if (value >= obj.textual.pos(obj.row, 0).length) {
          value = obj.textual.pos(obj.row, 0).length;
        } else if (value <= 0) {
          value = 0;
        }

        // only fire the event if the value changed
        var oldValue = pos.col;
        if (oldValue !== value) {
          pos.col = value;
          obj.event.trigger('cursor.col',{
            node : obj,
            previous : oldValue,
            current  : value
          });
        }
      },
      get row() { return pos.row },
      set row(value) {
        // lock the cursor's row to reasonable bounds
        if (value >= obj.textual.length && value > 0) {
          value = obj.textual.length-1;
        } else if (value < 0) {
          value = 0;
        }

        // only fire the event if the value changed
        var oldValue = pos.row;
        if (value !== oldValue) {
          pos.row = value;
          obj.event.trigger('cursor.row', {
            node: obj,
            previous: oldValue,
            current : value
          });
        }
      },
      hide : function() {
        // fade out or something
      },
      queueShow : function() {
        clearTimeout(safe.timer);
        safe.timer = setTimeout(obj.cycleRenderOperation, showDuration);
        currentOperation = obj.show;
      },
      cycleRenderOperation : function() {
        obj.dirty = true;
        if (currentOperation === obj.hide) {
          currentOperation = obj.show;
          safe.timer = setTimeout(obj.cycleRenderOperation, showDuration);
        } else {
          currentOperation = obj.hide;
          safe.timer = setTimeout(obj.cycleRenderOperation, hideDuration);
        }
      }
    });

    obj.renderSteps.push(function(renderer) {
      obj.clean();
      currentOperation(renderer);
    });

    // Setup cursor timer
    obj.cycleRenderOperation();

    return obj;
  });

  carena.addFeature("cider.LineNumbers",  function(obj, options, storage) {
    carena.require("carena.Node", arguments);
    carena.require("carena.Box", arguments);
    carena.require("carena.Eventable", arguments);

    // TODO: add the ability to detect a scroll event
    var lineNumberOptions = options.linenumbers || {},
    safe = {
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

    obj.renderSteps.push(function(renderer) {
      obj.clean();
      var l          = 1,
          lineHeight = obj.parent.font.size.lineHeight(),
          lineOffset = (obj.parent.scrollY > 0)                   ?
                        Math.floor(obj.parent.scrollY/lineHeight) :
                        0,

          maxLines   = Math.ceil(obj.parent.height/lineHeight),
          ctx        = renderer.context,
          // font width TODO: calc font width automatically
          fw         = 7;

      if (maxLines+lineOffset > obj.parent.length) {
        maxLines = obj.parent.length;
      } else {
        maxLines += lineOffset;
      }
      // always show atleast one line
      if (maxLines === 0) {
        maxLines = 1;
      }

      ctx.save();
      // Expected that the line numbers are a child of the editor
      ctx.font = obj.parent.font.get();
      ctx.fillStyle = obj.style.backgroundColor;
      ctx.fillRect(obj.parent.x,
                   obj.parent.y,
                   obj.width,
                   obj.parent.bounds.height);
      ctx.fillStyle = obj.style.color || "#bbbbbb";
      ctx.textAlign = safe.textAlign;
      for (l=lineOffset; l<=maxLines; l++) {
       ctx.fillText(l,
                    obj.parent.x + (obj.width-5),
                    (lineHeight)*(l-lineOffset)-obj.parent.scrollY%lineHeight);

        var lineNumWidth = l + "";

        if (obj.width < lineNumWidth.length*fw+fw) {
          obj.width = obj.width+fw;
          obj.parent.style.paddingLeft += fw;
        }
      };
      ctx.restore();
    });

    return obj;
  });

  carena.addFeature("cider.ScrollBars",  function(obj, options, storage) {
    carena.require("carena.Node", arguments);
    carena.require("carena.Eventable", arguments);

    var scrollBarOptions = options.scrollbars || {},
        barWidth = scrollBarOptions.width || 16,
        gutterX = carena.build ({
          x          : obj.target.x,
          y          : obj.target.y+obj.target.height-barWidth,
          height     : barWidth,
          width      : obj.target.width,
          style      : {
            backgroundColor : "#24292a"
          }
        },["carena.Node","carena.RelativeToParent","carena.Box"]),
        handleX = carena.build ({
          x          : obj.target.x,
          y          : obj.target.y+obj.target.height-barWidth,
          height     : barWidth,
          width      : obj.target.width,
          style      : {
            backgroundColor : "#1e2122"
          }
        },["carena.Node","carena.Draggable","carena.RelativeToParent","carena.Box"]),
        gutterY = carena.build ({
          x          : obj.target.x+obj.target.width-barWidth,
          y          : obj.target.y,
          height     : obj.target.height,
          width      : barWidth,
          style      : {
            backgroundColor : "#24292a"
          }
        },["carena.Node","carena.RelativeToParent","carena.Box"]),
        handleY = carena.build ({
          x          : obj.target.x+obj.target.width-barWidth,
          y          : obj.target.y,
          height     : obj.target.height,
          width      : barWidth,
          style      : {
            backgroundColor : "#1e2122"
          }
        },["carena.Node","carena.Draggable","carena.RelativeToParent","carena.Box"]),
        corner = carena.build ({
          x          : obj.target.x+obj.target.width-barWidth,
          y          : obj.target.y+obj.target.height-barWidth,
          height     : 0,
          width      : 0,
          style      : {
            backgroundColor : "#1e2122"
          }
        },["carena.Node","carena.RelativeToParent","carena.Box"]);

    // handleY drag and scroll bounds
    handleY.dragging = function(node, mouse) {
      var top           = obj.target.y,
          bottom        = top+obj.target.height-handleY.height,
          lineHeight    = obj.target.font.size.lineHeight(),
          rowOffset     = obj.target.totalRows-Math.floor(obj.target.height/lineHeight),
          scrollFactorY = rowOffset*lineHeight/(obj.target.height-handleY.height),
          scrollPosY    = node.y-obj.target.y;
          // factor in corner dimensions
          if (gutterX.parent) {
            scrollFactorY = rowOffset*lineHeight/(obj.target.height-handleY.height-barWidth);
          }

      node.y = mouse.y + mouse.offset.y;

      if (node.y < top) {
        node.y = top;
      } else if (node.y > bottom) {
        node.y = bottom;
      }

      obj.target.scrollY = scrollFactorY*scrollPosY;
    };

    // handleX drag and scroll bounds
    handleX.dragging = function(node, mouse) {
      var left          = obj.target.x,
          right         = left+obj.target.width-handleX.width,
          fw            = obj.target.font.size.width || 7,
          viewWidth     = obj.target.style.innerWidth+obj.target.style.paddingLeft,
          colOffset     = obj.target.totalCols-Math.floor(viewWidth/fw),
          totalWidth    = obj.target.totalCols*fw,
          leftMargin    = obj.target.x+obj.target.width-viewWidth,
          scrollFactorX = (totalWidth-viewWidth)/(viewWidth-handleX.width),
          scrollPosX    = node.x-leftMargin;
          // factor in corner dimensions
          if (gutterY.parent) {
            scrollFactorX = (totalWidth-viewWidth)/(viewWidth-handleX.width-barWidth);
          }

      node.x = mouse.x + mouse.offset.x;

      if (node.x < left) {
        node.x = left;
      } else if (node.x > right) {
        node.x = right;
      }
      obj.target.scrollX = scrollFactorX*scrollPosX;
    };

    obj.target.event.bind("text.*", function(name, data) {
      var lineHeight = obj.target.font.size.lineHeight(),
          rowOffset  = obj.target.totalRows-Math.floor(obj.target.height/lineHeight),
          fw         = obj.target.font.size.width || 7,
          viewWidth  = obj.target.style.innerWidth,
          colOffset  = obj.target.totalCols-Math.floor(viewWidth/fw);

      // add/remove vertical scrollbar
      if (rowOffset > 0) {
        gutterY.add(handleY);
        obj.displayTarget.add(gutterY);
      } else if (rowOffset <= 0 && gutterY.parent) {
        obj.displayTarget.remove(gutterY);
      }
      // add/remove horizontal scrollbar
      if (colOffset > 0) {
        gutterX.add(handleX);
        obj.displayTarget.add(gutterX);
      } else if (colOffset == 0 && gutterX.parent) {
        obj.displayTarget.remove(gutterX);
      }
      // add/remove corner
      if (gutterY.parent && gutterX.parent) {
        obj.displayTarget.add(corner);
        corner.width  = barWidth;
        corner.height = barWidth;
      } else if (corner.parent) {
        obj.displayTarget.remove(corner);
      }

      handleX.width  = obj.target.style.innerWidth-colOffset-corner.width;
      handleX.x      = obj.target.x+colOffset;
      handleY.height = obj.target.style.innerHeight-rowOffset-corner.height;
      handleY.y      = obj.target.y+rowOffset;
    });
  });

  carena.addFeature("cider.Clipboard", function(obj, options, storage) {
    var selection = null;
    carena.applyProperties(obj, {
      onSelectionChange : function(name, event) {
        selection = event;
      }
    });

    obj.event.bind("node.parent", function(name, data) {
      if (data.node === obj) {
        if (data.previous) {
          data.previous.event.unbind("selection.change", obj.onSelectionChange);
        }
        data.current.event.bind("selection.change", obj.onSelectionChange);
      }
    });

    // TODO: this will not always be a document
    var hack   = document.createElement("textarea");
    document.body.appendChild(hack);
    hack.style.position    = 'absolute';
    hack.style.top         = '-1000px';
    hack.style.zIndex      = 999;
    hack.style.borderWidth = 0;
    hack.style.height = 0;
    hack.style.width = 0;


    obj.event.bind("keyboard.down", function(name, data) {
      if ((data.modifier.control || data.modifier.meta) && data.character) {
        var active = document.activeElement,
            text   = "",
            r = (selection) ? selection.current : null,
            i, l, lines = [], first, last;

        hack.value = "";

        switch (data.character)
        {
          case 'c': // Copy
            if (!selection || !selection.current) {
              return;
            }

            // find the side of the range that is closest to the top
            if (r.src.y !== r.dest.y) {
              if (r.dest.y > r.src.y) {
                first = r.src;
                last  = r.dest;
              } else if (r.dest.y < r.src.y) {
                first = r.dest;
                last  = r.src;
              }

              for (i = first.y; i<=last.y; i++) {
                // get full lines
                if (i === first.y) {
                  lines.push(obj.pos(i,first.x).toString());
                } else if (i === last.y) {
                  lines.push(obj.pos(i,0).toString().substring(0, last.x));
                } else {
                  lines.push(obj.pos(i,0).toString());
                }
              }
              text = lines.join("\n");
            // src and dest are on the same line, figure out which is first
            } else {
              if (r.src.x < r.dest.x) {
                text = obj.pos(r.src.y,r.src.x).toString();
                text = text.substring(0,r.dest.x - r.src.x);
              } else {
                text = obj.pos(r.dest.y,r.dest.x).toString();
                text = text.substring(0,r.src.x - r.dest.x);
              }
            }

            hack.value = text;
            hack.focus();
            hack.select();
            hack.addEventListener("change", function tempCopyHandler() {
              if (hack.parentNode) {
                active.focus();
                hack.removeEventListener("change", tempCopyHandler, true);
              }
            }, true);

            // Remove the selection
            selection.node.clearSelections();

          break; // End copy

          case 'v': // Paste
            // TODO: this will not always be a document
            document.body.appendChild(hack);
            hack.addEventListener("paste", function tempPasteHandler() {

              // wait for the textarea to be populated (large pastes)
              if (hack.value === "") {
                setTimeout(tempPasteHandler, 0);
                return;
              }

              // cleanup after ourselves
              hack.removeEventListener("paste", tempPasteHandler, true);

              // TODO OPTIMIZE: instead of starting at the very beginning and
              //   and looping through every character, it would be much faster
              //   to lineBreak until the last 'page' and fill there. After the
              //   current page is filled, filling the rest of the content can
              //   be moved into a setTimeout

              // Add the new text at the cursor pos
              var text         = hack.value,
                  c,
                  i            = 0,
                  l            = text.length,
                  start        = 0,
                  row          = obj.cursor.row,
                  col          = obj.cursor.col,
                  addCharacter = function() {
                    start = (new Date()).getTime();
                    if (i>=l) {
                      obj.cursor.row = row;
                      obj.cursor.col = col;
                      obj.dirty = true;
                      return;
                    }

                    for (i; i<l; i++) {
                      c = text[i];
                      if (c !== "\n") {
                        obj.pos(row, col).insert(c);
                        col++;
                      } else {
                        obj.pos(row, col).breakLine();
                        row++;
                        col = 0;
                      }
                      if ((new Date()).getTime()-start > 200) {
                        setTimeout(addCharacter, 16);
                        obj.cursor.row = row;
                        obj.cursor.col = col;
                        break;
                      }
                    }
                    obj.cursor.row = row;
                    obj.cursor.col = col;
                  };

              hack.value = "";
              addCharacter();

            }, false);

            hack.value = "";
            hack.focus();

            // Remove the selection
            selection.node.clearSelections();

          break; // End Paste

          case 'x': // Cut
            if (!selection || !selection.current) {
              return;
            }

            // find the side of the range that is closest to the top
            if (r.src.y !== r.dest.y) {
              if (r.dest.y > r.src.y) {
                first = r.src;
                last  = r.dest;
              } else if (r.dest.y < r.src.y) {
                first = r.dest;
                last  = r.src;
              }

              for (i = first.y; i<=last.y; i++) {
                // get full lines
                if (i === first.y) {
                  lines.push(obj.pos(i,first.x).toString());
                } else if (i === last.y) {
                  lines.push(obj.pos(i,0).toString().substring(0, last.x));
                } else {
                  lines.push(obj.pos(i,0).toString());
                }
              }
              text = lines.join("\n");
            // src and dest are on the same line, figure out which is first
            } else {
              if (r.src.x < r.dest.x) {
                text = obj.pos(r.src.y,r.src.x).toString();
                text = text.substring(0, r.dest.x - r.src.x);
                first = r.src;
                last  = r.dest;
              } else {
                text = obj.pos(r.dest.y,r.dest.x).toString();
                text = text.substring(0, r.src.x - r.dest.x);
                first = r.dest;
                last  = r.src;
              }
            }

            hack.value = text;
            hack.focus();
            hack.select();

            var total = text.length, pos;
            while (total>0) {
              pos = obj.pos(first.y, first.x);
              if (pos.length > 0) {
                pos.remove();
              } else {
                pos.removeLine();
              }
              total--;
            }

            obj.cursor.row = first.y;
            obj.cursor.col = first.x;

            // Remove the selection
            selection.node.clearSelections();

          break; // End Cut

        }
      }
    });

    return obj;
  });
}(window));
