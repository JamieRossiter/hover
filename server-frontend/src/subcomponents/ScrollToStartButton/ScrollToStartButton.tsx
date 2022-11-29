import React from "react";
import { ScrollToStartButtonProps } from "../../types/PropTypes";
import "./ScrollToStartButton.css";

function ScrollToStartButton(props: ScrollToStartButtonProps): JSX.Element {

    return(
        <>
            <div className="scroll-tostart-button-container">
                <button onClick={() => props.onPress()}>
                    <img src="./res/recent_msgs.svg" alt="Snap to latest message" />
                </button>
            </div>
        </>
    )

}

export default ScrollToStartButton;