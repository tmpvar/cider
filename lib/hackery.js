document.body.innerHTML = '<html><body><canvas id="canvas" height="600" width="600"></canvas></body></html>';
 
var canvas = document.getElementById("canvas");
var ctx    = canvas.getContext("2d");
var background = "#2A3335";
 
ctx.fillStyle = background;
ctx.fillRect (0, 0, 600, 600);
 
ctx.textBaseline = "top";
ctx.font = "20px Arial";
 
 
var lines = [""], line = 0;
 
function clearLine(num) {
    var width = ctx.measureText(lines[num]).width || lines[line].length * 20;
    ctx.fillStyle = background;
    ctx.fillRect(10,10,width + 10, 20);
}
 
document.addEventListener("keydown", function(ev) {
  var code;
  if (!ev) {
    ev = window.event;
  }
  
  if (ev.keyCode) {
    code = ev.keyCode;
  } else if (ev.which) {
    code = ev.which;
  }
console.log(code);
  switch (code) {
    case 8 :
      clearLine(line);
      lines[line] = lines[line].substring(0, lines[line].length-2 || 0);
    break;
    case 32:
      
 
    break;
    default:
      var char = String.fromCharCode(code);
      var casing = (ev.shiftKey) ? char.toUpperCase : char.toLowerCase;
      lines[line] += casing.call(char);
    break;
  }
  
  clearLine(line);
 
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(lines[line], 10, 10);
}, false);
