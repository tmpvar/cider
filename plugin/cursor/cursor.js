(function(cider) {

  cider.cursor = function(editor) {
    
    // cursor position
    var pos = {col: 0, row: 0},self = this;
    
    // set up key press event listener
    // TODO: calls to keybinder plugin
    document.addEventListener('keydown', function(event){
        editor.lines[pos.row] = (editor.lines[pos.row])                 ? 
                                editor.lines[pos.row] + event.character :
                                event.character;
        
        
    }, false);
    
    var hideDuration     = 1000,
        showDuration     = 1000,
        opacity          = 0.5,
        color            = "#ff6600",
        interval         = null, // we can pause this, and expose show/hide
        x                = 0,
        y                = 0,
        charWidth        = 50,
        charHeight       = 50,
        currentOperation = null;
    
    
    self.doCurrentOperation = function(ctx) {
      currentOperation(ctx);
    }

    editor.addRenderStep(self.doCurrentOperation);
    
    var show = function(ctx) {
      var posx = x*charWidth, posy=y*charHeight;
      ctx.fillStyle = "white";//"rgba(255,102,51,255)";
      ctx.fillRect(posx,posy,posx+charHeight,posy+charWidth);
    };
    
    var hide = function(ctx) {
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
  
  cider.cursor.prototype = {};
})(cider);
