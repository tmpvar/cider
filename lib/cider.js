/*
 * Cider - Canvas Text Editor
 *   Licensed under the MIT (LICENSE.txt)
 */
"use strict";
(function(export) {
  var cider = export.cider = {};

  // Core constructs

  // Features
  cider.feature = {};

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
      lines : options.lines || []
    };


    return carena.applyProperties(obj, {

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
            //ctx.fillText(editor.pos(l,0).toString(), offset.x, lineHeight*(l+1));
            ctx.fillText(safe.lines[l], obj.x + offset.x, obj.y + (safe.font.size*(l+1)));
        }
        ctx.restore();
      }
    });
  };
}(window));
