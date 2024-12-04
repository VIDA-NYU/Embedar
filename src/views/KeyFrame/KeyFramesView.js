import * as d3 from 'd3';
import { get_margins, get_selectedItems, get_selectedGroupby, get_selectedFilter, get_originalSelectedItems, updateScatterplotUsingOriginalSelectedItems, get_source, get_base_window_frame_path } from '../config.js';
import { get_frameGroup, get_frameSvg, get_frameTooltip } from '../containersSVG.js';
import { FrameDetails } from './FrameDetails.js';
import { renderObjectChips } from './ObjectChips.js';
import { renderStepChips } from './StepChips.js';



// // Function to handle the highlighting of images based on the selected step
// function highlightImagesByStep(selectedStep) {
//     // Loop through all images and highlight those associated with the selected step
//     groupFrames.forEach((frame, index) => {
//         const imageElement = d3.select(`#image-${index}`);
//         if (frame.step_label === selectedStep) {
//             imageElement.classed('highlighted', true).classed('faded', false);
//         } else {
//             imageElement.classed('faded', true).classed('highlighted', false);
//         }
//     });
// }

let imageWidth = 80;
let imageHeight = 40;

// Function to render bounding boxes on a specific image
function renderBoundingBoxes(image, bboxes) {
    bboxes.forEach((bbox) => {
        let [x1, y1, x2, y2] = bbox;

        // Scale the bounding box coordinates
        let scaledX1 = x1 * imageWidth;
        let scaledY1 = y1 * imageHeight;
        let scaledX2 = x2 * imageWidth;
        let scaledY2 = y2 * imageHeight;

        // Draw the bounding box
        image.node().parentNode.appendChild(
            d3.create("svg:rect")
                .attr("x", +image.attr("x") + scaledX1)
                .attr("y", +image.attr("y") + scaledY1)
                .attr("width", scaledX2 - scaledX1)
                .attr("height", scaledY2 - scaledY1)
                .attr("stroke", "red")
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .node()
        );
    });
}

// Function to update bounding boxes on all images based on the checkbox state
export function updateBoundingBoxes(dataFiles) {
    // Clear existing bounding boxes
    d3.selectAll("image").each(function() {
        d3.select(this.parentNode).selectAll("rect").remove();
    });
    if (d3.select("#show-object-boxes").property("checked")) {
        // Loop through each image and render bounding boxes
        d3.selectAll("image").each(function(d) {
            let frame = d;
            let image = d3.select(this);

            // Get the bounding box data for the current frame
            let tempObject = dataFiles[0].filter(obj => obj.skill_id == frame.skill && obj.session_id == frame.session);

            if (tempObject.length > 0) {
                let bboxes = tempObject[0].data[frame.session_id].objects_bbox;
                renderBoundingBoxes(image, bboxes);
            }
        });
    }
}

export function updateKeyFrames(dataFiles) {
    const margins = get_margins();

    // Get selected value from dropdown menus
    let selectedGroupby = get_selectedGroupby();
    let selectedFilter = get_selectedFilter();

    // Get svgs
    let frameSvg = get_frameSvg();
    let frameGroup = get_frameGroup();
    let frameTooltip = get_frameTooltip();

    let selectedItems = get_selectedItems();

    // Define the base path directory
    let path_dir =get_base_window_frame_path();

    // Generate the list of image paths
    let path_frames = selectedItems.map(item => {
        let session_id = parseInt(item.session_id);
        let w_value = session_id + 1;
        // let f_value = session_id * 30 + 1;
        let f_value = parseInt(item.frame_id);

        return {
            path: `${path_dir}${item.skill}/${item.session}_w${w_value}_f${f_value}.jpg`,
            skill: item.skill,
            session: item.session,
            session_id: item.session_id,
            objects_class: JSON.parse(item.objects_class.replace(/'/g, '"')), // for example, objects_class: "['hands', 'hands', 'hands']"
            objects_conf: item.objects_conf.replace(/[\[\]]/g, '')  // Remove the square brackets
                                            .trim()                  // Trim any leading or trailing spaces
                                            .split(/\s+/)            // Split by one or more spaces
                                            .map(Number),
            step_label: parseInt(item.step_label),
            step_label_desc: item.step_label_desc

        };
    });

    // Compute the number of frames
    let numberOfFrames = path_frames.length;

    frameGroup.selectAll("*").remove();

    // Append a title with the number of frames right next to it
    let title = frameGroup.append("text")
        .attr("x", 10)  // x position
        .attr("y", 20)  // y position
        .attr("font-size", "16px")
        .attr("font-weight", "bold");

    title.append("tspan")
        .text("Grid of Images");

    title.append("tspan")
        .attr("font-size", "12px")  // smaller font size
        .attr("font-weight", "normal")  // normal font weight
        .text(` (${numberOfFrames} frames)`);

    // Set the number of columns
    let columns = 6;
    // let imageWidth = 80;
    // let imageHeight = 40;
    let padding = 5;

    let currentY = margins.frame.top + 40;  // Adjust initial Y position to avoid overlapping with the title

    // Group the frames by the selected grouping method
    // let groupedFrames = d3.group(path_frames, d => selectedGroupby === 'session' ? d.session : d.skill);
    // Group frames based on the selected option
    let groupedFrames;
    if (selectedGroupby === "session") {
        groupedFrames = d3.group(path_frames, d => d.session);
    } else if (selectedGroupby === "skill") {
        groupedFrames = d3.group(path_frames, d => d.skill);
    } else {
        // For "all" option, treat all images as part of a single group
        groupedFrames = new Map([["all", path_frames]]);
    }

    // Iterate over each group
    // For each group
    groupedFrames.forEach((frames, groupKey) => {

        // Append a group for each session or skill
        let groupGroup = frameGroup.append("g")
            .attr("width", frameGroup.attr("width") - margins.frame.left - margins.frame.right)// translate
            .attr("height", frameGroup.attr("height") - margins.frame.top - margins.frame.bottom)// translate
            .attr("transform", `translate(10, ${currentY})`);

        // Append a title for each session or skill
        groupGroup.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text(`${selectedGroupby.charAt(0).toUpperCase() + selectedGroupby.slice(1)}: ${groupKey}`);

        // Create a container for the detected objects with a fixed width and horizontal scrolling
        let objectsContainer = groupGroup.append("foreignObject")
        .attr("x", 0) 
        .attr("y", 5)
        .attr("width", columns * imageWidth + columns)
        .attr("height", 30) // Increased height to 100 for more space
        .append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("overflow-x", "auto") // Enable horizontal scrolling
        .style("white-space", "nowrap") // Prevent line breaks
        .style("font-size", "9px")
        .style("padding-top", "2px")
        .style("text-align", "left"); // Align content to the left

        // Allows images and corresponding points in the scatterplot to be highlighted based on the selected object, with the highlighting logic controlled by the chip selections.
        renderObjectChips(objectsContainer, frames);

         // Compute the statistical summary for the group
         const numImagesWithOneObject = frames.filter(item => item.objects_class.length == 0).length;
         const numImagesWithTwoObjects = frames.filter(item => item.objects_class.length > 1).length;
         const avgConfidencePerObject = frames.reduce((acc, item) => {
             item.objects_class.forEach((obj, idx) => {
                 if (!acc[obj]) {
                     acc[obj] = { sum: 0, count: 0 };
                 }
                 acc[obj].sum += item.objects_conf[idx];
                 acc[obj].count += 1;
             });
             return acc;
         }, {});
 
        //  Object.keys(avgConfidencePerObject).forEach(obj => {
        //      avgConfidencePerObject[obj] = avgConfidencePerObject[obj].sum / avgConfidencePerObject[obj].count;
        //  });
         // Compute the average confidence values
            const avgConfidence = Object.fromEntries(
                Object.entries(avgConfidencePerObject).map(([obj, data]) => [
                    obj,
                    data.sum / data.count
                ])
            );

            // Sort the objects by average confidence in descending order
            const sortedAvgConfidencePerObject = Object.fromEntries(
                Object.entries(avgConfidence)
                    .sort(([, a], [, b]) => b - a) // Sort in descending order
            );           
         // Calculate the number of rows based on the number of images and columns
            let numRows = Math.ceil(frames.length / columns);

            // Calculate the total height for the group
            let groupHeight = numRows * imageHeight;

            // Set the height of the statsContainer and barSvg to match the group height
            // d3.select('#statsContainer')
            //     .style('height', groupHeight + 'px')
            //     .style('overflow-y', 'auto'); // Add scroll if needed

         // Create a container for the statistical summary
         let statsContainer = groupGroup.append("foreignObject")
             .attr("class", "statsContainer")  // Add this line
             .attr("x", columns * imageWidth + columns + 10) // Position to the right of the images
             .attr("y", 5)
             .attr("width", groupGroup.attr("width") - (columns * imageWidth + columns + 10)) // Width of the summary box
             .attr("height", groupHeight+20) // Height of the summary box
            //  .style("height", `${containerHeight}px`)
             .append("xhtml:div")
             .style("width", "100%")
             .style("height", "100%")
             .style("overflow", "hidden") // Prevent overflow
             .style("font-size", "9px")
             .style("padding", "2px")
             .style("margin", "22px")
             .style("text-align", "left") // Align content to the left
            .style("overflow-y", "auto"); // Enable scroll if needed


 
         // Append the statistical summary
         statsContainer.append("div")
             .style("font-weight", "bold")
             .text("Statistical Summary:");
 
        // Call to render the step chips
        // Allows images and corresponding points in the scatterplot to be highlighted based on the selected step, with the highlighting logic controlled by the chip selections.
        renderStepChips(statsContainer.node(), frames);

        statsContainer.append('span')
            .attr('class', 'section-title')
            .text(`Objects: `);

        statsContainer.append("div")
            .text(`Images with 0 objects: ${numImagesWithOneObject}`);

        statsContainer.append("div")
            .text(`Images with ≥ 2 objects: ${numImagesWithTwoObjects}`);

        statsContainer.append("div")
            .text(`Total images: ${frames.length}`);
        
         // Bar chart for average confidence
         let barSvg = statsContainer.append("svg")
             .attr("width", 280)
             .attr("height", groupHeight);
 
         let barScale = d3.scaleLinear()
             .domain([0, 1])
             .range([0, 180]);
 
         barSvg.selectAll("rect")
             .data(Object.entries(sortedAvgConfidencePerObject))
             .enter()
             .append("rect")
             .attr("x", 0)
             .attr("y", (d, i) => i * 12)
             .attr("width", d => barScale(d[1]))
             .attr("height", 10)
             .attr("fill", "#D3D3D3");
 
         barSvg.selectAll("text")
             .data(Object.entries(sortedAvgConfidencePerObject))
             .enter()
             .append("text")
             .attr("x", d => barScale(d[1]) + 2)
             .attr("y", (d, i) => i * 12 + 9)
             .attr("font-size", "8px")
             .attr("fill", "black")
             .text(d => `${d[0]}: ${(d[1] * 100).toFixed(1)}%`);
        
        // Append a group for the grid of images
        let imageGroup = groupGroup.append("g")
            .attr("transform", "translate(0, 30)"); // Adjusted to accommodate the chip/tags
    
        // Initial checkbox state
        let showBoundingBoxes = d3.select("#show-object-boxes").property("checked");

        // Append each image in a grid (this part remains unchanged)
        frames.forEach((frame, index) => {
            let col = index % columns;
            let row = Math.floor(index / columns);
    
            let image = imageGroup.append("image")
                .attr("x", col * (imageWidth + padding))
                .attr("y", row * (imageHeight + padding))
                .attr("width", imageWidth)
                .attr("height", imageHeight)
                .attr("xlink:href", frame.path)
                .datum(frame)  // Attach data for use in mouse events
                // .attr("data-objects", JSON.stringify(frame.objects_class)) // Store objects in a data attribute
                .on("mouseover", function(event, d) {
                    // Define containerRect inside the event handler
                    const containerRect = frameSvg.node().getBoundingClientRect();
                
                    frameTooltip.transition()
                        .duration(200)
                        .style("opacity", 1)
                        .style("visibility", "visible");
                    frameTooltip.html(`<b>Skill:</b> ${frame.skill}<br/><b>Session:</b> ${frame.session}<br/><b>ID:</b> ${frame.session_id}`)
                        .style("left", (event.clientX - containerRect.left + 10) + "px") // Adjust position relative to container
                        .style("top", (event.clientY - containerRect.top + 10) + "px");  // Adjust position relative to container
                })
                .on("mousemove", function(event, d) {
                    // Define containerRect inside the event handler
                    const containerRect = frameSvg.node().getBoundingClientRect();
                
                    frameTooltip.style("left", (event.clientX - containerRect.left + 10) + "px")
                        .style("top", (event.clientY - containerRect.top + 10) + "px");
                })
                .on("mouseout", function(event, d) {
                    frameTooltip.transition()
                        .duration(500)
                        .style("opacity", 0)
                        .style("visibility", "hidden");
                })
                .on("click", function(event, d) {
                    FrameDetails(dataFiles, event, frame);
                });
        });
        updateBoundingBoxes(dataFiles);

        // Update currentY to position the next session or skill below the current one
        currentY += (Math.ceil(frames.length / columns) * (imageHeight + padding)) + 40;
        if (frameSvg.attr("height") <= currentY + 200) {
            frameGroup.attr("height", currentY + 200);
            frameSvg.attr("height", currentY + 250 + margins.frame.top + margins.frame.bottom);     
        }
    });

    return null;
}
