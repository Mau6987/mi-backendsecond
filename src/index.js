import app from "./app.js";
import { bd } from "./database/database.js";
async function main(){
    try{
        await bd.sync();
        app.listen(3000);
        console.log("server esta levantado en http://localhost:3000");
    }catch(error){
        console.log("error al conectar con la base de datos", error);
    } 
}
main();