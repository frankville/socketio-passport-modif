  function Admin(){
    this.cod = 0;
    this.name = "";
    this.surname = "";
    this.picture = "";
    this.phone = "";
    this.email = "";
    this.addr ="";
    this.username = "";
    this.passwd = "";
    this.customerid = 0;
  }

  function getAdminItems(){	
  	console.log("entra aca");
  			var array = new Array();
	var admins = database.transaction("adminuser").objectStore("adminuser");

admins.openCursor().onsuccess = function(event) {
  var cursor = event.target.result;
  if (cursor) {

  	var adm = new Admin();
    adm.cod = cursor.value.cod;
    adm.name = cursor.value.aname;
    adm.surname = cursor.value.asurn;
    adm.picture = cursor.value.apicture;
    adm.phone = cursor.value.aphone;
    adm.email = cursor.value.aemail;
    adm.addr = cursor.value.aaddr;
    adm.customerid = cursor.value.custid;


  	array.push(adm);

    cursor.continue();
  }
  else {
     reloadAdmin(array);
  }
};

admins.openCursor().onerror = function (event){
	alert("error en getAdmins!!");
}

};
  

var reloadAdmin = function(admins){
	$("#listaAdmin tbody tr").remove();
    console.log("entra a reload");
	
	if (!admins){
	return;
	}

	for(var i=0;i < admins.length; i++){
		var row = "<tr>";

    var apic = admins[i].picture;

    var imgapic = "<img src='"+apic+"' width='100' height='100' class='snapshot' >";


    row = row +
		"<td id='acod'>"+admins[i].cod+"</td>"+
		"<td>"+admins[i].name+"</td>"+
    "<td>"+admins[i].surname+"</td>"+
		"<td>"+imgapic+"</td>"+
		"<td>"+admins[i].phone+"</td>"+
    "<td>"+admins[i].email+"</td>"+
		"<td>"+admins[i].addr+"</td>"+
    "<td>"+admins[i].customerid+"</td>"+
		"</tr>";
		$("#lista").append(row);

	};
  /*
	$('#lista tbody tr :button').click(function(e){
			console.log("valor closest "+$(this).closest('tr').html());
		var id = $(this).closest('tr').find("#cod").text();
		$(this).closest('tr').remove();

 				deleteWT(id);
	});
  */
  
};
/*
function deleteWT(wt){
  var transaction = database.transaction(["workingtime"], "readwrite");
     var wts = transaction.objectStore("workingtime");
    var request =  wts.delete(parseInt(wt));
  request.onsuccess = function(event) {
  };
  transaction.oncomplete = function (event ){
    getWTItems();
  }
};
*/