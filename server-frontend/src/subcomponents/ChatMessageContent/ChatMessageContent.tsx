import React, { useEffect } from "react";
import DOMPurify from "dompurify";
import { Keyword } from "../../types/KeywordType";
import "./ChatMessageContent.css";
import { ChatMessageContentProps } from "../../types/PropTypes";
import ReactTooltip from "react-tooltip";

type HoveredKeywordData = {
    keyword: string | null,
    flag: string | null
}

function ChatMessageContent(props: ChatMessageContentProps){
        
    // Handle user hovering mouse over Keyword
    function onKeywordHover(e: any) : void {
        
        // Filter the parent <p> element from any processing. Target <span> elements only
        if(e.target.nodeName.toLowerCase() === "span"){

            const keyword: string = e.target.textContent;
            const flag: string = e.target.className.split("chat-message-content-highlight-")[1];
            const data: HoveredKeywordData = { keyword: keyword, flag: flag };

        }

    }

    // Takes the original message, then formats it with <span> tags to highlight particular keywords
    function processKeywords(message: string, keywords: Array<Keyword>) : string {
        
        let formattedMessage: string = message;

        if(keywords){
            keywords.forEach((kw: Keyword) => {

                console.log("Keyword", kw);
            
                // Iterate through each position of the word in case there are duplicates within the message
                if(kw.position){
                    kw.position.forEach(pos => {
    
                        const splitMessage: Array<string> = formattedMessage.split(" ");
                        const targetKeyword: string = splitMessage[pos]; // Find the keyword based on its position in the array
                        const spannedKeyword: string = `<a\ndata-for="tip-${kw.flag}"\ndata-tip="keyword"><span\nclass="chat-message-content-highlight-${kw.flag}">${targetKeyword}</span></a>` // Add span tags to targeted keyword, use a line break instead of a whitespace to avoid span tag being split by whitespace
    
                        splitMessage[pos] = spannedKeyword; // Replace element in array with new keywords with <span> tags
                        formattedMessage = splitMessage.join(" ");
    
                    })
                }
    
            })
        }

        return formattedMessage;

    }

    return(
        <>
            <ReactTooltip id="tip-depression" effect="solid" place="top">Keyword indicates that the patient may be displaying signs of depression.</ReactTooltip>
            <ReactTooltip id="tip-anxiety" effect="solid" place="top">Keyword indicates that the patient may be displaying signs of anxiety.</ReactTooltip>
            <ReactTooltip id="tip-risk" effect="solid" place="top">Keyword indicates that the patient may be displaying signs of risk.</ReactTooltip>
            {/* Parse sanitized text as HTML, permitting the use of the "class" and "onmouseover" attribute within the generated HTML tags */}
            {props.isFacilitator && !(props.isSender)
            ? <p className={"chat-message-content-text"} dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(processKeywords(props.message, props.keywords), {ADD_ATTR: ["class", "onmouseover", "data-tip", "data-for"]})
            }} /> 
            : <p className="chat-message-context-text">{props.message}</p>
            }
    </>
    )

}

export default ChatMessageContent;