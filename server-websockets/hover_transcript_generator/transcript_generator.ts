import * as fs from "fs";
import { TranscriptMessage } from "./TranscriptMessageType";
import { BlobServiceClient, ContainerClient, BlockBlobClient, BlockBlobUploadResponse } from "@azure/storage-blob";

export function generateTranscript(messageHistory: Array<TranscriptMessage>): void{

    const currentDate: Date = new Date();
    const formattedDate: string = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}${currentDate.getMilliseconds()}`;

    const fileName: string = `./hover_transcript_generator/transcript_outputs/transcript_${formattedDate}.csv`;
    
    // Create file
    fs.writeFile(fileName, "", (err: NodeJS.ErrnoException | null) => {
        if(err) console.error(err);
    })
    const transcriptStream: fs.WriteStream = fs.createWriteStream(fileName, {
        flags: "a"
    });

    transcriptStream.write("author, role, dateSent, message, hoverComment, anxietyScore, depressionScore, riskFlag\n");

    messageHistory.forEach((msg: TranscriptMessage) => {

        const line: string = `${msg.author}, ${msg.role}, ${msg.dateSent}, ${msg.messageContent}, ${msg.hoverComment}, ${msg.messageScore.anxiety}, ${msg.messageScore.depression}, ${msg.messageScore.risk}\n`;
        transcriptStream.write(line);

    })

    transcriptStream.end();

    // Save transcript to Azure Blob storage
    saveTranscriptToWebStorage(fileName, `transcript_${formattedDate}.csv`).catch((error) => {
        console.error("Transcript saving:" + error);
    })

}

async function saveTranscriptToWebStorage(filePath: string, fileName: string): Promise<void>{

    const connectionString: string = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

    // Container access
    const blobServiceClient: BlobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    fs.readFile(filePath, async (err, data: Buffer) => {

        // Blob creation
        const contents: string = data.toString();
        const containerClient: ContainerClient = blobServiceClient.getContainerClient("hovertranscripts");
        const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(fileName);

        // Blob upload
        const uploadResponse: BlockBlobUploadResponse = await blockBlobClient.upload(contents, Buffer.byteLength(contents));
        if(uploadResponse) console.log(`Chat transcript saved to storage with request id: ${uploadResponse.requestId}`);

    })

}