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
        charHeight       = editor.font.size.lineHeight(),
        currentOperation = null;

    // set up key press event listener
    // TODO: calls to keybinder plugin
    document.addEventListener('keydown', function(event){
      if (event.character) {
        editor.pos(pos.row, pos.col).insert(event.character);
        pos.col+=event.character.length;
      } else {
          switch (event.keyCode)
          {
            case 13:
              if (pos.col > editor.pos(pos.row,0).length()) {
                pos.row++;
                pos.col=0;
              } else {
                var start = editor.pos(pos.row,0).toString().substring(0,pos.col),
                    end   = editor.pos(pos.row,0).toString().substring(pos.col);
                editor.pos(pos.row, pos.col).fromString(start);
                pos.row++;
                pos.col = 0;
                editor.pos(pos.row, pos.col).insertLine(end);
              }
            break;
            
            case 8:
              // first char in a line
              if (pos.col === 0) {
                var prev = editor.pos(pos.row,0).toString();
                if (pos.row > 0) {
                  prev = prev.substring(pos.col);
                  editor.pos(pos.row, pos.col).removeLine();
                  pos.row--;
                  pos.col = editor.pos(pos.row,0).length();
                  editor.pos(pos.row,pos.col).append(prev);
                }
                // TODO: bring in the rest of the line after backspace (needs other movement)
              
              // anywhere else in the line
              } else {
                pos.col--;
                editor.pos(pos.row,pos.col).remove();
              }
            break;
            
            case 38: // up
              if (pos.row > 0) {
                pos.row--;
              }
              
              // position the cursor correctly on the col
              if (pos.col > editor.pos(pos.row,0).length()) {
                pos.col = editor.pos(pos.row,0).length();
              }
            
              event.preventDefault();
            break;
            
            case 40: // down
              if (pos.row < editor.length()-1) {
                pos.row++;
              }
              
              // position the cursor correctly on the col
              if (pos.col > editor.pos(pos.row,0).length()) {
                pos.col = editor.pos(pos.row,0).length();
              }
            
              event.preventDefault();
            break;
            
            case 37: // left
              // start of line
              if (pos.row > 0 && pos.col === 0) {
                pos.row--;
                pos.col=editor.pos(pos.row, 0).length();
              } else if (pos.col > 0){
                pos.col--;
              }
              event.preventDefault();
            break;
            
            case 39: // right
              // end of line
              if (pos.col > editor.pos(pos.row, 0).length()) {
                if (pos.row < editor.length()-1) {
                  pos.row++;
                  pos.col = 0;
                }
              } else {
                pos.col++;
              }
              event.preventDefault();
            break;
            
            case 32:
              event.preventDefault();
            break;
          }
      }
    }, false);

    editor.bind("cider.render",  function() {
        currentOperation();
    });
    
    var show = function() {
      var posx   = editor.getTextOffset().x, 
          posy   = pos.row * charHeight, currentPosition;
          length = editor.pos(pos.row,0).length();

      if (length > 0) {
        posx += ctx.measureText(editor.pos(pos.row,0).toString().substring(0,pos.col)).width;
      }
      ctx.save();
      ctx.fillStyle = "white";  
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
