import {writeToLogFile} from "./logwriter.js";
import {loadUserData} from "./loaddata.js";
import {errToLogFile} from "./errwriter.js";

export async function user_inform(id){
    let result = { limit: null, count: null };
    try{
        await writeToLogFile(`User: ${id} ask info `);
        const usersData = await loadUserData();
        result.count = usersData[id].messageCount;
        result.limit = usersData[id].messageLimit;
    }catch (e) {
        await errToLogFile(`ERROR WHILE  GET INFO: {
        User: ${id} 
        ERROR: ${e} , 
        FILE: get_userinfo.js}`);
    }
    return result
}