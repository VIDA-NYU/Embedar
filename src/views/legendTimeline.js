import * as d3 from 'd3';

export function add_legendSTimeline() {
    // Select the SVG element
    let legendSvg = d3.select("#legend-timeline-svg")
        .attr('transform', `translate(50, -10)`) // Position the axis 

    // Define the color scale using a custom interpolator
    let maxStepId = 10;
    const stepDomain = [0, maxStepId];
    let stepColorScale = d3.scaleSequential(d3.interpolateRgb('#bfbfbf', 'black'))
        .domain(stepDomain);

    // Define legend dimensions
    const legendWidth = 150;
    const legendHeight = 10;

    // Create a gradient for the color scale legend
    let colorGradient = legendSvg.append("defs").append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Define gradient stops based on the stepColorScale
    colorGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", stepColorScale(stepDomain[0]));

    colorGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", stepColorScale(stepDomain[1]));

    // Create ticks for the gradient
    let xScale = d3.scaleLinear()
        .domain(stepDomain)
        .range([0, legendWidth]);

    let xAxis = d3.axisBottom(xScale)
        .tickValues([stepDomain[0], stepDomain[1]])
        .tickSize(6)
        .tickFormat(d => {
            if (d === stepDomain[0]) return "First steps";
            if (d === stepDomain[1]) return "Last steps";
            return ""; // Return an empty string for other values (if any)
        });

    // Add the ticks to the SVG
    legendSvg.append("g")
        .attr("transform", `translate(65, ${23 + legendHeight})`) // Position below the gradient and labels
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "10px");

    // Add the color scale legend
    legendSvg.append("rect")
        .attr("x", 65)
        .attr("y", 23) // Position for the color scale legend
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    // Add labels at the ends of the gradient
    legendSvg.append("text")
        .attr("x", 0)
        .attr("y", 20 + legendHeight) // Position below the gradient
        .attr("text-anchor", "start")
        .style("font-size", "10px")
        .text("Steps:");

    // Define pattern for the pattern fill legend
    let d = "id";
    legendSvg.append("defs").append("pattern")
        .attr("id", `pattern-${d}`)
        .attr("width", 5)
        .attr("height", 5)
        .attr("patternUnits", "userSpaceOnUse")
        .append("rect")
        .attr("width", 5)
        .attr("height", 5)
        .style("fill", "#ededed");

    legendSvg.select(`defs pattern#pattern-${d}`)
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 5)
        .attr("y2", 5)
        .style("stroke", "#333")
        .style("stroke-width", 0.4);

    // Add pattern legend item
    legendSvg.append("rect")
        .attr("x", 265 + 40)
        .attr("y", 23) // Adjust y position to stack vertically with spacing
        .attr("height", 10)
        .attr("width", 10)
        .attr("fill", `url(#pattern-${d})`);

    legendSvg.append("text")
        .attr("x", 20 + legendWidth+ 110+ 40)
        .attr("y", 33) // Align text with the rectangle
        .attr("text-anchor", "start")
        .style("font-size", "10px")
        .text("No Selected");

    // Add pattern legend item
    legendSvg.append("rect")
        .attr("x", legendWidth + 5 + 40+ 40)
        .attr("y", 23) // Adjust y position to stack vertically with spacing
        .attr("height", 10)
        .attr("width", 10)
        .attr("fill","#8c0101");

    legendSvg.append("text")
        .attr("x", 20 + legendWidth+ 40+ 40)
        .attr("y", 33) // Align text with the rectangle
        .attr("text-anchor", "start")
        .style("font-size", "10px")
        .text("No Step");
}
