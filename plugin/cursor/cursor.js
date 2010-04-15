/*
 * Cursor - Canvas Plugin
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

(function(cider) {

  cider.plugins.cursor = function(editor) {
    // cursor position
    var pos = {col: 0, row: 0},self = this, ctx = editor.context();

    
    var hideDuration     = 500,
        showDuration     = 500,
        opacity          = 0.5,
        color            = "#ff6600",
        x                = 10,
        y                = 10,
        charWidth        = 11,
        charHeight       = 16,
        currentOperation = null;

    // set up key press event listener
    // TODO: calls to keybinder plugin
    document.addEventListener('keydown', function(event){
      if (event.character) {
        editor.pos(pos.row, pos.col).append(event.character);
        pos.col+=event.character.length;
      }
    }, false);

    editor.bind("cider.render",  function() {
        currentOperation();
    });
    
    var show = function() {
      var posx = 0, posy = editor.getTextOffset().y, currentPosition;
      if (editor.pos(pos.row,0).toString()) {
        currentPosition = editor.pos(pos.row).length();
      }
      
      if (currentPosition > 0) {
        posx = currentPosition*charWidth+editor.getTextOffset().x+4;
      } else {
        posx = editor.getTextOffset().x+4;
      }
      ctx.save();
      ctx.fillStyle = "white";//"rgba(255,102,51,255)";
      ctx.fillRect(posx,posy,2,charHeight);
      ctx.restore();
    };
    
    var hide = function() {
        // fade out or whatever..
    };
      
    var cycleRenderOperation = function() {
        if (currentOperation === hide) {
            currentOperation = show;
            setTimeout(cycleRenderOperation, showDuration);
        } else {
            currentOperation = hide;
            setTimeout(cycleRenderOperation, hideDuration);
        }
    };

    cycleRenderOperation();
  };

})(cider);
