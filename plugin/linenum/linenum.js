/*
 * LineNum - Canvas Plugin
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

// TODO: make the linenums only generate once
(function(cider) {

  cider.linenum = function(editor) {
      
      var ctx = editor.context(),
          width = 30;

      var offset = editor.getOffset();
      offset.x += width;
      editor.setOffset(offset);

      editor.bind("cider.render",function() {
        var l = 0,
            height = 600,
            lineHeight = 12,
            lines = height/lineHeight;
        
        ctx.save();
        ctx.fillStyle = "black";
        ctx.fillRect(1, 1,width, height-2);
        ctx.fillStyle = "#DDD";
        ctx.textAlign = "right";
        
        for (l; l<lines; l++) {
          ctx.fillText(l, 25, (lineHeight+4)*l);
        };
        
        ctx.restore();
      });
  };
  cider.linenum.prototype = {};
})(cider);
