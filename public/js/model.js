
var database;
var socket;
$( document ).ready( function(){
    socket = io.connect('http://' + location.host);
    socket.on('generatedCheckin', function (data) {
                console.log(data);
    });
    socket.on('syncFromServer', function (data) {
                console.log(data);
    });
	initDatabase();
});


var initDatabase = function () {
    var request = window.indexedDB.open('test-webcam', 1);
    request.onerror = function(event) {
	console.log("El navegador no soporta IndexedDB :/ "+JSON.stringify(event));
    };
    request.onsuccess = function(event) {

	database = request.result;
	getWTItems();
    };

    request.onerror = function ( event ){
	console.log("Database error! "+event.target.errorCode);

    };


    request.onupgradeneeded = function (event){

	database  = event.target.result;

	var usuarios = database.createObjectStore("workingtime", { autoIncrement: true });
	usuarios.createIndex("cod", "cod", { unique: false });  
	usuarios.createIndex("employee", "employee", { unique: false });
	usuarios.createIndex("captcheckin", "captcheckin", { unique: false });
	usuarios.createIndex("checkin", "checkin", { unique: false });
	usuarios.createIndex("captcheckout", "captcheckout", { unique: false });
	usuarios.createIndex("checkout", "checkout", { unique: false });

    };

};

function WorkingTime(){
  this.cod=1;
  this.employee = 0;
  this.captcheckin = new Blob();
  this.checkin = new Date();
  this.captcheckout = null;
  this.checkout = null;
}

function performCheckin(data,employee){

    if(data) {

        var checkin = new WorkingTime();
  checkin.captcheckin = data;
  checkin.employee = employee;
        var transac = database.transaction(["workingtime"],"readwrite");
      var checkins = transac.objectStore("workingtime");

    var request = checkins.add(checkin);
    transac.oncomplete = function (event) {

      console.log("Exito! WT agregado ");
    };      
    transac.onerror = function(event){
      console.log("Error de IndexedDB al agregar un nuevo WT");
    }
    request.onsuccess = function(event){
          console.log("result del add "+JSON.stringify(event.target.result));
        updateWTID(event.target.result);
}

  }else {
    console.log("data es nulo");
   }

}


function updateWTID(key){
    
    var transac  = database.transaction(["workingtime"],"readwrite");
    var wts = transac.objectStore("workingtime");
    var request = wts.get(key);
    request.onsuccess = function(event){
      updateObjectID(request.result,transac,key);

    };
    request.onerror = function (event){
      console.log("error en updateKey");
    };

}

function updateObjectID(wt, transaction,key){
  wt.cod = key;
  var wts = transaction.objectStore("workingtime");
 
  var request = wts.put(wt,key);
  request.onsuccess = function (event){
      wt['employee'] = "1";
      wt['branchid'] = "1";
      socket.emit("saveCheckin",wt);
  }
  request.onerror = function(event){
    console.log("error en updateObjectID");
  }
  transaction.oncomplete = function(event){
        getWTItems();

  };
}

function performCheckout(capture, employee){
  var transaction = database.transaction(["workingtime"],"readwrite");
  var wts = transaction.objectStore("workingtime");
  wts.openCursor().onsuccess = function(event){
      var cursor = event.target.result;
      if(cursor){
          console.log("entra al cusr de perfcheckout "+cursor.value.employee+" "+cursor.key);

        if( (cursor.value.employee === employee) && (cursor.value.checkout == null)){
          console.log("entra al if de perfcheckout ");
          var wt = new WorkingTime();
          wt.cod = cursor.value.cod;
          wt.employee = cursor.value.employee;
          wt.captcheckin = cursor.value.captcheckin;
          wt.checkin = cursor.value.checkin;
          wt.captcheckout = capture;
          wt.checkout = new Date();

          updateObject(cursor.key, wt);
        }
        cursor.continue();
      }
  }

  wts.openCursor().onerror = function(event){
    console.log("error en opencursor para getEmployeeWT");
  }

}


function updateObject(key,wt){
    var transaction = database.transaction(["workingtime"],"readwrite");
  var wts = transaction.objectStore("workingtime");
  var request = wts.put(wt,key);
  request.onsuccess = function(event){
      socket.emit("checkout",wt); 
  };
  request.onerror = function(event){
    console.log("error en updateObject :S");
  };
  transaction.oncomplete = function(event){
    getWTItems();

  };

}


function isACheckin(employee){
  var flag = true;
  var transaction = database.transaction(["workingtime"],"readwrite");
  var wts = transaction.objectStore("workingtime");
  wts.openCursor().onsuccess = function(event){
      var cursor = event.target.result;
     
      if(cursor){
     
        if( (cursor.value.employee === employee) && (cursor.value.checkout == null)){
         
            flag = false;
        }
        cursor.continue();
      }else{
        console.log("termina cursor "+flag);
      }
  }

  wts.openCursor().onerror = function(event){
    console.log("error en opencursor para isACheckin");
  }
  transaction.oncomplete = function(event){
      if(flag){
        console.log("es un checkin "+employee);
        doCheckin(employee);
      }else{
        console.log("es un checkout "+employee);
        doCheckout(employee);
      }


  }

};

function saveWT(wt){

  var flag = true;
  var transaction = database.transaction(["workingtime"],"readwrite");
  var wts = transaction.objectStore("workingtime");
    var req = wts.get(wt.cod.toString());
    req.onsuccess = function(event){
	flag = false;
    };
    req.onerror = function(event){
	flag = true;
    };
    transaction.oncomplete = function(event){
	if(flag){
	    insertFromServer(wt,function(res){
		console.log(res);
	    });
	}else{
	    updateFromServer(wt,function(res){
		console.log(res);
	    });
	};
    };

};


function updateFromServer(wt,callback){
    console.log("entra a updateFromServer cod "+wt.cod+" checkin "+wt.checkin);
    var transaction = database.transaction(["workingtime"],"readwrite"), request = transaction.objectStore("workingtime").put(wt,wt.cod);
    request.onerror = function(event){
	console.log("entro en error");
	callback("1");
    };
    request.onsuccess = function(event){
	callback("0");
	console.log("entro en success");
    };
    transaction.oncomplete = function(event){
	getWTItems();
    };
};

function insertFromServer(wt,callback){
    console.log("entra a insertFromServer");
    var transaction = database.transaction(["workingtime"],"readwrite"),request = transaction.objectStore("workingtime").add(wt);
    request.onerror = function(event){
	console.log("error insert");
	callback("1");
    };
    request.onsuccess = function(event){
	console.log("success insert");
	callback("0");
    };
    transaction.oncomplete = function(event){
	getWTItems();
    };
};