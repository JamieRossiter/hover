"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTranscript = void 0;
const fs = __importStar(require("fs"));
const storage_blob_1 = require("@azure/storage-blob");
function generateTranscript(messageHistory) {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}${currentDate.getMilliseconds()}`;
    const fileName = `./hover_transcript_generator/transcript_outputs/transcript_${formattedDate}.csv`;
    // Create file
    fs.writeFile(fileName, "", (err) => {
        if (err)
            console.error(err);
    });
    const transcriptStream = fs.createWriteStream(fileName, {
        flags: "a"
    });
    transcriptStream.write("author, role, dateSent, message, hoverComment, anxietyScore, depressionScore, riskFlag\n");
    messageHistory.forEach((msg) => {
        const line = `${msg.author}, ${msg.role}, ${msg.dateSent}, ${msg.messageContent}, ${msg.hoverComment}, ${msg.messageScore.anxiety}, ${msg.messageScore.depression}, ${msg.messageScore.risk}\n`;
        transcriptStream.write(line);
    });
    transcriptStream.end();
    // Save transcript to Azure Blob storage
    saveTranscriptToWebStorage(fileName, `transcript_${formattedDate}.csv`).catch((error) => {
        console.error("Transcript saving:" + error);
    });
}
exports.generateTranscript = generateTranscript;
function saveTranscriptToWebStorage(filePath, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
        // Container access
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        fs.readFile(filePath, (err, data) => __awaiter(this, void 0, void 0, function* () {
            // Blob creation
            const contents = data.toString();
            const containerClient = blobServiceClient.getContainerClient("hovertranscripts");
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);
            // Blob upload
            const uploadResponse = yield blockBlobClient.upload(contents, Buffer.byteLength(contents));
            if (uploadResponse)
                console.log(`Chat transcript saved to storage with request id: ${uploadResponse.requestId}`);
        }));
    });
}
