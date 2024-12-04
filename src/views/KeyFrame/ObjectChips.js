import * as d3 from 'd3';
import { updateScatterplotUsingOriginalSelectedItems } from '../config';


// Helper function to apply or reset highlighting
function highlightDataByObject(selectedObject) {
    // Select all images
    let images = d3.selectAll("image");

    // If no object is selected, reset all images and scatterplot to default state
    if (!selectedObject) {
        images.style("opacity", 1);
        // Update scatterplot
        updateScatterplotUsingOriginalSelectedItems();
        return;
    }
    // Highlight images containing the selected object and corresponding points in the scatterplot
    d3.selectAll(".scatterpoints").classed("unselectedscatter", true);
    images.each(function() {
        let img = d3.select(this);
        let imgData = img.datum();
        let containsObject = imgData.objects_class.includes(selectedObject);
        img.style("opacity", containsObject ? 1 : 0.3);
        // Scatterplot
        if (containsObject){
            d3.selectAll(".scatterpoints")
            .filter(d => d.skill === imgData.skill && d.session === imgData.session && d.session_id === imgData.session_id)
            .classed("unselectedscatter", false);
        }
    });
}

function extractObjectName(str) {
    return str.split(' (')[0];
}

export function renderObjectChips(objectsContainer, frames) {
        // Calculate object frequency in the group
        let objectFrequency = frames.reduce((acc, item) => {
            item.objects_class.forEach(obj => acc[obj] = (acc[obj] || 0) + 1);
            return acc;
        }, {});
        
        objectFrequency = Object.entries(objectFrequency)
            .sort(([, a], [, b]) => b - a)
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        // Append the "Detected Objects:" label as part of the same line
        objectsContainer.append("span")
        .style("font-weight", "bold")
        .text("Detected Objects: ");

        // Append each object label as a chip/tag
        Object.entries(objectFrequency).forEach(([object, freq]) => {
        let chip = objectsContainer.append("div")
            .attr('class', 'object-chip')
            .style("display", "inline-block")
            .style("margin-right", "3px")
            .style("padding", "1px 4px 1px 4px")
            .style("border-radius", "12px")
            .style("border", "1px solid #D3D3D3")
            .style("background-color", "white") 
            .style("color", "black") // Adjust text color for contrast
            .style("text-align", "left") // Align text to the left within each chip
            .text(`${object} (${freq})`)
            // .on("mouseover", function() {
            //     // Highlight images containing the object
            //     frameGroup.selectAll("image")
            //         .style("opacity", img => img.objects_class.includes(object) ? 1 : 0.3);
            // })
            .on("mouseover", function() {
                // Check if there is at least one selection in any of the object-chip elements
                var hasSelection = d3.selectAll('.object-chip.selected').size() > 0 || d3.selectAll('.step-chip.selected').size() > 0;
                if (!hasSelection) {
                    highlightDataByObject(object);
                    d3.selectAll('.object-chip')
                        .filter(function() { return extractObjectName(d3.select(this).text()) === object; })
                        .style('background-color', '#e0e0e0');
                }
            })
            .on("mouseout", function() {
                // Check if there is at least one selection in any of the object-chip elements
                var hasSelection = d3.selectAll('.object-chip.selected').size() > 0 || d3.selectAll('.step-chip.selected').size() > 0;
                if (!hasSelection) {
                    highlightDataByObject(null);
                    d3.selectAll('.object-chip')
                        .filter(function() { return extractObjectName(d3.select(this).text()) === object; })
                        .style('background-color', 'white');
                }
            })
            .on("click", function() {
                const isAlreadySelected = d3.select(this).classed('selected');
                if (isAlreadySelected) { // Clearing selection (Release click selection). This is activated when the same object is selected.
                    // Unselect and clear highlight of current and all chips with the same object
                    d3.selectAll('.object-chip')
                        .filter(function() { return extractObjectName(d3.select(this).text()) === object; })
                        .classed('selected', false)
                        .style('background-color', 'white');
                    highlightDataByObject(null);
                } else {
                    d3.selectAll('.object-chip')
                        .classed('selected', false) // Deselect other chips
                        .style('background-color', 'white'); // Deselect other chips
                    d3.selectAll('.step-chip')
                        .classed('selected', false) // Deselect other chips
                        .style('background-color', 'white'); // Deselect other chips
                    
                    // Select and highlight current and all chips with the same object
                    d3.selectAll('.object-chip')
                        .filter(function() { return extractObjectName(d3.select(this).text()) === object; })
                        .classed('selected', true)
                        .style('background-color', '#e0e0e0');
                    highlightDataByObject(object);
                }
            });
        });
    }