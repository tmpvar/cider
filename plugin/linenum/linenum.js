/*
 * LineNum - Canvas Plugin
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

// TODO: make the linenums only generate once
(function(cider) {
    cider.plugins.linenum = function(editor) {
      
      var ctx = editor.context(),
          width = 30;

      var offset = editor.getTextOffset();
      offset.x += width;
      editor.setTextOffset(offset);
      
        editor.bind("cider.render",function() {
            var l = 0,
                height = 600,
                lineHeight = 14,
                lines = height/lineHeight;

            ctx.save();
            ctx.font = "11px Courier New";
            ctx.fillStyle = "black";
            ctx.fillRect(1, 1,width, height);
            ctx.fillStyle = "#DDD";
            ctx.textAlign = "right";
            
            for (l; l<lines; l++) {
              ctx.fillText(l, 25, (lineHeight+4)*l);
            };
            
            ctx.restore();
        });
    };
})(cider);
