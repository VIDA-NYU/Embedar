import * as d3 from 'd3';
import { updateScatterplotUsingOriginalSelectedItems } from '../config';

function getUniqueStepsBySkill(frames) {
    const stepsBySkill = {};

    frames.forEach(frame => {
        const skill = frame.skill;
        const stepLabel = frame.step_label;
        const stepLabelDesc = frame.step_label_desc;

        if (!stepsBySkill[skill]) {
            stepsBySkill[skill] = new Map();
        }

        stepsBySkill[skill].set(stepLabel, stepLabelDesc);
    });

    // Convert maps to sorted arrays
    Object.keys(stepsBySkill).forEach(skill => {
        stepsBySkill[skill] = Array.from(stepsBySkill[skill].entries()).sort(([a], [b]) => a - b);
    });

    return stepsBySkill;
}

function highlightDataByStep(stepLabelDesc) {
    // Select all images
    let images = d3.selectAll("image");

    // Clear Highlights: If no object is selected or applyHighlight is false, reset all images to default state
    if (!stepLabelDesc) {
        images.style("opacity", 1);
        // Update scatterplot
        updateScatterplotUsingOriginalSelectedItems();
        return;
    }
    // Highlight images containing the selected object
    d3.selectAll(".scatterpoints").classed("unselectedscatter", true);
    images.each(function() {
        let img = d3.select(this);
        let imgData = img.datum();
        let containsStep = imgData.step_label_desc == stepLabelDesc;
        img.style("opacity", containsStep ? 1 : 0.3);
        // Scatterplot
        if (containsStep){
            d3.selectAll(".scatterpoints")
            .filter(d => d.skill === imgData.skill && d.session === imgData.session && d.session_id === imgData.session_id)
            .classed("unselectedscatter", false);
        }
    });
}

function extractInstruction(str) {
    return str.replace(/^\d+\.\s*/, '');
}

export function renderStepChips(container, groupFrames) {
    const stepsBySkill = getUniqueStepsBySkill(groupFrames);

    // Select the container where the chips will be added
    const chipContainer = d3.select(container)
        .append("div")
        .attr("class", "chip-container");

    chipContainer.append('span')
        .attr('class', 'section-title')
        .text(`Steps: `);

    // For each skill, create a row of chips
    Object.keys(stepsBySkill).forEach(skill => {
        const skillRow = chipContainer.append('div')
            .attr('class', 'step-chip-row')
            .style('margin-bottom', '5px'); // Adjust margin as needed

        skillRow.append('span')
            .attr('class', 'skill-label')
            .text(`Skill: ${skill}`);

        stepsBySkill[skill].forEach(([stepLabel, stepLabelDesc]) => {
            const chip = skillRow.append('div')
                .attr('class', 'step-chip')
                .style('display', 'inline-block')
                .style('margin', '1px 5px 2px 2px') // Adjust margin as needed
                .style('padding', '2px 4px') // Adjust padding as needed
                .style("border", "1px solid #D3D3D3")
                .style('border-radius', '3px')
                .style('background-color', 'white') // Adjust background color as needed
                .style('cursor', 'pointer')
                .text(stepLabel + ". " + stepLabelDesc);

            // Adding event listeners to step chips
            chip.on("mouseover", function() {
                // Check if there is at least one selection in any of the step-chip elements
                var hasSelection = d3.selectAll('.step-chip.selected').size() > 0 || d3.selectAll('.object-chip.selected').size() > 0;
                if (!hasSelection) {
                    highlightDataByStep(stepLabelDesc); // Highlight based on the selected step
                    d3.selectAll('.step-chip')
                        .filter(function() { return extractInstruction(d3.select(this).text()) === stepLabelDesc; })
                        .style('background-color', '#e0e0e0');
                }
            })
            .on("mouseout", function() {
                // Check if there is at least one selection in any of the step-chip elements
                var hasSelection = d3.selectAll('.step-chip.selected').size() > 0 || d3.selectAll('.object-chip.selected').size() > 0;
                if (!hasSelection) {
                    highlightDataByStep(null); // Highlight based on the selected step
                    d3.selectAll('.step-chip')
                        .filter(function() { return extractInstruction(d3.select(this).text()) === stepLabelDesc; })
                        .style('background-color', 'white');
                }
            })
            .on("click", function() {
                const isAlreadySelected = d3.select(this).classed('selected');
                if (isAlreadySelected) { // Clearing selection (Release click selection). This is activated when the same object is selected.
                    // Unselect and clear highlight of current and all chips with the same step label
                    d3.selectAll('.step-chip')
                        .filter(function() { return extractInstruction(d3.select(this).text()) === stepLabelDesc; })
                        .classed('selected', false)
                        .style('background-color', 'white');
                    highlightDataByStep(null); // Highlight based on the selected step
                } else {
                    d3.selectAll('.step-chip')
                        .classed('selected', false) // Deselect other chips
                        .style('background-color', 'white'); // Deselect other chips
                    d3.selectAll('.object-chip')
                        .classed('selected', false) // Deselect other chips
                        .style('background-color', 'white'); // Deselect other chips

                    // Select and highlight current and all chips with the same step label
                    d3.selectAll('.step-chip')
                        .filter(function() { return extractInstruction(d3.select(this).text()) === stepLabelDesc; })
                        .classed('selected', true)
                        .style('background-color', '#e0e0e0');
                    highlightDataByStep(stepLabelDesc); // Highlight based on the selected step
                    
                }
            });
        });
    });
}