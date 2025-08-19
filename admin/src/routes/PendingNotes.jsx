import { useEffect } from "react";
import {dbConnection} from "../../../mongo/MongoClient";
import {Notes} from "../../../mongo/models/Notes";
export default function PendingNotes(){
    useEffect(()=>{
        dbConnection();
        const getNotes = async()=>{
            const data = await 
        }   
        getNotes();
    })
    return(
        <div>
            <button
                onClick={handleClick}
            >View Pending Notes</button>
        </div>
    )
}