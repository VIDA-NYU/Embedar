import * as d3 from 'd3';

export function FrameDetails(dataFiles, event, item) {
    // console.log(item);
    let tempObject = dataFiles[0].filter(obj => obj.skill_id == item.skill && obj.session_id == item.session);

    // Extract bounding box coordinates and confidence scores
    let bboxes = tempObject[0].data[item.session_id].objects_bbox;
    let confidences = tempObject[0].data[item.session_id].objects_conf;
    let confidenceAvg = tempObject[0].data[item.session_id].objects_conf_avg;
    let lightnessAvg = tempObject[0].data[item.session_id].hls_lightness_avg;

    // Image display dimensions
    let imageWidth = 300; //300;
    let imageHeight = 200; //200;

    // Create container for large image and summary
    let largeImageContainer = d3.select("body").append("div")
        .attr("class", "large-image-container")
        .style("position", "absolute")
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px")
        .style("background", "white")
        .style("padding", "10px")
        .style("border", "1px solid black")
        .style("z-index", 1000)
        .style("display", "flex");  // Use flexbox to align image and summary

    // Add the close button
    largeImageContainer.append("button")
        .text("Close")
        .style("position", "absolute")
        .style("top", "-23px")
        .style("left", "-1px")
        .on("click", function() {
            largeImageContainer.remove();
        });

    // Add the image name
    largeImageContainer.append("div")
        .text(item.path.split('/').pop()) // Extracts the image name from the path
        .style("position", "absolute")
        .style("top", "5px")
        .style("right", "5px")
        .style("font-size", "12px")
        .style("background", "rgba(255, 255, 255, 0.8)")
        .style("padding", "2px");

    // Create a container for the image and SVG overlay
    let imageContainer = largeImageContainer.append("div")
        .style("position", "relative")
        .style("width", imageWidth + "px")
        .style("height", imageHeight + "px");

    // Append the image
    imageContainer.append("img")
        .attr("src", item.path)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .style("display", "block");

    // Append SVG overlay for bounding boxes
    let svgOverlay = imageContainer.append("svg")
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .style("position", "absolute")
        .style("top", "0px")
        .style("left", "0px");

    // Draw the bounding boxes and confidence scores
    let bboxElements = svgOverlay.selectAll("g")
        .data(bboxes)
        .enter()
        .append("g")
        .attr("class", "bbox-group");

        bboxElements.append("rect")
        .attr("class", "bbox-rect")
        .attr("x", (d) => d[0] * imageWidth)
        .attr("y", (d) => d[1] * imageHeight)
        .attr("width", (d) => (d[2] - d[0]) * imageWidth)
        .attr("height", (d) => (d[3] - d[1]) * imageHeight)
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none");
    
    bboxElements.append("text")
        .attr("class", "bbox-text")
        .text((d, i) => `Conf: ${confidences[i].toFixed(2)}`)
        .attr("x", (d) => d[0] * imageWidth + 2)
        .attr("y", (d) => d[1] * imageHeight + 12)
        .attr("font-size", "10px")
        .attr("fill", "red");

    // Count the number of objects with the same name
    let objectCounts = {};
    item.objects_class.forEach(cls => {
        objectCounts[cls] = (objectCounts[cls] || 0) + 1;
    });

    // Create sorted data for the bar chart
    let sortedAvgConfidencePerObject = {};
    item.objects_class.forEach((cls, index) => {
        if (!sortedAvgConfidencePerObject[cls]) {
            sortedAvgConfidencePerObject[cls] = confidences[index];
        } else {
            // If the class already exists, update the average confidence
            sortedAvgConfidencePerObject[cls] = (sortedAvgConfidencePerObject[cls] + confidences[index]) / 2;
        }
    });

    // Create a container for the summary
    let summaryContainer = largeImageContainer.append("div")
        .attr("class", "summary-container")
        .style("margin-left", "20px")  // Space between image and summary
        .style("width", "300px");  // Adjust width as needed

    // Add step_label_desc
    summaryContainer.append("p")
    .html(`<strong>Step Description:</strong> ${item.step_label_desc}`)
    .style("font-size", "12px")
    .style("margin-bottom", "10px");

    // Create a horizontal bar chart
    let barHeight = 12;  // Height of each bar
    let barSvg = summaryContainer.append("svg")
        .attr("width", "100%")  // Full width of the summary container
        .attr("height", (barHeight + 5) * Object.keys(objectCounts).length + 40);  // Adjust height to fit all bars

    // Define the x scale for the bar chart
    let barScale = d3.scaleLinear()
        .domain([0, 1])  // Assuming confidence values are between 0 and 1
        .range([0, 200]);  // Adjust range width as needed

    // Draw bars for objects_conf
    barSvg.selectAll("rect")
        .data(Object.entries(sortedAvgConfidencePerObject))
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * (barHeight + 5))
        .attr("width", d => barScale(d[1]))
        .attr("height", barHeight)
        .attr("fill", "#D3D3D3")
        .on("mouseover", (event, d) => {
            // Highlight corresponding bounding boxes
            d3.selectAll(".bbox-group")
                .select(".bbox-rect")
                .attr("stroke", (bbox, i) => item.objects_class[i] === d[0] ? "orange" : "red");
            d3.selectAll(".bbox-group")
                .select(".bbox-text")
                .attr("fill", (bbox, i) => item.objects_class[i] === d[0] ? "orange" : "red");
        })
        .on("mouseout", () => {
            // Reset bounding boxes to default
            d3.selectAll(".bbox-rect").attr("stroke", "red");
            d3.selectAll(".bbox-text").attr("fill", "red");
        });

    // Add labels for the bars
    barSvg.selectAll("text")
        .data(Object.entries(sortedAvgConfidencePerObject))
        .enter()
        .append("text")
        .attr("x", d => barScale(d[1]) + 2)
        .attr("y", (d, i) => i * (barHeight + 5) + barHeight - 2)
        .attr("font-size", "8px")
        .attr("fill", "black")
        .text(d => `(${objectCounts[d[0]]}) ${d[0]}: ${(d[1] * 100).toFixed(1)}%`);

    // Add average confidence
    summaryContainer.append("p")
        .html(`<strong>Average Object Confidence:</strong> ${(confidenceAvg * 100).toFixed(1)}%`)
        .style("font-size", "10px")
        .style("margin-top", "10px");
}




// import * as d3 from 'd3';

// export function FrameDetails(dataFiles, event, item){
//     console.log(item);
//     console.log(item);

//     let tempObject = dataFiles[0].filter(obj => obj.skill_id == item.skill && obj.session_id == item.session);

//     // Extract bounding box coordinates and confidence scores
//     let bboxes = tempObject[0].data[item.session_id].objects_bbox;
//     let confidences = tempObject[0].data[item.session_id].objects_conf;
//     let confidenceAvg = tempObject[0].data[item.session_id].objects_conf_avg;
//     let lightnessAvg = tempObject[0].data[item.session_id].hls_lightness_avg;

//     // Image display dimensions
//     let imageWidth = 300;
//     let imageHeight = 200;

//     // Display larger version of the image
//     let largeImage = d3.select("body").append("div")
//         .attr("class", "large-image-container")
//         .style("position", "absolute")
//         .style("left", (event.pageX + 5) + "px")
//         .style("top", (event.pageY - 28) + "px")
//         .style("background", "white")
//         .style("padding", "10px 10px 30px 10px")
//         .style("border", "1px solid black")
//         .style("z-index", 1000);

//     // Add the close button to the top left corner
//     largeImage.append("button")
//         .text("Close")
//         .style("position", "absolute")
//         .style("top", "5px")
//         .style("left", "5px")
//         .on("click", function() {
//             largeImage.remove();
//         });

//     // Add the image name to the top right corner
//     largeImage.append("text")
//         .text(item.path.split('/').pop()) // Extracts the image name from the path
//         .style("position", "absolute")
//         .style("top", "5px")
//         .style("right", "5px")
//         .style("font-size", "12px")
//         .style("background", "rgba(255, 255, 255, 0.8)") // Slightly transparent background for readability
//         .style("padding", "2px");

//     // Append the image
//     let img = largeImage.append("img")
//         .attr("src", item.path)
//         .attr("width", imageWidth)
//         .attr("height", imageHeight)
//         .style("display", "block")  // Ensure the image is displayed below the button
//         .style("margin-top", "30px");  // Add some margin to avoid overlap with the button

//     // Append SVG overlay for bounding boxes
//     let svgOverlay = largeImage.append("svg")
//         .attr("width", imageWidth)
//         .attr("height", imageHeight)
//         .style("position", "absolute")
//         .style("top", "35px") // Adjust this according to the margin added for the image
//         .style("left", "10px");

//     // Draw the bounding boxes and confidence scores
//     bboxes.forEach((bbox, index) => {
//         let [x1, y1, x2, y2] = bbox;
//         let confidence = confidences[index];

//         // Scale the bounding box coordinates
//         let scaledX1 = x1 * imageWidth;
//         let scaledY1 = y1 * imageHeight;
//         let scaledX2 = x2 * imageWidth;
//         let scaledY2 = y2 * imageHeight;

//         // Draw the bounding box
//         svgOverlay.append("rect")
//             .attr("x", scaledX1)
//             .attr("y", scaledY1)
//             .attr("width", scaledX2 - scaledX1)
//             .attr("height", scaledY2 - scaledY1)
//             .attr("stroke", "red")
//             .attr("stroke-width", 2)
//             .attr("fill", "none");

//         // Add the confidence score text
//         svgOverlay.append("text")
//             .text(`Conf: ${confidence.toFixed(2)}`) // Format confidence to 2 decimal places
//             .attr("x", scaledX1 + 2) // Slightly inside the top left corner of the bounding box
//             .attr("y", scaledY1 + 12) // Slightly below the top edge of the bounding box
//             .attr("font-size", "10px")
//             .attr("fill", "red")
//             .attr("background", "rgba(255, 255, 255, 0.8)"); // Slightly transparent background for readability
//     });
// }
    // // Append SVG for the diverging bar chart
    // let barChartWidth = imageWidth;
    // let barChartHeight = 20;  // Height of the diverging bar chart

    // let barChartSvg = largeImage.append("svg")
    //     .attr("width", barChartWidth)
    //     .attr("height", barChartHeight)
    //     .style("position", "absolute")
    //     .style("top", (35 + imageHeight + 10) + "px") // Position it below the image
    //     .style("left", "10px");

    // // Scale for the diverging bar chart
    // let confidenceScale = d3.scaleLinear()
    //     .domain([0, 1])
    //     .range([0, barChartWidth / 2]);

    // let lightnessScale = d3.scaleLinear()
    //     .domain([0, 225])
    //     .range([0, barChartWidth / 2]);

    // // Draw confidence bar (left side)
    // barChartSvg.append("rect")
    //     .attr("x", barChartWidth / 2 - confidenceScale(confidenceAvg))
    //     .attr("y", 2)
    //     .attr("width", confidenceScale(confidenceAvg))
    //     .attr("height", barChartHeight - 4)
    //     .attr("fill", "blue");

    // // Draw lightness bar (right side)
    // barChartSvg.append("rect")
    //     .attr("x", barChartWidth / 2)
    //     .attr("y", 2)
    //     .attr("width", lightnessScale(lightnessAvg))
    //     .attr("height", barChartHeight - 4)
    //     .attr("fill", "green");

    // // Add text labels for the bars
    // barChartSvg.append("text")
    //     .attr("x", barChartWidth / 2 - confidenceScale(confidenceAvg) - 5)
    //     .attr("y", barChartHeight / 2 + 3)  // Vertically center the text
    //     .attr("text-anchor", "end")
    //     .attr("fill", "blue")
    //     .attr("font-size", "10px")  // Smaller font size for the labels
    //     .text(`Conf: ${confidenceAvg.toFixed(2)}`);

    // barChartSvg.append("text")
    //     .attr("x", barChartWidth / 2 + lightnessScale(lightnessAvg) + 5)
    //     .attr("y", barChartHeight / 2 + 3)  // Vertically center the text
    //     .attr("text-anchor", "start")
    //     .attr("fill", "green")
    //     .attr("font-size", "10px")  // Smaller font size for the labels
    //     .text(`Lightness: ${lightnessAvg.toFixed(2)}`);
// }