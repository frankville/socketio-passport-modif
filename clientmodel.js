
var database ;

$( document ).ready( function(){
	initDatabase();

});


var initDatabase = function () {
    var request = window.indexedDB.open('attendance-test', 1);
    request.onerror = function(event) {
	console.log("El navegador no soporta IndexedDB :/ "+JSON.stringify(event));
    };
    request.onsuccess = function(event) {

	database = request.result;
	getAdminItems();
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
  usuarios.createIndex("branchid","branchid",{unique: false});

  var branch = database.createObjectStore("branch", { autoIncrement: true });
  branch.createIndex("cod", "cod", { unique: false });
  branch.createIndex("name", "name", { unique: false });
branch.createIndex("phone", "phone", { unique: false });
branch.createIndex("address", "address", { unique: false });
branch.createIndex("email", "email", { unique: false });
branch.createIndex("custid", "custid", { unique: false });

  var customer = database.createObjectStore("customer", { autoIncrement: true });
  customer.createIndex("cod", "cod", { unique: false });  
  customer.createIndex("username", "username", { unique: false });
  customer.createIndex("password", "password", { unique: false });

  var user = database.createObjectStore("user", { autoIncrement: true });
  user.createIndex("cod", "cod", { unique: false });  
  user.createIndex("maxbranches", "maxbranches", { unique: false });
  user.createIndex("maxemployees", "maxemployees", { unique: false });

  var adminuser = database.createObjectStore("adminuser", { autoIncrement: true });
  adminuser.createIndex("cod", "cod", { unique: false });  
  adminuser.createIndex("aname","aname",{unique: false});
  adminuser.createIndex("asurn","asurn",{unique: false});
  adminuser.createIndex("apicture","apicture",{unique: false});
  adminuser.createIndex("aemail","aemail",{unique: false});
  adminuser.createIndex("aaddr","aaddr",{unique: false});
  adminuser.createIndex("aphone","aphone",{unique: false});
  adminuser.createIndex("custid","custid",{unique: false});


  var employee = database.createObjectStore("employee", { autoIncrement: true });
  employee.createIndex("cod", "cod", { unique: false }); 
  employee.createIndex("name","name",{unique: false});
  employee.createIndex("surname","surname",{unique: false});
  employee.createIndex("picture","picture",{unique: false});
  employee.createIndex("email","email",{unique: false});
  employee.createIndex("address","address",{unique: false});
  employee.createIndex("phone","phone",{unique: false});
  employee.createIndex("custid","custid",{unique: false}); 

  var branchesperadmin = database.createObjectStore("branchesperadmin", { autoIncrement: true });
  branchesperadmin.createIndex("cod", "cod", { unique: false });  
  branchesperadmin.createIndex("adminid", "adminid", { unique: false }); 
  branchesperadmin.createIndex("branchid", "branchid", { unique: false }); 

  };

};

function WorkingTime(){
  this.cod=1;
  this.employee = 0;
  this.captcheckin = new Blob();
  this.checkin = new Date();
  this.captcheckout = null;
  this.checkout = null;
    this.branchid =0;
}

function Employee(){
    this.cod = 0;
    this.name = "";
    this.surname ="";
    this.email ="";
    this.customerid=0;
    this.phone =0;
    this.address ="";
}

function Branch(){
    this.name = "";
    this.address ="";
    this.phone = "";
    this.email ="";
}

function BranchesPerAdmin(){
    this.admin =0;
    this.branch=0;
}

function performCheckin(data,employee){

    if(data) {

        var checkin = new WorkingTime();
  checkin.captcheckin = data;
  checkin.employee = employee;
	checkin.branchid = 1;

  saveObject(checkin, "workingtime", function(data){
    console.log(data);
      socket.emit("saveCheckin",checkin,function(resp){
	  console.log(resp);
      });
  })

  }else {
    console.log("data es nulo");
   }

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

          updateObject(wt,cursor.key,function(data){
            console.log(data);
	      socket.emit("saveCheckout",wt,function(resp){
		  console.log(resp);
	      });
          });
        }
        cursor.continue();
      }
  }

  wts.openCursor().onerror = function(event){
    console.log("error en opencursor para getEmployeeWT");
  }

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




function saveObject(obj,objName, callback){

  var flag = true;
  var transaction = database.transaction([objName],"readwrite");
  var objs = transaction.objectStore(objName);
    var req = objs.get(obj.cod.toString());
    req.onsuccess = function(event){
  flag = false;
    };
    req.onerror = function(event){
  flag = true;
    };
    transaction.oncomplete = function(event){
  if(flag){
      insertObject(obj,objName,callback);
  }else{
      updateObject(obj,objName,callback);
  };
    };

};


function updateObject(obj,objName,callback){
    console.log("entra a updateFromServer cod "+obj.cod+" objName "+objName);
    var transaction = database.transaction([objName],"readwrite"), request = transaction.objectStore(objName).put(obj,obj.cod);
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

function insertObject(obj,objName,callback){
    console.log("entra a insertBranchFromServer");
    var transaction = database.transaction([objName],"readwrite"),request = transaction.objectStore(objName).add(obj);
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

