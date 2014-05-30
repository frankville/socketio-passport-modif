var  socket ;
var customerid =0;
$(document).ready(function(){



	$.get("/isLogged",function(cid){
		console.log("customerid de este usuario es "+cid);
		if(cid == 0){
			showLoginPanel();

		}else{
			showMainPanel();
			customerid = parseInt(cid);
			socket = io.connect("http://localhost:2012");
			socket.on("connect", function(d){
					listenToServer();
			});
		}
	});

	$("#formulario").submit(function(event){
		event.preventDefault();
		var loginCred = new Object();
		loginCred.username = $("#usr").val();
		loginCred.password = $("#pwd").val();

		$.post("/login", loginCred, function(cid){
			socket = io.connect("http://localhost:2012");
			console.log(" el customerid de este usuario es "+cid);
			customerid = parseInt(cid);
			socket.on("connect", function(d){
					listenToServer();
			});
				showMainPanel();
		});

	});
	$("#adminForm").submit(function(event){
		event.preventDefault();
		var admin = new Admin();
		admin.name = $("#aname").val();
		admin.surname = $("#asurn").val();
		admin.username = $("#ausername").val();
		admin.passwd = $("#apass").val();
		admin.email = $("#aemail").val();
		admin.phone = $("#aphone").val();
		admin.address = $("#aaddr").val();
		admin.customerid = customerid;
		socket.emit("saveAdminUser",admin,function(data){
				console.log(data);
		});
	});

	$("#branchForm").submit(function(event){
		event.preventDefault();
		//b.name,b.phone,b.address,b.email,b.customerid
		var branch = new Branch();
		branch.name = $("#bname").val();
		branch.surname = $("#bsurn").val();
		branch.email = $("#bemail").val();
		branch.phone = $("#bphone").val();
		branch.address = $("#baddress").val();
		branch.customerid = customerid;

		socket.emit("saveBranch",branch,function(data){
			console.log(data);
		});

	});
	
	$("#empForm").submit(function(event){
		event.preventDefault();
		var employee = new Employee();
		employee.name = $("#ename").val();
		employee.surname = $("#esurname").val();
		employee.email = $("#eemail").val();
		employee.phone = $("#ephone").val();
		employee.address = $("#eaddress").val();
		employee.customerid = customerid;

		socket.emit("saveEmployee",function(data){
			console.log(data);
		});
	});


	$("#logout").click(function(event){
		event.preventDefault();
		$.get("/logout", function(resp){
			console.log("mensaje del server "+resp);

			showLoginPanel();
		});

	});
	$("#adm").click(function(event){
		event.preventDefault();
		changeActivePill();
				$("#admpill").addClass("active");

		showAdminPanel();
	});
	$("#suc").click(function(event){
		event.preventDefault();
		changeActivePill();
		$("#sucpill").addClass("active");

		showBranchPanel();
	});
	$("#app").click(function(event){
		event.preventDefault();
		changeActivePill();
				$("#apppill").addClass("active");

		showAppPanel();
	});
	$("#emp").click(function(event){
		event.preventDefault();
		changeActivePill();
				$("#emppill").addClass("active");

		
		showEmployeePanel();
	});
	$("#rep").click(function(event){
		event.preventDefault();
		changeActivePill();
				$("#reppill").addClass("active");

		
	});
	$("#pag").click(function(event){
		event.preventDefault();
		changeActivePill();
				$("#pagpill").addClass("active");

		
	});
});



function showMainPanel(){
	$("#formulario").fadeOut("fast", function(){
		$("#logout").fadeIn("fast");
		$("#mainPanel").fadeIn("fast");
		showAdminPanel();
	});
};

function showAdminPanel(){
	hideAllPanels(function(){
			$("#adminPan").fadeIn("fast");

	});
};

function showBranchPanel(){
	hideAllPanels(function(){
			$("#branchPan").fadeIn("fast");

	});
};

function showEmployeePanel(){
	hideAllPanels(function(){
			$("#employeePan").fadeIn("fast");

	});
};

function showAppPanel(){
	hideAllPanels(function(){
			$("#appPan").fadeIn("fast");

	});
};

function hideAllPanels(callback){
	$("#adminPan").fadeOut("fast",function(){
			$("#branchPan").fadeOut("fast",function(){
				$("#employeePan").fadeOut("fast",function(){
					$("#appPan").fadeOut("fast",function(){
						callback();
					});
				});
			});
	});

}

function changeActivePill(){
	$("#menu li ").removeClass("active");
}

function showLoginPanel(){
	$("#mainPanel").fadeOut("fast", function(){
		$("#logout").fadeOut("fast");
		$("#formulario").fadeIn("fast");
	});
};

  function doCheckin(employee) {
    var canvas = $("#cuadro")[0];
    canvas.width = video.getAttribute("width");
    canvas.height = video.getAttribute("height");
    canvas.getContext('2d').drawImage(video, 0, 0, video.getAttribute("width"), video.getAttribute("height"));
    var data = canvas.toDataURL('image/png');
    performCheckin(data,employee);
  }


  function doCheckout(employee) {
    var canvas = $("#cuadro")[0];
    canvas.width = video.getAttribute("width");
    canvas.height = video.getAttribute("height");
    canvas.getContext('2d').drawImage(video, 0, 0, video.getAttribute("width"), video.getAttribute("height"));
    var data = canvas.toDataURL('image/png');
    performCheckout(data,employee);

  }

function listenToServer(){
	socket.on("syncFromServer",function(response){
		console.log(response);
	});	
	socket.on("generatedCheckin",function(data){
					console.log(data);

	});
	socket.on("generatedCheckout",function(data){
				console.log(data);

	});
	socket.on("generatedAdminUser",function(data){
				console.log(data);

	});
	socket.on("generatedEmployee",function(data){
				console.log(data);

	});
	socket.on("generatedBranch",function(data){
				console.log(data);

	});
	socket.on("generatedBranchesPerAdmin",function(data){
				console.log(data);

	});

}