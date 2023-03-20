"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFacilitatorSuggestion = void 0;
function convertDprScore(score) {
    let category = 0;
    if (score >= 0.1 && score < 0.5) {
        category = 1;
    }
    else if (score >= 0.5 && score < 1) {
        category = 2;
    }
    else if (score >= 1 && score < 1.5) {
        category = 3;
    }
    else if (score >= 1.5) {
        category = 4;
    }
    return category;
}
function convertAnxScore(score) {
    let category = 0;
    if (score >= 0.2 && score < 0.6) {
        category = 1;
    }
    else if (score >= 0.6 && score < 0.8) {
        category = 2;
    }
    else if (score >= 0.8 && score < 1.2) {
        category = 3;
    }
    else if (score >= 1.2) {
        category = 4;
    }
    return category;
}
function scoreToCategory(score) {
    let category = "";
    switch (score) {
        case 1:
            category = "Mild";
            break;
        case 2:
            category = "Medium";
            break;
        case 3:
            category = "High";
            break;
        case 4:
            category = "Very High";
            break;
    }
    return category;
}
function generateFacilitatorSuggestion(suggestion_artifact) {
    let suggestion = { text: "", link: "", therapyType: "" };
    let sfbt = false;
    let cbt = false;
    let pct = false;
    let nt = false;
    let act = false;
    suggestion_artifact.first_ten;
    let rolling_anx = convertAnxScore(suggestion_artifact.rolling_anx_score);
    let prev_anx = convertAnxScore(suggestion_artifact.prev_anx_score);
    let rolling_dpr = convertDprScore(suggestion_artifact.rolling_dpr_score);
    let prev_dpr = convertDprScore(suggestion_artifact.prev_dpr_score);
    let anx_category = scoreToCategory(rolling_anx);
    let dpr_category = scoreToCategory(rolling_dpr);
    // Check conditions for appropriate theraputic model
    if (rolling_anx - prev_anx >= 2 ||
        rolling_dpr - prev_dpr >= 2) {
        sfbt = true;
    }
    if ((rolling_anx >= 2 && prev_anx >= 2) ||
        (rolling_dpr >= 2 && prev_dpr >= 2)) {
        cbt = true;
    }
    if (suggestion_artifact.first_ten.length === 10) {
        for (var i = 0; i < 10; i++) {
            // Go through each message in the array
            if (suggestion_artifact.first_ten[i].anxiety < 2 ||
                suggestion_artifact.first_ten[i].depression < 2) {
                pct = true;
            }
        }
        if (!cbt || !pct) {
            nt = true;
        }
    }
    else {
        pct = false;
        nt = false;
    }
    if (
    // Wont this potentially return 2 facilitator suggestions?
    cbt && rolling_anx > rolling_dpr) {
        act = true;
    }
    // If any conditions are met, provide the suggestion text
    if (act || nt || sfbt || cbt || pct) {
        // Provide suggestion details based on which suggestion is met
        if (act) {
            suggestion.link = "/therapeuticModel/act";
            suggestion.therapyType = "ACT";
        }
        else if (nt) {
            suggestion.link = "/therapeuticModel/nt";
            suggestion.therapyType = "NT";
        }
        else if (sfbt) {
            suggestion.link = "/therapeuticModel/sfbt";
            suggestion.therapyType = "SFBT";
        }
        else if (cbt) {
            suggestion.link = "/therapeuticModel/cbt";
            suggestion.therapyType = "CBT";
        }
        else if (pct) {
            suggestion.link = "/therapeuticModel/pct";
            suggestion.therapyType = "PCT";
        }
        if (rolling_anx === 0) {
            suggestion.text = `Client appears to be experiencing ${dpr_category} levels of depression. Consider utilising `;
        }
        else if (rolling_anx === 0) {
            suggestion.text = `Client appears to be experiencing ${anx_category} levels of anxiety. Consider utilising `;
        }
        else {
            suggestion.text = `Client appears to be experiencing ${anx_category} levels of anxiety and ${dpr_category} levels of depression. Consider utilising `;
        }
    }
    return suggestion;
}
exports.generateFacilitatorSuggestion = generateFacilitatorSuggestion;
