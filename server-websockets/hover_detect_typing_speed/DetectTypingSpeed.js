"use strict";
// DetectTypingSpeed.ts by Matt Dixon
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectTypingSpeed = exports.flagTypingSpeed = void 0;
function flagTypingSpeed(currTypingSpeed, newTypingSpeed, messages) {
    let final = { message: "", anx_score: 0, speed: 0 };
    if (currTypingSpeed == 0) {
        final.speed = newTypingSpeed;
    }
    else {
        // Get amount of messages sent by the client
        let messagesSent = 0;
        messages.forEach(message => {
            if (JSON.parse(JSON.parse(message).content).author.role == "patient") { // TODO: Check to make sure this is not null
                messagesSent++;
            }
        });
        // Get avg typing speed
        const avgTypingSpeed = (currTypingSpeed / messagesSent);
        // Calculate % increase/ decrease in typing speed
        // var difference = ( (newTypingSpeed - avgTypingSpeed) / avgTypingSpeed ) * 100;
        var difference = ((newTypingSpeed - avgTypingSpeed) / avgTypingSpeed);
        // Add to anxiety score based on typing speed difference
        if (Math.abs(difference) >= 10 && Math.abs(difference) <= 19) {
            final.anx_score = 1;
        }
        else if (Math.abs(difference) >= 20 && Math.abs(difference) <= 29) {
            final.anx_score = 2;
        }
        else if (Math.abs(difference) >= 30 && Math.abs(difference) <= 39) {
            final.anx_score = 3;
        }
        else if (Math.abs(difference) >= 40 && Math.abs(difference) <= 49) {
            final.anx_score = 4;
        }
        else if (Math.abs(difference) >= 50) {
            final.anx_score = 5;
        }
        // Print message based on typing speed difference
        if (Math.abs(difference) >= 10) {
            if (difference > 0) {
                final.message = "Patient is typing " + difference.toFixed(2) + "% faster than normal. ";
            }
            else {
                final.message = "Patient is typing " + Math.abs(difference).toFixed(2) + "% slower than normal. ";
            }
        }
        final.speed = (currTypingSpeed + newTypingSpeed);
    }
    return final;
}
exports.flagTypingSpeed = flagTypingSpeed;
function detectTypingSpeed(prevMessage, currMessage) {
    // Calculate the time in milliseconds difference between the latestMessage and nextLatestMessage
    let secondsBetweenTwoDate = Math.abs((new Date(currMessage.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) / 1000);
    // Calculate characters per millisecond
    let typingSpeedSec = currMessage.content.length / secondsBetweenTwoDate;
    console.log("Current typing speed:", typingSpeedSec); // TODO: Check what the typing speed is
    return Math.round(typingSpeedSec * 100) / 100;
}
exports.detectTypingSpeed = detectTypingSpeed;
