(function(cider) {
  cider.plugins.renderer = function(editor) {

    var ctx = editor.context(),
        background = "#2A3335",
        foreground = "#FFFFFF",
        lineHeight = editor.font.size.get(),
        l = 0;

// TODO: use the editor's options here (background, textcolor, etc)
// TODO: remove all instances of cider and replace them with editor.

    // Add the render step to the editor
    editor.bind("cider.render", function (data) {
      
      ctx.save();

      ctx.fillStyle = background;
      ctx.fillRect (0, 0, 600, 600);
      ctx.fillStyle = foreground;
      
      var offset = editor.getTextOffset(),
          len    = editor.length();

      for (l=0; l<len; l++) {
          var line = editor.pos(l,0);
          ctx.fillText(line.toString(), offset.x, lineHeight*l+18);
      }
      ctx.restore();
    });
    
    var ms = 0, interval = 30;
    setInterval(function() {
        last=ms;
        ms+=interval;
        editor.trigger("cider.render", {tick: ms});
    }, 30);
    
  };

})(cider);
