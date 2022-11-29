"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_diagnosis_1 = require("./message_diagnosis/message-diagnosis");
const message = "I AM FEELING ANXIOUS";
console.log((0, message_diagnosis_1.createMessageDiagnosis)(message));
// console.log(createWordRatingListFromDictionaryJson())
// console.log(finaliseTokens(tokenizeMessage(message), createWordRatingListFromDictionaryJson(), message));
// console.log(calculateMessageScore(finaliseTokens(tokenizeMessage(message), createWordRatingListFromDictionaryJson(), message)));
