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
        editor.pos(pos.row, pos.col).insert(event.character);
        pos.col+=event.character.length;
      } else {
          if (event.keyCode == "13") {
            pos.row++;
            pos.col=0;
          } else if (event.keyCode =="8") {
            
            // first char in a line
            if (pos.col === 0) {
              pos.row = (pos.row === 0) ? pos.row : pos.row - 1;
              pos.col = editor.pos(pos.row,0).length();
              // TODO: bring in the rest of the line after backspace
              
            // anywhere else in the line
            } else {
              pos.col--;
              editor.pos(pos.row,pos.col).remove();
            }
          }
      }
    }, false);

    editor.bind("cider.render",  function() {
        currentOperation();
    });
    
    var show = function() {
      var posx = editor.getTextOffset().x, 
          posy = pos.row * charHeight, currentPosition;
     
      if (editor.pos(pos.row,0).toString()) {
        currentPosition = editor.pos(pos.row).length();
      }
      
      if (currentPosition > 0) {
        posx += pos.col*charWidth+4;
      } else {
        posx += 4;
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
