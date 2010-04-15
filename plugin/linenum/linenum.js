/*
 * LineNum - Canvas Plugin
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

// TODO: make the linenums only generate once
(function(cider) {

  cider.linenum = function(editor) {
      
      var ctx = editor.context();

      editor.bind("cider.render",function() {
        var l = 0,
            height = 600,
            lineHeight = 12,
            lines = height/lineHeight;
        
        ctx.fillRect(1, 1, 30, height-2);
        ctx.font = "11px Courier New";
        ctx.fillStyle = "grey";
        ctx.textAlign = "right";
        
        for (l; l<lines; l++) {
            ctx.fillText(l, 25, (lineHeight+4)*l+4);
        };
      });
  };
  cider.linenum.prototype = {};
})(cider);
