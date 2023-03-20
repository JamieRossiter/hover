import http = require("http");
// import mysql = require("mysql2");
const { Pool } = require("pg");
import { ServerResponse } from "./types/ServerResponseType/ServerResponseType";
import { v4 as uuidv4 } from "uuid";

const port: number = 5050;
const server: http.Server = http.createServer();

// Testing credentials
const pool: any = new Pool({
    host: "localhost",
    user: "postgres",
    password: "password",
    database: "hover_test"
});

// Postgres pool - production credentials
// const pool = new Pool({
//     connectionString: process.env.POSTGRES_URI,
//     ssl: {
//         rejectUnauthorized: false
//     }
// })


// Connect to postgres
pool.connect((error: Error) => {
    if(error) console.error("Error postgres connection", error);
})

server.on("request", (req: http.IncomingMessage, res: http.ServerResponse) => {

    const headers =  { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":  "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    };

    // Process incoming requests by stringifying Buffer chunks
    let body: Array<Buffer> = [];

    if (req.method === "OPTIONS") {
        res.writeHead(204, headers);
        res.end();
        return;
      }

    req.on("data", (chunk: Buffer) => {
       
        body.push(chunk);   

    }).on("end", () => {

        // Generate a response through handling of incoming request 
        handleIncomingRequest(Buffer.concat(body).toString()).then((handledRequest: ServerResponse) => {
            console.log(handledRequest);
            res.writeHead(handledRequest.code, headers);
            res.end(JSON.stringify(handledRequest));
            return;
        });

    })

})

async function handleIncomingRequest(body: string): Promise<ServerResponse>{

    console.log(body);

    // Wrap logic in a promise to handle MySQL query
    return new Promise((resolve, reject) => {

        let bodyObj: any;

        try {
            bodyObj = JSON.parse(body);
        } catch {
            bodyObj = { email: body };
        }

        // Handle patient and facilitator update validation
        if(isBodyValidForUpdating(bodyObj)){

            const session: Array<string> = []; 
            // session[0]: facilitator_email
            // session[1]: patient_email
            // session[2]: dpr_score
            // session[3]: anx_score

            session[0] = bodyObj.facilitatorEmail;
            session[1] = bodyObj.patientEmail;
            session[2] = bodyObj.dprScore;
            session[3] = bodyObj.anxScore;
            
            updatePatient(session)
            .then((updatedPatientScore: Array<string>) => {

                updateFacilitator(session, updatedPatientScore)
                .then((result: boolean) => {
                    if(result) resolve({code: 200, response: true, message: "Patient and facilitator information updated successfully."});
                    else resolve({code: 500, response: false, message: "Updating patient and facilitator information failed."})
                })
                .catch((err: Error) => {
                    console.error("Update facilitator error", err);
                    resolve({code: 500, response: false, message: err.toString()});
                })

            })
            .catch((err: Error) => {
                console.error("Update patient error", err);
                resolve({ code: 500, response: false, message: err.toString()})
            })

            return;
        }

        // Handle user data validation
        if(bodyContainsParameters(bodyObj)){
    
            if(isBodyValidForPatient(bodyObj)){

                const validatedBody: { isValid: boolean, errorMsg: string } = validateBody(bodyObj);
                if(validatedBody.isValid){
              
                    // Compare submitted data to database to see if user already exists
                    checkForDbMatch(bodyObj)
                    .then((match: boolean) => {

                        if(!match){

                            // Insert user into database if no user is present in the database
                            insertIntoDb(bodyObj)
                            .then((result: boolean) => {
                                if(result){
                                    resolve({code: 200, response: true, message: "No existing user found. New user entered into database."});
                                }
                            })
                            .catch((err: Error) => {
                                resolve({code: 500, response: true, message: err.toString()})
                            })

                        } else {
                            resolve({code: 200, response: true, message: "Existing user found."});
                        }

                    })
                    .catch((err: Error) => {
                        resolve({code: 500, response: false, message: err.toString()})
                    })

                } else {
                    resolve({code: 400, response: false, message: validatedBody.errorMsg});
                }
            }

            if(isBodyValidForFacilitator(bodyObj)){

                let isEmailValid: boolean = validateEmail(bodyObj.email);
                if(isEmailValid){

                    checkForDbMatch(bodyObj).then((match: boolean) => {

                        if(!match){

                            resolve({code: 404, response: false, message: "No existing user found. Please try again with a different email address."})
                        
                        } else {

                            getFacilitatorDetailsFromDb(bodyObj).then((details: any) => {
                                resolve({ code: 200, response: JSON.stringify(details), message: "Existing user found." })
                            })
                            
                        }

                    })

                }

            }

        } else {
            resolve({code: 400, response: false, message: "Provided body is invalid. Body requires 'name', 'phone', 'email' and 'role' keys."});
        }

    })
}

async function checkForDbMatch(user: any): Promise<boolean> {

    const query: string = isBodyValidForFacilitator(user) ? `SELECT email FROM users WHERE email = '${user.email}' AND is_patient = FALSE` : `SELECT email FROM users WHERE email = '${user.email}'`;

    return new Promise((resolve, reject) => {
        
        pool.query(query, (err: Error, result: any) => {

            if(err){
                console.error("User table select error", err);
                reject(false);
            }

            if(result.rows.length > 0){
                resolve(true); // Resolve the promise to "true" if the DB check yields results
            } else {
                resolve(false); // Resolve the promise to "false" if the DB check yields no results
            }
        })

    })

}

async function insertIntoDb(user: any): Promise<boolean> {

    const isPatient: boolean = user.role === "patient";

    return new Promise((resolve, reject) => {
        pool.query(`INSERT INTO users (is_patient, name, email, phone_no) VALUES (${isPatient}, '${user.name}', '${user.email}', '${user.phone}')`, (err: Error, result: any) => {

            if(err){
                console.error("User table insert error", err);
                reject(false);
            }

            pool.query(`INSERT INTO patient (email, dpr_score, anx_score, risk_score) VALUES ('${user.email}', 0, 0, 0)`, (err: Error, result: any) => {

                if(err){
                    console.error("Patient table insert error", err);
                    reject(false);
                }

                resolve(true);

            });

        })
    })

}

async function getFacilitatorDetailsFromDb(user: any): Promise<any> {

    return new Promise((resolve, reject) => {
        
        pool.query(`SELECT name, email, img, is_patient FROM users WHERE email = '${user.email}'`, (err: Error, result: any) => {

            if(err){
                console.error("User table select error facilitator name", err);
                reject(err);
            }

            resolve(result.rows);

        })

    })

}

function bodyContainsParameters(body: any): boolean {
    return (
        "name" in body ||
        "phone" in body ||
        "email" in body ||
        "role" in body
    )
}

function isBodyValidForPatient(body: any): boolean {
    return (
        "name" in body &&
        "phone" in body &&
        "email" in body &&
        "role" in body
    )
}

function isBodyValidForFacilitator(body: any): boolean {
    return (
        "email" in body &&
        !("name" in body) &&
        !("phone" in body) &&
        !("role" in body) 
    )
}

function validateBody(body: any): { isValid: boolean, errorMsg: string } {
    let errorMsg: string = "";
    let isValid = true;

    // Validate name
    const maxCharacters: number = 20;
    const minCharacters: number = 5;
    if(body.name > maxCharacters){
        errorMsg += "Username contains too many characters.\n";
    } else if (body.name < minCharacters){
        errorMsg += "Username contains too few characters.\n";
    }


    // Validate phone (handled exclusively at frontend)
    // const maxDigits: number = 10;
    // const minDigits: number = 8;
    // if(body.phone.length > maxDigits){
    //     errorMsg += "Phone number contains too many digits.\n"
    // } else if (body.phone.length < minDigits){
    //     errorMsg += "Phone number contains too few digits.\n"
    // }

    // Validate email
    if(!validateEmail(body.email)){
        errorMsg += "Email is not valid.\n";
    }

    // Validate role
    const validRoles: Array<string> = ["facilitator", "patient"];
    if(!validRoles.includes(body.role)){
        errorMsg += "Role is not valid. Must be 'facilitator' or 'patient'.\n";
    }

    // Final validation
    if(errorMsg.length > 0) isValid = false;

    return { isValid: isValid, errorMsg: errorMsg };

} 

function validateEmail(email: string): boolean {
    const emailRegex: RegExp = /@/;
    return emailRegex.test(email);
}

function isBodyValidForUpdating(body: any): boolean {
    return(
        "facilitatorEmail" in body &&
        "patientEmail" in body &&
        "dprScore" in body &&
        "anxScore" in body
    )
} 

async function updatePatient(session: Array<string>): Promise<Array<string>>{

    return new Promise((resolve, reject) => {
        
        const updatedScore: Array<string> = [];
        // updatedScore[0]: final dpr_score
        // updatedScore[1]: final anx_score

        // SQL statements to get the current user scores from the DB
        var getDprScore = `SELECT dpr_score FROM patient WHERE email = '${session[1]}'`;
        var getAnxScore = `SELECT anx_score FROM patient WHERE email = '${session[1]}'`;

        pool.query(getDprScore, function (err: any, result: any) { // Executing the query to get dpr_score (callback hell incoming)
            
            if (err){
                console.error("GetDprScore Error", err);
                reject(err);
                return;
            }
            console.log("Update patient depression result", result.rows);
            updatedScore.push(result.rows[0].dpr_score + parseInt(session[2])) // Take average of the stored and current anx_scores

            pool.query(getAnxScore, function (err: any, result: any) { // Executing the query to get anx_score

                if (err){
                    console.error("GetAnxScore Error", err);
                    reject(err); 
                    return;
                }

                console.log("Update patient anxiety result", result.rows);
                updatedScore.push(result.rows[0].anx_score + parseInt(session[3])); // Take average of the stored and current anx_scores

                // Update the patients scores
                var updateScores = "UPDATE patient SET dpr_score = " + updatedScore[0] + ", anx_score = " + updatedScore[1] + " WHERE email = " + `'${session[1]}'`;
                pool.query(updateScores, function (err: any, result: any) {
                    
                    if (err){
                        console.error("Update patient Error", err);
                        reject(err);
                        return;
                    }
                    // console.log("Update patient scores result", result);
                });  

                // Return the updated values as they will be reused in updateFacilitator
                console.log("Updated score", updatedScore);
                resolve(updatedScore);
                console.log("resolved");

            })

        })
    })
}

async function updateFacilitator(session: Array<string>, updatedScore: Array<string>): Promise<boolean> {
    /*
        NEED TO CHANGE THIS CODE

        Original implementation was to only update the session count
        if the clients overall score was greater than 3 out of 5

        Change to get avg score. Will be able to get a better understanding
        of what thresholds to use following testing. Can base it off 
        Facilitator Suggestion thresholds. Confirm with Alan
    */
    return new Promise((resolve, reject) => {

        // Add to dpr_client_count if the score is greater or equal to 3
        if(parseInt(updatedScore[0]) >= 3){
            // SQL script to add 1 to the current dpr_client_count
            var addDprClient = "UPDATE facilitator SET dpr_client_count = (SELECT dpr_client_count FROM facilitator WHERE email = " + `'${session[0]}'` + ") + 1 WHERE email = " + `'${session[0]}'`;

            pool.query(addDprClient, function (err: any, result: any) {
                if (err){
                    reject(err);
                    console.error("AddDprClient Error", err);
                }
                // console.log("Update facilitator: add depression patient count", result);

                // Add to anx_client_count if the score is greater or equal to 3
                if(parseInt(updatedScore[1]) >= 3){

                    // SQL script to add 1 to the current anx_client_count
                    var addAnxClient = "UPDATE facilitator SET anx_client_count = (SELECT anx_client_count FROM facilitator WHERE email = " + `'${session[0]}'` + ") + 1 WHERE email =" + `'${session[0]}'`;
                    pool.query(addAnxClient, function (err: any, result: any) {
                        if (err){
                            reject(err);
                            console.error("AddAnxClient Error", err);
                        }
                        // console.log("Update facilitator: add anxiety patient count", result);
                        
                        resolve(true); // Updating of facilitator information was successful
                    });

                } else {
                    resolve(true);
                }
            });
        } else {
            resolve(true);
        }

    })
}

console.log(`Hover user data server is running on port ${process.env.PORT || port}`);
server.listen(process.env.PORT || port);

