/* 
        console.log('hello');
        var options = {
            width: 400,
            height:250,
            zoomWidth: 500,
            offset: {vertical: 0, horizontal: 10},
            scale:1.5
        };
        new ImageZoom(document.getElementById("main_image"), options); */

        document.addEventListener("DOMContentLoaded", function() {
            // Your JavaScript code here
            var options = {
              width: 400,
              height: 250,
              zoomWidth: 500,
              offset: { vertical: 0, horizontal: 10 },
              scale: 1.5,
            };
            new ImageZoom(document.getElementById("main_image"), options);
          });