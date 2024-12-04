import { get_allTimestamps, process_timestamps } from "./config";

export function consolidate_data(files){
    let dataFiles = files;
    // TIMESTAMP
    process_timestamps(dataFiles);
    let allTimestamps = get_allTimestamps();

    dataFiles[0].forEach((session)=>{
        //consolidate step data:
        let consolidatedStepData = {
            hlsLightnessAVG: [],
            objectsConfAVG: [],
            step: [],
            flightPhase: [],
            error: [],
            prediction: [],
            confidence: []
        };  
        let current_hls_lightness_avg = null;
        let currentObjectsConfAVG = null;
        let currentStep = null;
        let currentFrameID = null;
        let currentError = null;
        let currentPrediction= null;
        
        // idx represents the session id
        session['data'].forEach((record, idx) => {

            if (record.seconds<0){
                return
            }

            // // Consolidate 'Lightness' data
            // if (record.hls_lightness_avg !== current_hls_lightness_avg) {
            //     // Update the endTimestamp of the previous entry if it exists
            //     if (consolidatedStepData.hlsLightnessAVG.length > 0) {
            //         consolidatedStepData.hlsLightnessAVG[consolidatedStepData.hlsLightnessAVG.length - 1].endTimestamp = record.seconds;
            //     }

            //     // Add a new entry for the current lightness average
            //     consolidatedStepData.hlsLightnessAVG.push({
            //         startTimestamp: record.seconds,
            //         endTimestamp: record.seconds,
            //         value: record.hls_lightness_avg,
            //         session_ids: [idx],
            //         frame_id:[record.frame_id]
            //     });

            //     // Update the current lightness average
            //     current_hls_lightness_avg = record.hls_lightness_avg;
            // } else {
            //     // Update the endTimestamp of the current entry
            //     let currentEntry = consolidatedStepData.hlsLightnessAVG[consolidatedStepData.hlsLightnessAVG.length - 1];
            //     currentEntry.endTimestamp = record.seconds;
            //     // Add the current index to the current entry's index array
            //     currentEntry.session_ids.push(idx);
            //     currentEntry.frame_id.push(record.frame_id);
            // }

            // // Consolidate 'Step' data. Per step
            // if (record.step !== currentStep) {
            //     if (consolidatedStepData.step.length > 0) {
            //     consolidatedStepData.step[consolidatedStepData.step.length - 1].endTimestamp = record.seconds;
            //     }
            //     consolidatedStepData.step.push({
            //     startTimestamp: record.seconds,
            //     endTimestamp: record.seconds,
            //     value: record.step,
            //     session_ids: [idx],
            //     frame_id:[record.frame_id]
            //     });
            //     currentStep = record.step;
            // } else {
            //     // Update the endTimestamp of the current entry
            //     let currentEntry = consolidatedStepData.step[consolidatedStepData.step.length - 1];
            //     currentEntry.endTimestamp = record.seconds;
            //     // Add the current index to the current entry's index array
            //     currentEntry.session_ids.push(idx);
            //     currentEntry.frame_id.push(record.frame_id);
            // }

            // Consolidate 'Step' data. Individual times
            if (record.frame_id !== currentFrameID) { //create one entrance per frame.
                if (consolidatedStepData.step.length > 0) {
                consolidatedStepData.step[consolidatedStepData.step.length - 1].endTimestamp = record.seconds;
                }
                consolidatedStepData.step.push({
                startTimestamp: record.seconds,
                endTimestamp: record.seconds,
                value: record.step,
                step_desc: record.step_desc,
                session_ids: [idx],
                frame_id:[record.frame_id]
                });
                currentFrameID = record.frame_id;
            } else {
                // Update the endTimestamp of the current entry
                let currentEntry = consolidatedStepData.step[consolidatedStepData.step.length - 1];
                currentEntry.endTimestamp = record.seconds;
                // Add the current index to the current entry's index array
                currentEntry.session_ids.push(idx);
                currentEntry.frame_id.push(record.frame_id);
            }

            // Consolidate 'Prediction' data
            if (record.objects_conf_avg !== currentObjectsConfAVG) {
                if (consolidatedStepData.objectsConfAVG.length > 0) {
                consolidatedStepData.objectsConfAVG[consolidatedStepData.objectsConfAVG.length - 1].endTimestamp = record.seconds;
                }
                consolidatedStepData.objectsConfAVG.push({
                startTimestamp: record.seconds,
                endTimestamp: record.seconds,
                value: record.objects_conf_avg
                });
                currentObjectsConfAVG = record.objects_conf_avg;
            } else {
                consolidatedStepData.objectsConfAVG[consolidatedStepData.objectsConfAVG.length - 1].endTimestamp = record.seconds;
            }

            // // Consolidate 'Step' data
            // if (record.Step !== currentStep) {
            //     if (consolidatedStepData.step.length > 0) {
            //     consolidatedStepData.step[consolidatedStepData.step.length - 1].endTimestamp = record.seconds;
            //     }
            //     consolidatedStepData.step.push({
            //     startTimestamp: record.seconds,
            //     endTimestamp: record.seconds,
            //     value: record.Step
            //     });
            //     currentStep = record.Step;
            // } else {
            //     consolidatedStepData.step[consolidatedStepData.step.length - 1].endTimestamp = record.seconds;
            // }

            // // Consolidate 'Error' data
            // if (record.Error !== currentError) {
            //     if (consolidatedStepData.error.length > 0) {
            //     consolidatedStepData.error[consolidatedStepData.error.length - 1].endTimestamp = record.seconds;
            //     }
            //     consolidatedStepData.error.push({
            //     startTimestamp: record.seconds,
            //     endTimestamp: record.seconds,
            //     value: record.Error
            //     });
            //     currentError = record.Error;
            // } else {
            //     consolidatedStepData.error[consolidatedStepData.error.length - 1].endTimestamp = record.seconds;
            // }

            // // Consolidate 'Prediction' data
            // if (record.Prediction !== currentPrediction) {
            //     if (consolidatedStepData.prediction.length > 0) {
            //     consolidatedStepData.prediction[consolidatedStepData.prediction.length - 1].endTimestamp = record.seconds;
            //     }
            //     consolidatedStepData.prediction.push({
            //     startTimestamp: record.seconds,
            //     endTimestamp: record.seconds,
            //     value: record.Prediction
            //     });
            //     currentPrediction = record.Prediction;
            // } else {
            //     consolidatedStepData.prediction[consolidatedStepData.prediction.length - 1].endTimestamp = record.seconds;
            // }
        });

        session['consolidatedStepData'] = consolidatedStepData;
    })

    return dataFiles;
}
