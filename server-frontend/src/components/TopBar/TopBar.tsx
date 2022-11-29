import Logo from "../../subcomponents/TopBarLogo/TopBarLogo";
import TopBarProfile from "../../subcomponents/TopBarProfile/TopBarProfile";
import Button from "../../subcomponents/Button/Button";
import "./TopBar.css";
import { TopBarProfileProps } from "../../types/PropTypes";

function TopBar(props: TopBarProfileProps){

    function endChatSession(): void {
        if(window.confirm(`Are you sure you want to end your chat session with ${props.name}?`)) window.location.assign("/");
    }

    return(
        <>
            <div className="top-bar-container">
                <div className="top-bar-logo-container">
                    <Logo />
                </div>
                <div className="top-bar-topbar-profile-container">
                    <TopBarProfile role={props.role} name={props.name}/>
                </div>
                <div className="top-bar-button-container">
                    <Button disabled={false} type="negative" onSend={() => { endChatSession() }} value="LEAVE CHAT" />
                </div>
            </div>
        </>
    )
}

export default TopBar;