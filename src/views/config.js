
import * as d3 from 'd3';
import { computeSilhouetteScoresForDataset } from './legendSkills';
let allTimestamps = {}
let maxTimestamp=0.0;
let allTimestamps_filtered = {}
let maxTimestamp_filtered=0.0;
let silhouetteScoresForDataset = [];
let data_source; // selected window frames

// get similarity between embedding spaces of selected points (frames).
export function get_similarity_embedding_spaces(selectedItems, dataFiles){
    // Generate the list of image paths
    let path_frames = selectedItems.map(item => {
        let session_id = parseInt(item.session_id);
        let w_value = session_id + 1;
        // let f_value = session_id * 30 + 1;
        let f_value = parseInt(item.frame_id);

        return {
            path: `${item.session}_w${w_value}_f${f_value}.jpg`,
            skill: item.skill,
            session: item.session,
            session_id: item.session_id,
            // objects_class: JSON.parse(item.objects_class.replace(/'/g, '"')), // for example, objects_class: "['hands', 'hands', 'hands']"
            // objects_conf: item.objects_conf.replace(/[\[\]]/g, '')  // Remove the square brackets
            //                                 .trim()                  // Trim any leading or trailing spaces
            //                                 .split(/\s+/)            // Split by one or more spaces
            //                                 .map(Number),
            // step_label: parseInt(item.step_label),
            // step_label_desc: item.step_label_desc

        };
    });
    // Assume largeDataset and smallDataset are your datasets.
    let largeDataset = dataFiles[4];
    let smallDataset = path_frames;
    // Step 1: Create a Set of skills from the small dataset
    const smallDatasetSkills = new Set(smallDataset.map(item => item.skill));
    // Step 2: Filter the large dataset by the skill attribute
    const filteredLargeDataset = largeDataset.filter(item => smallDatasetSkills.has(item.skill));
    // Step 3: Create a Map from the filtered large dataset using window_medoid as the key
    const largeDatasetMap = new Map(
    filteredLargeDataset.map(item => [item.window_medoid, item])
    );
    // Step 4: Extract the matching items from the large dataset
    const matchedItems = smallDataset.map(item => largeDatasetMap.get(item.path));
    return matchedItems;
}
export function set_source(source){
    data_source = source;
}
export function get_source(){
    return data_source;
}

export function get_base_window_frame_path(){
    // Define the base path directory
    let path_dir = `data/window_frames/${get_source()}/`;
    return path_dir;
}

export function setSilhouetteScoresForDataset(jsonFile){
    silhouetteScoresForDataset = computeSilhouetteScoresForDataset(jsonFile);
    // add_ScatterplotStatistics(resultsForDataset);
}

export function getSilhouetteScoresForDataset(){
    return silhouetteScoresForDataset;
}

export function process_timestamps(dataFiles){
    //TIMESTAMP
    Object.keys(dataFiles[1]).forEach((skillVal)=>{
        Object.keys(dataFiles[1][skillVal]).forEach((sessionVal)=>{
            allTimestamps['t'+sessionVal+"-s"+skillVal]=dataFiles[1][skillVal][sessionVal].duration_seconds
            maxTimestamp = Math.max(maxTimestamp,  dataFiles[1][skillVal][sessionVal].duration_seconds)
        })
    })
}

export function get_allTimestamps(){
    return allTimestamps;
}
export function get_maxTimestamp(){
    return maxTimestamp;
    // return 83;
}

export function process_timestamps_filtered(unique_sessions, all_session_metadata ){
    allTimestamps_filtered = {}
    maxTimestamp_filtered=0.0;

    // Function to get the session details
    function filterSessionMetadata(unique_sessions, all_session_metadata) {
        const sessionDetails = {};
    
        unique_sessions.forEach(({ skill, session }) => {
            if (all_session_metadata[skill] && all_session_metadata[skill][session]) {
                if (!sessionDetails[skill]) {
                    sessionDetails[skill] = {};
                }
                sessionDetails[skill][session] = all_session_metadata[skill][session];
            }
        });
    
        return sessionDetails;
    }

    // Get session details
    const sessionDetails = filterSessionMetadata(unique_sessions, all_session_metadata);

    //TIMESTAMP
    Object.keys(sessionDetails).forEach((skillVal)=>{
        Object.keys(sessionDetails[skillVal]).forEach((sessionVal)=>{
            allTimestamps_filtered['t'+sessionVal+"-s"+skillVal]=sessionDetails[skillVal][sessionVal].duration_seconds
            maxTimestamp_filtered = Math.max(maxTimestamp_filtered,  sessionDetails[skillVal][sessionVal].duration_seconds)
        })
    })
}

export function get_allTimestamps_filtered(){
    return allTimestamps_filtered;
}
export function get_maxTimestamp_filtered(){
    return maxTimestamp_filtered;
    // return 83;
}

// Color Scale for scatterplot. 
// accessor is selectedGroupby. For example selectedGroupby = "skill";
let colorScaleScatterplot;
let uniqueGroups; // Unique values (for example, unique skills).
export function setColorScaleScatterplot(data) {
    let accessor = get_selectedScatterplotGroupby();

    let symbolArray = d3.symbolsFill;
    symbolArray.push(d3.symbolDiamond2, d3.symbolX, d3.symbolPlus)
    uniqueGroups = Array.from(new Set(data.map(d => d[accessor])));

    // Get the colors from d3.schemeSet3
    let modifiedSchemeSet3 = d3.schemeSet3.slice(); // Create a copy to avoid modifying the original array

    // Replace a specific color, for example, replace the first color (index 0)
    modifiedSchemeSet3[1] = "#9c755f"; // Replace with your desired color (e.g., red)

    colorScaleScatterplot = d3.scaleOrdinal()
        .domain(uniqueGroups)
        .range(modifiedSchemeSet3); // d3.schemePaired d3.schemeSet3
}
export function getColorScaleScatterplot(){
    return colorScaleScatterplot;
}
export function getUniqueGroupsScatterplot(){
    return uniqueGroups;
}


// let stepColorScale;

// // Using lightness
// export function set_stepColorScale() {
//     const lightnessDomain = [0, 255]; // Define the range of lightness values

//     // Create a color scale for the lightness values
//     stepColorScale = d3.scaleLinear()
//         .domain(lightnessDomain)
//         .range(["orange", "green"])
//         .interpolate(d3.interpolateRgb);
// }

// export function get_stepColorScale(){
//     return stepColorScale;
// }
// Using steps
export function get_stepColorScale(dataFiles, currentSkill, currentSession){
    let maxStepId = dataFiles[1][currentSkill][currentSession].max_id_labels; // Maximun value. Ex. [0,2,3,4,5] then maxStepId = 5
    const stepDomain = [0, maxStepId]; // Define the range of lightness values
    // Create a color scale with a custom interpolator  for the step values
    let stepColorScale = d3.scaleSequential(d3.interpolateRgb('#bfbfbf', '#1a1a1a')) // Medium gray , dark grey
        .domain(stepDomain);

    return stepColorScale;
}

export function get_margins(){
    const margins={ 
        scatterplot:{ top:20, left:30, right:30, bottom:15},
        frame:{ top:20, left:5, right:5, bottom:20},
        fnirs:{top:50, left:47, right:10, bottom:10},
        timeDist:{top:30, left:30, right:30, bottom: 10},
        eventTimeline:{top:25, left:55, right:16, bottom:20},
        matrix:{top:25, left:5, right:5, bottom:20},
        predictionSessions:{top:25, left:10, right:10, bottom:20},   
        hl2:{top:55, left:45, right:23, bottom:10},
        video:{ top:0, left:0, right:0, bottom:0},
    }
    return margins;
}

// Compute unique sources, trials and subjects
let sources, uniqueSessions, uniqueSkills;
export function compute_unique_data(dataFiles){
    sources = [...new Set(dataFiles[0].map(entry => entry.skill_id))];
    uniqueSkills = [...new Set(dataFiles[0].map(entry => entry.skill_id))];
    uniqueSessions = [...new Set(dataFiles[0].map(entry => entry.session_id))];
}

export function get_unique_sources(){
    return sources;
}
export function get_unique_sessions(){
    return uniqueSessions;
}
export function get_unique_skills(){
    return uniqueSkills;
}

// // get video path
export function get_videoPath(brushedSkill, brushedSession){
    return `data/video/${String(brushedSkill).padStart(4, '')}/${brushedSession}/hl2_rgb/codec_hl2_rgb_vfr.mp4`;
}


// return `data/video/${String(brushedSkill).padStart(4, '')}/${brushedSession}/hl2_rgb/codec_hl2_rgb_vfr.mp4`;
// get video path
// export function get_videoPath(brushedSkill, brushedSession){
//     return `http://172.24.113.193:9000/M2_Tourniquet/Data/alabama/${String(brushedSession).padStart(4, '')}/${String(brushedSession).padStart(4, '')}.mp4`;
// }

let original_selectedItems;
// Update selected items 
export function set_originalSelectedItems(items){
    // Clone the items array to avoid mutability issues
    original_selectedItems = [...items];
    set_selectedUniqueSessions(selectedItems);
}
export function get_originalSelectedItems(){
    return original_selectedItems;
}
export function updateScatterplotUsingOriginalSelectedItems(){
    d3.selectAll(".scatterpoints").classed("unselectedscatter", true);
    get_originalSelectedItems().forEach((item) => {
        d3.selectAll(".scatterpoints")
            .filter(d => d.skill === item.skill && d.session === item.session && d.session_id === item.session_id)
            .classed("unselectedscatter", false);
    });
}

let selectedItems;
// Update selected items 
export function set_selectedItems(items){
    // Clone the items array to avoid mutability issues
    selectedItems = [...items];
    set_selectedUniqueSessions(selectedItems);
}
export function get_selectedItems(){
    return selectedItems;
}


let selectedUniqueSessions;
// Update selected items 
export function set_selectedUniqueSessions(selectedItems){
     let uniqueSessions = [];
     let sessionsSeen = new Set();
     for (let item of selectedItems) {
         if (!sessionsSeen.has(item.session)) {
             uniqueSessions.push(item);
             sessionsSeen.add(item.session);
         }
     }
    //  console.log("uniqueSessions");
    // Clone the items array to avoid mutability issues
    selectedUniqueSessions = [...uniqueSessions];
}
export function get_selectedUniqueSessions(){
    return selectedUniqueSessions;
}


// Update selected ScatterSource 
let selectedScatterSource;
export function set_selectedScatterSource(option){
    selectedScatterSource = option;
}
export function get_selectedScatterSource(){
    return selectedScatterSource;
}

// Update selected Groupby 
let selectedGroupby;
export function set_selectedGroupby(option){
    selectedGroupby = option;
}
export function get_selectedGroupby(){
    return selectedGroupby;
}

// Update selected ScatterplotGroupby 
let selectedScatterplotGroupby;
export function set_selectedScatterplotGroupby(option){
    selectedScatterplotGroupby = option;
}
export function get_selectedScatterplotGroupby(){
    return selectedScatterplotGroupby;
}

// Update selected Filter
let selectedFilter;
export function set_selectedFilter(option){
    selectedFilter = option;
}
export function get_selectedFilter(){
    return selectedFilter;
}