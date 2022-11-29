import React from "react";
import HoverProfile from "../../components/HoverProfile/HoverProfile";
import Timestamp from "../../subcomponents/Timestamp/Timestamp";
import HoverCommentContent from "../../subcomponents/HoverCommentContent/HoverCommentContent";
import "./HoverComment.css";
import { HoverCommentProps } from "../../types/PropTypes";

function HoverComment(props: HoverCommentProps){

    return(
        <>
            <div className="hover-comment-container">
                <div className="hover-comment-metadata">
                    <div className="hover-comment-profile">
                        <HoverProfile />
                    </div>
                    <div className="hover-comment-timestamp">
                        <Timestamp time={props.timestamp} />
                    </div>
                </div>

                <div className="hover-comment-content">
                    <HoverCommentContent comment={props.comment} />
                </div>
            </div>
        </>
    )

}

export default HoverComment;
