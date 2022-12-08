"use strict";
/* TODO:
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStopwords = exports.createMessageDiagnosis = void 0;
const fs = __importStar(require("fs"));
const pos = require("pos");
const lemmatize = require("wink-lemmatizer");
const synonyms = require("synonyms");
const spellchecker = require("simple-spellchecker");
const string_correctness_1 = require("../../hover_string_correctness/string-correctness");
const RepetitionAnalysis_1 = require("../../hover_repetition_analysis/RepetitionAnalysis");
// Create POS tagger, for determining if words are nouns, adjectives or verbs
const tagger = new pos.Tagger();
// Create an array (list) of words with ratings from a text file
function createWordRatingListFromDictionaryJson() {
    let file = fs.readFileSync("./hover_message_diagnosis/wordlists/dictionary.json");
    const list = JSON.parse(file.toString()).dictionary;
    return list;
}
function createWordListFromFile(filePath) {
    let file = fs.readFileSync(filePath);
    const list = file.toString("utf-8").split("\n");
    return list;
}
// Analyse the message and return a "Diagnosis" object
function createMessageDiagnosis(message, prevMessages) {
    // List of words extracted from external text files containing categories of words
    const externalWordList = createWordRatingListFromDictionaryJson();
    // console.log("External Word List", externalWordList);
    const tokenizedMessage = tokenizeMessage(message); // Split the message into indiviual "tokens" that take the form of Keyword types
    // console.log("Tokenized Message", tokenizedMessage);
    // const spellCheckedTokens: Array<Keyword> = tokenizedMessage.concat(spellCheckMessage(tokenizedMessage)); // Concatenate the tokenized message with spellcheck suggestions and perform spell check on original message (not keywords)
    // console.log("Spellchecked tokens", spellCheckedTokens);
    // const optimisedTokens: Array<Keyword> = optimiseTokens(spellCheckedTokens); // Synonymized list of keywords (no longer lemmatized)
    const finalisedTokens = finaliseTokens(tokenizedMessage, externalWordList, message); // Filter tokens based on external word lists, flag tokens with "anxiety", "depression", "risk" and assign positions of tokens based on original message
    // console.log("Finalised Tokens", finalisedTokens);
    // console.log("Calculate Message Score Result", calculateMessageScore(finalisedTokens));
    return {
        analysedMessage: message,
        keywords: finalisedTokens,
        repetition: (0, RepetitionAnalysis_1.analyseRepetition)(message, prevMessages),
        score: calculateMessageScore(finalisedTokens),
        correctness: parseFloat((0, string_correctness_1.stringCorrectness)(message))
    };
}
exports.createMessageDiagnosis = createMessageDiagnosis;
// Tokenize the message by separating it into individual words
function tokenizeMessage(message) {
    const tokenized = removeStopwords(message.toLowerCase().split(" "));
    return tokenized.map(word => {
        let token = { word: word, score: { anxiety: 0, depression: 0, risk: false }, derived: word, flag: null, position: null };
        return token;
    });
}
// Get the position of a particular token within an original message, returns an array of tuples in case of duplicate tokens
// function getTokenPositionInMessage(token: string, message: string): Array<[ number, number ]> {
//     let positions: Array<[number, number]> = []; // index 0 = start pos, index 1 = end pos
//     let index: number = message.indexOf(token);
//     while(index !== -1){
//         positions.push([index + 1, index + token.length]);
//         index = message.indexOf(token, index + 1);
//     }
//     return positions;
// }
function getTokenPositionInMessage(token, message) {
    let positions = [];
    let splitMessage = message.split(" ");
    splitMessage.forEach((word, index) => {
        if (word.toLowerCase() === token.toLowerCase())
            positions.push(index);
    });
    return positions;
}
// Remove stop words (e.g. i, you, me) from a tokenized message
function removeStopwords(tokenizedMessage) {
    const stopwordsList = createWordListFromFile("./hover_message_diagnosis/wordlists/stopwords.txt");
    return tokenizedMessage.filter(token => { return !stopwordsList.includes(token); });
}
exports.removeStopwords = removeStopwords;
// Lemmatize and synonymize all analysis words
function optimiseTokens(analysisWords) {
    // const keywordListPosForLemm: Array<[Keyword, string]> = getWordPosInKeywordList(analysisWords);
    // const keywordListLemmatized: Array<Keyword> = lemmatizeKeywordList(keywordListPosForLemm); // Lemmatize words from analysis
    const keywordListPosForSyno = getWordPosInKeywordList(analysisWords);
    const keywordListSynonymized = synonymizeKeywordList(keywordListPosForSyno); // Synonymize lemmatized analysis words
    const amalgamatedWordList = analysisWords.concat(keywordListSynonymized); // Combine the original analysis words and synonymized word list together
    const keywordListOptimised = removeDuplicatesFromKeywordList(amalgamatedWordList); // Remove duplicates
    return keywordListOptimised;
}
// Filter tokens based on word lists, flag them appropriately (anxiety, depression, risk) and assign their positions based on original message
function finaliseTokens(tokens, wordList, message) {
    let tokenFlags = [];
    tokens.forEach((tok) => {
        wordList.forEach((item) => {
            // const isScored: boolean = (item.anx_score > 0) || (item.dpr_score > 0) || (item.risk_flag != 0);
            if (item.word === tok.word)
                tokenFlags.push({ word: tok.word, score: { anxiety: item.anx_score, depression: item.dpr_score, risk: item.risk_flag ? true : false }, flag: determineWordFlag(item.anx_score, item.dpr_score, item.risk_flag), derived: tok.derived, position: getTokenPositionInMessage(tok.derived, message) });
        });
    });
    return tokenFlags;
}
function determineWordFlag(anx_score, dpr_score, risk_flag) {
    let flag = "";
    if ((anx_score > 0 || dpr_score > 0)) {
        flag = (anx_score > dpr_score) ? "anxiety" : "depression";
    }
    if (risk_flag > 0)
        flag = "risk";
    return flag;
}
// Removes all duplicates from a list/array of Keyword types
function removeDuplicatesFromKeywordList(list) {
    return list.filter((keyword, index, self) => {
        return index === self.findIndex((k) => (k.word === keyword.word && k.derived === keyword.derived));
    });
}
// Take a list of words, determine their POS (part of speech e.g. adjective, noun, verb) and lemmatize accordingly
function lemmatizeKeywordList(wordListPos) {
    const lemmatized = [];
    wordListPos.forEach(wordPos => {
        const wordPosTagInitial = getWordPosTagInitial(wordPos);
        switch (wordPosTagInitial.initial) {
            case "V" || "R": // Verb or Adverb
                lemmatized.push(lemmatize.verb(wordPosTagInitial.word));
                break;
            case "N": // Noun
                lemmatized.push(lemmatize.noun(wordPosTagInitial.word));
                break;
            case "J": // Adjective
                lemmatized.push(lemmatize.adjective(wordPosTagInitial.word));
                break;
            default:
                lemmatized.push(lemmatize.noun(wordPosTagInitial.word));
        }
    });
    return wordListPos.map((pos, index) => {
        pos[0].word = lemmatized[index];
        return pos[0];
    });
}
function getWordPosInKeywordList(list) {
    const rawWordList = list.map(item => { return item.word; }); // Extract raw words from Keyword type
    const taggedWordList = tagger.tag(rawWordList); // Tag POS
    const keywordWordList = []; // Create a tuple that holds a Keyword type and an array of strings
    list.forEach((keyword, index) => {
        keywordWordList.push([keyword, taggedWordList[index][1]]); // Push the original keyword 
    });
    return keywordWordList;
}
function getWordPosTagInitial(wordPos) {
    return {
        word: wordPos[0].word,
        initial: wordPos[1][0] // Get initial letter of tag. This will denote its status as noun, verb or adjective.
    };
}
// Take a list of lemmatized words and synonymize them
function synonymizeKeywordList(wordListPos) {
    const synonymized = [];
    wordListPos.forEach(wordPos => {
        var _a, _b, _c;
        const wordPosTagInitial = getWordPosTagInitial(wordPos);
        switch (wordPosTagInitial.initial) {
            case "V": // Verb or Adverb
                (_a = synonyms(wordPosTagInitial.word, "v")) === null || _a === void 0 ? void 0 : _a.forEach((synonym) => {
                    synonymized.push({
                        word: synonym,
                        score: { depression: 0, anxiety: 0, risk: false },
                        derived: wordPos[0].derived,
                        flag: null,
                        position: wordPos[0].position
                    });
                });
                break;
            case "N": // Noun
                (_b = synonyms(wordPosTagInitial.word, "n")) === null || _b === void 0 ? void 0 : _b.forEach((synonym) => {
                    synonymized.push({
                        word: synonym,
                        score: { depression: 0, anxiety: 0, risk: false },
                        derived: wordPos[0].derived,
                        flag: null,
                        position: wordPos[0].position
                    });
                });
                break;
            case "J": // Adjective
                (_c = synonyms(wordPosTagInitial.word, "s")) === null || _c === void 0 ? void 0 : _c.forEach((synonym) => {
                    synonymized.push({
                        word: synonym,
                        score: { depression: 0, anxiety: 0, risk: false },
                        derived: wordPos[0].derived,
                        flag: null,
                        position: wordPos[0].position
                    });
                });
                break;
        }
    });
    return synonymized;
}
// Check the originally analysed message (not keywords) for any spelling errors, then return suggestions
function spellCheckMessage(tokenizedMessage) {
    let suggestions = [];
    const dictionary = spellchecker.getDictionarySync("en-GB");
    tokenizedMessage.forEach(token => {
        if (!dictionary.spellCheck(token.word)) {
            dictionary.getSuggestions(token.word).forEach((sugg) => {
                let keyword = { word: sugg, score: { depression: 0, anxiety: 0, risk: false }, derived: token.word, flag: null, position: token.position };
                suggestions.push(keyword);
            });
        }
    });
    return suggestions;
}
function calculateMessageScore(tokens) {
    const finalScore = { anxiety: 0, depression: 0, risk: false };
    tokens.forEach((tok) => {
        finalScore.anxiety += tok.score.anxiety;
        finalScore.depression += tok.score.depression;
        finalScore.risk = tok.score.risk;
    });
    return finalScore;
}
