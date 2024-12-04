import * as d3 from 'd3';
import { getColorScaleScatterplot, getUniqueGroupsScatterplot, set_originalSelectedItems, set_selectedItems } from './config';
import { updateKeyFrames } from './KeyFrame/KeyFramesView';
import { updateEventTimeline } from './EventTimeline';
import { calculateAverageSilhouetteScore } from './ScatterPlot';
import { add_ScatterplotStatistics } from './ScatterPlotStatistics';


// Function to extract silhouette scores for the entire dataset
export function computeSilhouetteScoresForDataset(jsonData) {
    // Define the order of methods
    const methodOrder = ["omnivore", "slowfast", "avion"];
    
    // Initialize silhouetteScoreResults with placeholders for each method
    const silhouetteScoreResults = methodOrder.map(() => ({
        averageScore: null,
        boxplot: {
            min: null,
            q1: null,
            median: null,
            q3: null,
            max: null
        }
    }));

    // Iterate over each method in the JSON data
    methodOrder.forEach((method, index) => {
        if (jsonData.hasOwnProperty(method)) {
            const methodData = jsonData[method];
            silhouetteScoreResults[index] = {
                averageScore: methodData.average_score,
                boxplot: methodData.boxplot
            };
        }
    });

    return silhouetteScoreResults;
}


// Function to get silhouette scores for the selected skill
function getSilhouetteScoresForSkill(selectedSkill, jsonData) {
    // Define the order of methods
    const methodOrder = ["omnivore", "slowfast", "avion"];
    
    // Initialize silhouetteScoreResults with placeholders for each method
    const silhouetteScoreResults = methodOrder.map(() => ({
        averageScore: null,
        boxplot: {
            min: null,
            q1: null,
            median: null,
            q3: null,
            max: null
        }
    }));

    // Iterate over each method in the JSON data
    for (const method in jsonData) {
        if (jsonData.hasOwnProperty(method)) {
            const methodData = jsonData[method];
            const index = methodOrder.indexOf(method);

            // Ensure we are processing the methods in the correct order
            if (index !== -1 && methodData.skills && methodData.skills[selectedSkill]) {
                const skillData = methodData.skills[selectedSkill];
                silhouetteScoreResults[index] = {
                    averageScore: skillData.average_score,
                    boxplot: skillData.boxplot
                };
            }
        }
    }

    return silhouetteScoreResults;
}

export function add_legendSkills(dataFiles) {
    let scatterScaleEncoding = getColorScaleScatterplot();
    let uniqueGroups = getUniqueGroupsScatterplot();
    
    let legendSvg = d3.select("#legend-svg");

    // Adding the main legend title
    legendSvg.append("text")
        .attr("x", 5)
        .attr("y", 13)
        .attr("text-anchor", "start")
        .style("font-size", "11px")
        .text("Skills");

    // Adding legend items with event listeners for highlighting
    uniqueGroups.forEach((skill, i) => {
        let legendItem = legendSvg.append("g")
            .attr("class", "legend-item")
            .style("cursor", "pointer")
            // .on("mouseover", function () {
            //     var hasSelection = d3.selectAll('.legend-item.selected').size() > 0;
            //     if (!hasSelection) {
            //         highlightPointsBySkill(skill);
            //     }
            // })
            // .on("mouseout", function () {
            //     var hasSelection = d3.selectAll('.legend-item.selected').size() > 0;
            //     if (!hasSelection) {
            //         clearHighlights();
            //     }
            // })
            .on("click", function () {
                const isAlreadySelected = d3.select(this).classed('selected');
                if (isAlreadySelected) { // Clearing selection (Release click selection). This is activated when the same object is selected.
                    clearHighlights(dataFiles);
                } else {
                    d3.selectAll('.legend-item').classed('selected', false) // Deselect other chips
                    .attr("opacity", 0.2); // Deselect other chips
                    // clean any lasso drawn
                    d3.selectAll(".loop_close").attr("d",null);
                    d3.selectAll(".drawn").attr("d",null);
                    d3.select(this).classed('selected', true); // Select the current chip
                    d3.select(this).attr("opacity", 1);
                    updateSelectedItemsBySkill(skill, dataFiles);
                    highlightPointsBySkill(skill);
                    computeSilhouetteScore(dataFiles, d3.select(this).text());
                }
            });

        legendItem.append("rect")
            .attr("x", 5)
            .attr("y", 30 + i * 15) // Adjust y position to stack vertically with spacing
            .attr("height", 9)
            .attr("width", 9)
            .attr("fill", scatterScaleEncoding(skill)); // Use the color scale

        legendItem.append("text")
            .attr("x", 20) // Adjust x position to align text next to rect
            .attr("y", 38 + i * 15) // Align text with the rectangle
            .attr("text-anchor", "start")
            .style("font-size", "10px")
            .text(skill);
    });
}

function computeSilhouetteScore(dataFiles, skill){
    // Example usage
    const selectedSkill = skill; // This should be set based on your click event
    const silhouetteScoreResults = getSilhouetteScoresForSkill(selectedSkill, dataFiles[3]);

    // Calculate and log the Average Silhouette Score for each method
    // let silhouetteScoreResults = [];
    // silhouetteScoreResults.push(calculateAverageSilhouetteScore("omnivore"));
    // silhouetteScoreResults.push(calculateAverageSilhouetteScore("slowfast"));
    // silhouetteScoreResults.push(calculateAverageSilhouetteScore("avion"));

    // Optionally, log the results to check the output
    add_ScatterplotStatistics(silhouetteScoreResults, dataFiles, []);
}

function highlightPointsBySkill(skill) {
    d3.selectAll(".scatterpoints").classed("unselectedscatter", d => d.skill === skill ? false : true);
}

export function resetLegendSkill(){
    d3.selectAll(".loop_close").attr("d",null);
    d3.selectAll(".drawn").attr("d",null);
    d3.selectAll('.legend-item').classed('selected', false);
    d3.selectAll('.legend-item').attr("opacity", 1);
}
function clearHighlights(dataFiles) {
    d3.selectAll(".scatterpoints").classed("unselectedscatter", false);
    resetLegendSkill();
    set_selectedItems([]);
    set_originalSelectedItems([]);
    updateKeyFrames( dataFiles);
    updateEventTimeline( dataFiles);
}

function updateSelectedItemsBySkill(skill, dataFiles) {
    let selectedItems = [];

    let points = d3.selectAll(".scatterpoints")
        .filter(d => d.skill === skill && d.method == "omnivore");

    points["_groups"][0].forEach((item)=>{ 
        /* Example of item.__data__:
         {frame_id: "516"
         id: "2647"
         method: "omnivore"
         objects_class: "['hand', 'wound_treatment_bandage', 'wound_treatment_package', 'wound_treatment_package', 'hand']"
         objects_conf: "[0.8797125  0.86657    0.7723949  0.38856864 0.2976281 ]"
         session: "M3-2"
         session_id: "18"
         skill: "M3"
         step_label: "0"
         step_label_desc: "No step"
         x: "-55.61715316772461"
         y: "10.338974952697754"} */
         selectedItems.push(item.__data__) // each frame metadata (coming from dataFiles[2] specifically from all_sessions_tsne_results_10.csv)
    });
    set_selectedItems(selectedItems);
    set_originalSelectedItems(selectedItems);
    updateKeyFrames( dataFiles);
    updateEventTimeline( dataFiles);
}
