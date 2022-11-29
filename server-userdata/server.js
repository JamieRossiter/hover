"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var http = require("http");
// import mysql = require("mysql2");
var Pool = require("pg").Pool;
var port = 5050;
var server = http.createServer();
// Testing credentials
var pool = new Pool({
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
pool.connect(function (error) {
    if (error)
        console.error("Error postgres connection", error);
});
server.on("request", function (req, res) {
    var headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    };
    // Process incoming requests by stringifying Buffer chunks
    var body = [];
    if (req.method === "OPTIONS") {
        res.writeHead(204, headers);
        res.end();
        return;
    }
    req.on("data", function (chunk) {
        body.push(chunk);
    }).on("end", function () {
        // Generate a response through handling of incoming request 
        handleIncomingRequest(Buffer.concat(body).toString()).then(function (handledRequest) {
            console.log(handledRequest);
            res.writeHead(handledRequest.code, headers);
            res.end(JSON.stringify(handledRequest));
            return;
        });
    });
});
function handleIncomingRequest(body) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log(body);
            // Wrap logic in a promise to handle MySQL query
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var bodyObj;
                    try {
                        bodyObj = JSON.parse(body);
                    }
                    catch (_a) {
                        bodyObj = { email: body };
                    }
                    // Handle patient and facilitator update validation
                    if (isBodyValidForUpdating(bodyObj)) {
                        var session_1 = [];
                        // session[0]: facilitator_email
                        // session[1]: patient_email
                        // session[2]: dpr_score
                        // session[3]: anx_score
                        session_1[0] = bodyObj.facilitatorEmail;
                        session_1[1] = bodyObj.patientEmail;
                        session_1[2] = bodyObj.dprScore;
                        session_1[3] = bodyObj.anxScore;
                        updatePatient(session_1)
                            .then(function (updatedPatientScore) {
                            updateFacilitator(session_1, updatedPatientScore)
                                .then(function (result) {
                                if (result)
                                    resolve({ code: 200, response: true, message: "Patient and facilitator information updated successfully." });
                                else
                                    resolve({ code: 500, response: false, message: "Updating patient and facilitator information failed." });
                            })["catch"](function (err) {
                                console.error("Update facilitator error", err);
                                resolve({ code: 500, response: false, message: err.toString() });
                            });
                        })["catch"](function (err) {
                            console.error("Update patient error", err);
                            resolve({ code: 500, response: false, message: err.toString() });
                        });
                        return;
                    }
                    // Handle user data validation
                    if (bodyContainsParameters(bodyObj)) {
                        if (isBodyValidForPatient(bodyObj)) {
                            var validatedBody = validateBody(bodyObj);
                            if (validatedBody.isValid) {
                                // Compare submitted data to database to see if user already exists
                                checkForDbMatch(bodyObj)
                                    .then(function (match) {
                                    if (!match) {
                                        // Insert user into database if no user is present in the database
                                        insertIntoDb(bodyObj)
                                            .then(function (result) {
                                            if (result) {
                                                resolve({ code: 200, response: true, message: "No existing user found. New user entered into database." });
                                            }
                                        })["catch"](function (err) {
                                            resolve({ code: 500, response: true, message: err.toString() });
                                        });
                                    }
                                    else {
                                        resolve({ code: 200, response: true, message: "Existing user found." });
                                    }
                                })["catch"](function (err) {
                                    resolve({ code: 500, response: false, message: err.toString() });
                                });
                            }
                            else {
                                resolve({ code: 400, response: false, message: validatedBody.errorMsg });
                            }
                        }
                        if (isBodyValidForFacilitator(bodyObj)) {
                            var isEmailValid = validateEmail(bodyObj.email);
                            if (isEmailValid) {
                                checkForDbMatch(bodyObj).then(function (match) {
                                    if (!match) {
                                        resolve({ code: 404, response: false, message: "No existing user found. Please try again with a different email address." });
                                    }
                                    else {
                                        getFacilitatorDetailsFromDb(bodyObj).then(function (details) {
                                            resolve({ code: 200, response: JSON.stringify(details), message: "Existing user found." });
                                        });
                                    }
                                });
                            }
                        }
                    }
                    else {
                        resolve({ code: 400, response: false, message: "Provided body is invalid. Body requires 'name', 'phone', 'email' and 'role' keys." });
                    }
                })];
        });
    });
}
function checkForDbMatch(user) {
    return __awaiter(this, void 0, void 0, function () {
        var query;
        return __generator(this, function (_a) {
            query = isBodyValidForFacilitator(user) ? "SELECT email FROM users WHERE email = '".concat(user.email, "' AND is_patient = FALSE") : "SELECT email FROM users WHERE email = '".concat(user.email, "'");
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    pool.query(query, function (err, result) {
                        if (err) {
                            console.error("User table select error", err);
                            reject(false);
                        }
                        if (result.rows.length > 0) {
                            resolve(true); // Resolve the promise to "true" if the DB check yields results
                        }
                        else {
                            resolve(false); // Resolve the promise to "false" if the DB check yields no results
                        }
                    });
                })];
        });
    });
}
function insertIntoDb(user) {
    return __awaiter(this, void 0, void 0, function () {
        var isPatient;
        return __generator(this, function (_a) {
            isPatient = user.role === "patient";
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    pool.query("INSERT INTO users (is_patient, name, email, phone_no) VALUES (".concat(isPatient, ", '").concat(user.name, "', '").concat(user.email, "', '").concat(user.phone, "')"), function (err, result) {
                        if (err) {
                            console.error("User table insert error", err);
                            reject(false);
                        }
                        pool.query("INSERT INTO patient (email, dpr_score, anx_score, risk_score) VALUES ('".concat(user.email, "', 0, 0, 0)"), function (err, result) {
                            if (err) {
                                console.error("Patient table insert error", err);
                                reject(false);
                            }
                            resolve(true);
                        });
                    });
                })];
        });
    });
}
function getFacilitatorDetailsFromDb(user) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    pool.query("SELECT name, email, img, is_patient FROM users WHERE email = '".concat(user.email, "'"), function (err, result) {
                        if (err) {
                            console.error("User table select error facilitator name", err);
                            reject(err);
                        }
                        resolve(result.rows);
                    });
                })];
        });
    });
}
function bodyContainsParameters(body) {
    return ("name" in body ||
        "phone" in body ||
        "email" in body ||
        "role" in body);
}
function isBodyValidForPatient(body) {
    return ("name" in body &&
        "phone" in body &&
        "email" in body &&
        "role" in body);
}
function isBodyValidForFacilitator(body) {
    return ("email" in body &&
        !("name" in body) &&
        !("phone" in body) &&
        !("role" in body));
}
function validateBody(body) {
    var errorMsg = "";
    var isValid = true;
    // Validate name
    var maxCharacters = 20;
    var minCharacters = 5;
    if (body.name > maxCharacters) {
        errorMsg += "Username contains too many characters.\n";
    }
    else if (body.name < minCharacters) {
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
    if (!validateEmail(body.email)) {
        errorMsg += "Email is not valid.\n";
    }
    // Validate role
    var validRoles = ["facilitator", "patient"];
    if (!validRoles.includes(body.role)) {
        errorMsg += "Role is not valid. Must be 'facilitator' or 'patient'.\n";
    }
    // Final validation
    if (errorMsg.length > 0)
        isValid = false;
    return { isValid: isValid, errorMsg: errorMsg };
}
function validateEmail(email) {
    var emailRegex = /@/;
    return emailRegex.test(email);
}
function isBodyValidForUpdating(body) {
    return ("facilitatorEmail" in body &&
        "patientEmail" in body &&
        "dprScore" in body &&
        "anxScore" in body);
}
function updatePatient(session) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var updatedScore = [];
                    // updatedScore[0]: final dpr_score
                    // updatedScore[1]: final anx_score
                    // SQL statements to get the current user scores from the DB
                    var getDprScore = "SELECT dpr_score FROM patient WHERE email = '".concat(session[1], "'");
                    var getAnxScore = "SELECT anx_score FROM patient WHERE email = '".concat(session[1], "'");
                    pool.query(getDprScore, function (err, result) {
                        if (err) {
                            console.error("GetDprScore Error", err);
                            reject(err);
                            return;
                        }
                        console.log("Update patient depression result", result.rows);
                        updatedScore.push(result.rows[0].dpr_score + parseInt(session[2])); // Take average of the stored and current anx_scores
                        pool.query(getAnxScore, function (err, result) {
                            if (err) {
                                console.error("GetAnxScore Error", err);
                                reject(err);
                                return;
                            }
                            console.log("Update patient anxiety result", result.rows);
                            updatedScore.push(result.rows[0].anx_score + parseInt(session[3])); // Take average of the stored and current anx_scores
                            // Update the patients scores
                            var updateScores = "UPDATE patient SET dpr_score = " + updatedScore[0] + ", anx_score = " + updatedScore[1] + " WHERE email = " + "'".concat(session[1], "'");
                            pool.query(updateScores, function (err, result) {
                                if (err) {
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
                        });
                    });
                })];
        });
    });
}
function updateFacilitator(session, updatedScore) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            /*
                NEED TO CHANGE THIS CODE
        
                Original implementation was to only update the session count
                if the clients overall score was greater than 3 out of 5
        
                Change to get avg score. Will be able to get a better understanding
                of what thresholds to use following testing. Can base it off
                Facilitator Suggestion thresholds. Confirm with Alan
            */
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    // Add to dpr_client_count if the score is greater or equal to 3
                    if (parseInt(updatedScore[0]) >= 3) {
                        // SQL script to add 1 to the current dpr_client_count
                        var addDprClient = "UPDATE facilitator SET dpr_client_count = (SELECT dpr_client_count FROM facilitator WHERE email = " + "'".concat(session[0], "'") + ") + 1 WHERE email = " + "'".concat(session[0], "'");
                        pool.query(addDprClient, function (err, result) {
                            if (err) {
                                reject(err);
                                console.error("AddDprClient Error", err);
                            }
                            // console.log("Update facilitator: add depression patient count", result);
                            // Add to anx_client_count if the score is greater or equal to 3
                            if (parseInt(updatedScore[1]) >= 3) {
                                // SQL script to add 1 to the current anx_client_count
                                var addAnxClient = "UPDATE facilitator SET anx_client_count = (SELECT anx_client_count FROM facilitator WHERE email = " + "'".concat(session[0], "'") + ") + 1 WHERE email =" + "'".concat(session[0], "'");
                                pool.query(addAnxClient, function (err, result) {
                                    if (err) {
                                        reject(err);
                                        console.error("AddAnxClient Error", err);
                                    }
                                    // console.log("Update facilitator: add anxiety patient count", result);
                                    resolve(true); // Updating of facilitator information was successful
                                });
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }
                    else {
                        resolve(true);
                    }
                })];
        });
    });
}
console.log("Hover user data server is running on port ".concat(process.env.PORT || port));
server.listen(process.env.PORT || port);
