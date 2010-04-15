(function(cider) {
  cider.renderer = function(editor) {

// TODO: use the editor's options here (background, textcolor, etc)
// TODO: remove all instances of cider and replace them with editor.

    // Add the render step to the editor
    editor.bind("cider.render", function (data) {
      var background = "#2A3335",
          foreground = "#FFFFFF",
          lineHeight = 10,
          l = 0,
          ctx = editor.context();

      // clearRect isn't set first time around
      if (ctx.clearRect) {
        ctx.clearRect (0, 0, 600, 600);
      }

      ctx.fillStyle = background;
      ctx.fillRect (0, 0, 600, 600);
      ctx.fillStyle = foreground;

      if (cider.fn.lines) {
        for (l; l < cider.fn.lines.length; l++) {
          ctx.fillText(cider.fn.lines[l], 
                       10+editor.getOffset().x, 
                       lineHeight+editor.getOffset().y);
          lineHeight += 20;
        }
      }
    });
    
    var ms = 0, interval = 30;
    setInterval(function() {
      last=ms;
      ms+=interval;
      editor.trigger("cider.render", {tick: ms});
    }, 30);
    
  };
  cider.renderer.prototype = {};
})(cider);
