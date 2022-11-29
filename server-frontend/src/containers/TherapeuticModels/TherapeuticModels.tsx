import React from 'react';
import { useParams, Params } from "react-router-dom";
import "./TherapeuticModel.css";

type Model = {
    key: string,
    title: string,
    description: Array<string>,
    points: Array<string>
}

export function TherapeuticModels(): JSX.Element {

    const params: Readonly<Params<string>> = useParams(); // model
    const [modelData, setModelData] = React.useState<Model>({key: "", title: "", description: [], points: []});
    
    React.useEffect(() => {
        
        if(params.model){
            fetch("../../therapy_types.json", {headers: { 'Content-Type': 'application/json' }},) // therapy_types.json lives in the public folder, which is at the "/" level of the app
            .then((resp: any) => {
                return resp.json();
            })
            .then((data: any) => {
                const model: Model = data["TherapyTypes"].find((type: Model) => {
                    return type.key === params.model;
                })
                setModelData(model);
            })
        }

    }, [])
   
    return (
        <>
        <div>
            <header className="therapeutic-model-header">
                <img src="../res/logo_placeholder_white.png" alt="Logo" className="therapeutic-model-header-logo" />
            </header>
            <div className="welcome">
                {
                    <Model params={{modelName: modelData.title, modelDescription: modelData.description, modelPoints: modelData.points}} />
                }
            </div>
        </div>
        </>
    );
}

export function Model(props: {params: { modelName: string, modelDescription: Array<string>, modelPoints: Array<string> }}): JSX.Element {

    function createList(arr: Array<string>): Array<JSX.Element> {
        return arr.map((el: string, index: number) => <li key={index}>{el}</li>)
    }
    
    return(
        <div className="therapeutic-model-container">
            <h1>{props.params.modelName}</h1>
            <h2>Info</h2>
            <ul>
                {createList(props.params.modelDescription)}
            </ul>
            <h2>Therapeutic Techniques</h2>
            <ul>
                {createList(props.params.modelPoints)}
            </ul>
        </div>
    )

}
