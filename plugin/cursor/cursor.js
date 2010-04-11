(function(cider) {

  cider.Cursor = function(editor) {

    var hideDuration     = 1000,
        showDuration     = 1000,
        opacity          = 0.5,
        color            = "#ff6600",
        ctx              = editor.getContext(),
        interval         = null // we can pause this, and expose show/hide
        x                = 0,
        y                = 0,
        charWidth        = 50,
        charHeight       = 50,
        currentOperation = null;
    
    
    this.doCurrentOperation = function() {
      currentOperation();
    }

    editor.addRenderStep(this.doCurrentOperation);
    
    var show = function() {
      var posx = x*charWidth, posy=y*charHeight;
      ctx.fillStyle = "white";//"rgba(255,102,51,255)";
      ctx.fillRect(posx,posy,posx+charHeight,posy+charWidth);
    };
    
    var hide = function() {
      // fade out or whatever..
    };
    
    var cycleRenderOperation = function() {
      if (currentOperation === hide) {
        currentOperation = show
        setTimeout(cycleRenderOperation, showDuration);
      } else {
        currentOperation = hide;
        setTimeout(cycleRenderOperation, hideDuration);
      }
    };
    cycleRenderOperation();
    
  };
  
  cider.Cursor.prototype = {};
})(cider);
