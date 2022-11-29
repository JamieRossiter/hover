import React from "react";
import "./HoverCommentContent.css";
import DOMPurify from "dompurify";
import { HoverCommentContentProps } from "../../types/PropTypes";


function HoverCommentContent(props: HoverCommentContentProps){
    return(
        <>
            <div className="hover-comment-content-container" dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(props.comment, {ADD_ATTR: ["href", "alt", "target"]})
            }}></div>
        </>
    )
}

export default HoverCommentContent;