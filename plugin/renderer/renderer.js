(function(cider) {
  cider.renderer = function(editor) {

// TODO: use the editor's options here (background, textcolor, etc)
// TODO: remove all instances of cider and replace them with editor.

    // Add the render step to the editor
    editor.addRenderStep(function (ctx) {
      var background = "#2A3335",
          foreground = "#FFFFFF",
          lineHeight = 10,
          l = 0;

      // clearRect isn't set first time around
      if (ctx.clearRect) {
        ctx.clearRect (0, 0, 600, 600);
      }

      ctx.fillStyle = background;
      ctx.fillRect (0, 0, 600, 600);

      ctx.fillStyle = foreground;

      

      if (cider.fn.lines) {
        for (l; l < cider.fn.lines.length; l++) {
          ctx.fillText(cider.fn.lines[l], 10+editor.getOffset().x, lineHeight+editor.getOffset().y);
          lineHeight += 20;
        }
      }
    });
  };
  cider.renderer.prototype = {};
})(cider);
