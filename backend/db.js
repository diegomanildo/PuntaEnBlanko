import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "punta_en_blanco",
  charset: 'utf8mb4',
});

db.connect((err)=>{
  if(err){
    console.log("Error MySQL", err);
  } else {
    console.log("MySQL conectado");
  }
});

export default db;