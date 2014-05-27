  //Comprobamos la compatibilidad de nuestro navegador con User Media
            if (tieneUserMedia()) {
                console.log("Ok, el navegador soporta UserMedia");
            } else {
                alert('Mala suerte: getUserMedia() no está soportado en tu navegador. ¿Conoces Chrome?');
            }

            //Comprueba los diferentes motores que dan soporte
            function tieneUserMedia() {
                return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
            }
            
            /////////////////////////////////
            /////////////////////////////////

            //Similar a los prefijos de CSS, usamos variables para contener los posibles
            //objetos usados en cada navegador 

            window.URL = window.URL || window.webkitURL;
            
            navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                                      navigator.mozGetUserMedia || navigator.msGetUserMedia;

            var video = document.querySelector('video');           
            
            //Comprobamos si existe getUserMedia y si no lanzamos un error
            if (navigator.getUserMedia) {
                navigator.getUserMedia({video: true}, exito, error);
                //Llámamos getUserMedia, pedimos acceso a vídeo. Si tenemos éxito llamamos una función y si no, lanzamos un error.
            } else {
                error();
            }

            //Si soportamos getUserMedia y damos permiso, nuestro tag de video mostrará el stream que recogemos.
            function exito(stream) {
                video.src = window.URL.createObjectURL(stream);
            }

            //Nuestro error lanza un simple mensaje alert.
            function error(e) {
                alert("Algo salió mal, técnicamente");
            }

  function saveAPic() {
    alert($("#cuadro").val());
    var canvas = $("#cuadro");
    canvas.width = video.getAttribute("width");
    canvas.height = video.getAttribute("height");
    canvas.getContext('2d').drawImage(video, 0, 0, video.getAttribute("width"), video.getAttribute("height"));
    var data = canvas.toDataURL('image/png');
    saveToDB(data);
  }