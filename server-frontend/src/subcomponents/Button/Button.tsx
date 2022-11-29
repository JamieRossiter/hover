import { ButtonProps } from "../../types/PropTypes"
import "./Button.css";


function Button(props: ButtonProps) {
        
    return(
        <>
            <div className="button-container">
                <button disabled={props.disabled} type="submit" className={`button-${props.type}-button`} onClick={()=> { props.onSend() }}>{props.value}</button>
            </div>
        </>
    );
}

export default Button;