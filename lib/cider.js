/*
 * Cider - Canvas Text Editor
 *
 * Licensed under the MIT (LICENSE.txt)
 * 
 */

(function () {
    var
    plugins = {},     // store all of the plugins here
    renderQueue = [], // plugins that need to be rendered (painters algo)
    updateQueue = [], // plugins that need to be updated on a cycle

    // local copy of cider
    cider = function (canvas) {
        cider.fn.init(canvas);
    };

    // setup global scope of cider
    window.cider = cider;
    
    cider.fn = {
        addPlugin : function(name, obj) {
          // TODO: either pass in cider options or expose them.
          plugins[name] = new obj(cider.fn);  
        },
        removePlugin : function(name) {
          delete plugins[name];
        },
        addRenderStep : function(fn) {
          renderQueue.push(fn);
        },
        addUpdateStep : function(fn) {
          renderQueue.push(fn);
        },
        
        // lines array
        lines : [],
        
        init : function (canvas)
        {            
            var ctx = canvas.getContext("2d");
                ctx.textBaseline = "top";
                ctx.font = "18px Arial";

            setInterval(function() {
                var step=0;len = renderQueue.length;
                for (step; step<len; step++) {
                    renderQueue[step](ctx);
                }
            }, 30);
        }
    };
})();
