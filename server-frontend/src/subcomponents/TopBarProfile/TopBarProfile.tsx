import { UserInfo } from "../../types/UserInfoType";
import "./TopBarProfile.css";

function TopBarProfile(props: { role: string, name: string }) {
  return(
    <>
      <div className="top-bar-profile-container">
        <p className="top-bar-profile-message">You are speaking with {props.role} {props.name}</p>
      </div>
    </>
  )
}

export default TopBarProfile;