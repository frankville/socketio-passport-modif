  function getWTItems(){	
  	console.log("entra aca");
  			var array = new Array();
	var wTime = database.transaction("workingtime").objectStore("workingtime");

wTime.openCursor().onsuccess = function(event) {
  var cursor = event.target.result;
  if (cursor) {

  	var wt = new WorkingTime();
  	wt.cod = cursor.value.cod;
  	wt.employee = cursor.value.employee;
  	wt.captcheckin = cursor.value.captcheckin;
  	wt.checkin = cursor.value.checkin;
  	wt.captcheckout = cursor.value.captcheckout;
  	wt.checkout = cursor.value.checkout; 

  	array.push(wt);

    cursor.continue();
  }
  else {
     reloadwts(array);
  }
};

wTime.openCursor().onerror = function (event){
	alert("error en getusuarios!!");
}



};
  

var reloadwts = function(wts){
	$("#lista tbody tr").remove();
    console.log("entra a reload");
	
	if (!wts){
	return;
	}

	for(var i=0;i < wts.length; i++){
		var row = "<tr>";

    var imgCheckin = wts[i].captcheckin;
	var imgCheckout = wts[i].captcheckout;
    var imgChin = "<img src='"+imgCheckin+"' width='100' height='100' class='snapshot' >";
    var imgChout = "";
    if(wts[i].captcheckout != null){
    	imgChout="<img src='"+imgCheckout+"' width='100' height='100' class='snapshot' >";
    }
    row = row +
		"<td id='cod'>"+wts[i].cod+"</td>"+
		"<td>"+wts[i].employee+"</td>"+
		"<td>"+imgChin+"</td>"+
		"<td>"+wts[i].checkin+"</td>"+
		"<td>"+imgChout+"</td>"+
		"<td>"+wts[i].checkout+"</td>"+
		"<td>"+"<button>x</button></td>"+
		"</tr>";
		$("#lista").append(row);

	};
	$('#lista tbody tr :button').click(function(e){
			console.log("valor closest "+$(this).closest('tr').html());
		var id = $(this).closest('tr').find("#cod").text();
		$(this).closest('tr').remove();

 				deleteWT(id);
	});
};