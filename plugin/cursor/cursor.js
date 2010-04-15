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
              editor.pos(pos.row++,pos.col);
              var x = editor.getTextOffset().x;
              editor.setTextOffset({x:x, y:pos.row*18});
          } else if (event.keyCode =="8") {
              /* BACKSPACE
              // begining of line
              if (editor.pos(pos.row,0).toString().length  === 0) {
                  editor.pos(pos.row--,pos.col);
              }
              // first line
              if (editor.pos(pos.row,0).toString().length  === undefined) {
                  editor.pos(pos.row++, pos.col);
              }
              // reduce existing string length by one
              if (editor.pos(pos.row,0).toString().length  > 0) {
                  
              }
              */
          }
      }
    }, false);

    editor.bind("cider.render",  function() {
        currentOperation();
    });
    
    var show = function() {
      var posx = 0, posy = editor.getTextOffset().y+4, currentPosition;
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
