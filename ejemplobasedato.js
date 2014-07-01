var mysql = require("mysql");// esta linea sola se necesita para levantar la libreria


var db = mysql.createConnection({ //con esta funcion instancias la conexion
    host: "localhost",
    user: "1",
    password:"1",
    database: "mibd"
});



db.connect(function(err){//esta funcion se encarga de escrib en el log cualq msj de error al intentar conectar con la bd
	if(err){
		console.log(err);
	}
});


function getArticles(){//aca hacemos una query a la bd usando el objeto db
//obtiene todo los articulos de la empresa 002
db.query("SELECT codigoarticulo, imagen1, descripcion, existencia, preciopublico  FROM articulos where "+
	"codigoempresa = 2 and activo= 1 "+
 " and descripcion not like 'PRUEBA'", function(err, result){
//esta es la funcion que se llama una vez que se tienen listos los result de la bd (la famosa callback)
 	if(!err){
 		console.log(result);//te muestra por consola el result de la query

 	}else{
 		console.log("error "+err); 	
 	}
 });
};


