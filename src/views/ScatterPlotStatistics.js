import * as d3 from 'd3';
import { get_scatterStatisticsSvg } from './containersSVG';
import { get_similarity_embedding_spaces } from './config';


export function add_ScatterplotStatistics(silhouetteScoreResults, dataFiles, selectedItems) {
    // get similarity between embedding spaces of selected points (frames).
    const similarities = get_similarity_embedding_spaces(selectedItems, dataFiles);
    // Example similarities data
    // const similarities = [
    //     {
    //       skill: "M3",
    //       window_medoid: "M3-2_w2_f43.jpg",
    //       omnivore_slowfast: "0.2048192771084337",
    //       omnivore_avion: "0.0928961748633879",
    //       slowfast_avion: "0.075268817204301"
    //     },
    //     {
    //       skill: "M3",
    //       window_medoid: "M3-2_w3_f57.jpg",
    //       omnivore_slowfast: "0.2048192771084337",
    //       omnivore_avion: "0.0928961748633879",
    //       slowfast_avion: "0.075268817204301"
    //     },
    //     {
    //       skill: "M3",
    //       window_medoid: "M3-2_w4_f66.jpg",
    //       omnivore_slowfast: "0.2121212121212121",
    //       omnivore_avion: "0.0256410256410256",
    //       slowfast_avion: "0.0416666666666666"
    //     }
    //   ];

    let scatterplotStatisticsSvg = get_scatterStatisticsSvg();// d3.select("#scatterplot-statistics-svg");
    scatterplotStatisticsSvg.selectAll("*").remove();
    // scatterplotStatisticsSvg.attr("transform", `translate(70, 0)`);
    // .attr("width", 100)
    // .attr("height", 200)
    // 
    let svg = scatterplotStatisticsSvg.append("g")
    .attr("transform", `translate(68, 25)`)
    .attr("width", 75)
    .attr("height", 200);

    // Adding the main legend title
    svg.append("text")
        .attr("x", -26)
        .attr("y", -15)
        .attr("text-anchor", "start")
        .style("font-size", "9px")
        .text("Cluster Analysis");

    // Adding the main legend title
    svg.append("text")
        .attr("x", 59)
        .attr("y", -15)
        .attr("text-anchor", "start")
        .style("font-size", "9px")
        .text("Embedding Space Similarities");

            // Add info icons with tooltips
    const infoIconSize = 10;

    // Info icon for "Cluster Analysis"
    svg.append("text")
        .attr("x", 41)
        .attr("y", -15)
        .attr("font-family", "FontAwesome")
        .attr("font-size", `${infoIconSize}px`)
        .attr("cursor", "pointer")
        .text("\uf05a") // Unicode for info circle
        .on("mouseover", function () {
            d3.select(this)
                .append("title")
                .text("Cluster Analysis provides insights into the quality of clustering within the projection, using the Silhouette Score.");
        })
        .on("mouseout", function () {
            d3.select(this).select("title").remove();
        });

    // Info icon for "Embedding Space Similarities"
    svg.append("text")
        .attr("x", 182)
        .attr("y", -15)
        .attr("font-family", "FontAwesome")
        .attr("font-size", `${infoIconSize}px`)
        .attr("cursor", "pointer")
        .text("\uf05a") // Unicode for info circle
        .on("mouseover", function () {
            d3.select(this)
                .append("title")
                .text("Embedding Space Similarities measure how closely different machine learning methods are related by comparing the neighborhoods of their output representations (selected data points representing window frames). Using the Jaccard index, we assess the overlap between 100-nearest neighbors in different embedding spaces, providing a similarity score ranging from 0 (dissimilar) to 1 (highly similar).");
        })
        .on("mouseout", function () {
            d3.select(this).select("title").remove();
        });
    // Example silhouetteScoreResults data
    // silhouetteScoreResults = [
    //     { averageScore: 0.7655824154782005, boxplot: { min: 0.5616370368673962, q1: 0.7219883289484325, median: 0.7676435164385459, q3: 0.8204067036264406, max: 0.864766423352468 } },
    //     { averageScore: 0.7690311949975353, boxplot: { min: -0.13742119904176398, q1: 0.7115040502988385, median: 0.8094518658207674, q3: 0.8565916796736947, max: 0.8963482438842362 } },
    //     { averageScore: 0.28894653781937635, boxplot: { min: -0.2808850903843685, q1: -0.012681213891248093, median: 0.12545106597628147, q3: 0.6075858967831314, max: 0.7670929268462269 } }
    // ];

    const margin = { top: 20, right: 20, bottom: 50, left: 2 };
    const width = svg.attr("width")  - margin.left - margin.right;
    const height = svg.attr("height") - margin.top - margin.bottom;

    // Define the scales
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain([0, 1, 2])
        .paddingInner(0.1)
        .paddingOuter(0.2);

    const yScale = d3.scaleLinear()
        .domain([-1, 1])  // Adjust this based on your data
        .range([height, 0]);

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat((d, i) => ["Omnivore", "Slowfast", "Avion"][i]))
        .selectAll("text") // Rotate the x-axis labels to prevent overlap
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.5em");

    // Y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left - 35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")  // Adjust font size
        .text("Silhouette Score");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom +5)  // Adjusted for rotated labels
        .attr("text-anchor", "middle")
        .style("font-size", "12px")  // Adjust font size
        .text("ML Methods");

    // Draw the boxplots
    silhouetteScoreResults.forEach((d, i) => {
        const center = xScale(i) + xScale.bandwidth() / 2;
        const boxWidth = xScale.bandwidth() / 2;

        // Box
        svg.append("rect")
            .attr("x", center - boxWidth / 2)
            .attr("y", yScale(d.boxplot.q3))
            .attr("height", yScale(d.boxplot.q1) - yScale(d.boxplot.q3))
            .attr("width", boxWidth)
            .attr("fill", "#69b3a2");

        // Median line
        svg.append("line")
            .attr("x1", center - boxWidth / 2)
            .attr("x2", center + boxWidth / 2)
            .attr("y1", yScale(d.boxplot.median))
            .attr("y2", yScale(d.boxplot.median))
            .attr("stroke", "black");

        // Min and Max lines
        svg.append("line")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", yScale(d.boxplot.min))
            .attr("y2", yScale(d.boxplot.max))
            .attr("stroke", "black");

        // Whiskers
        svg.append("line")
            .attr("x1", center - boxWidth / 4)
            .attr("x2", center + boxWidth / 4)
            .attr("y1", yScale(d.boxplot.min))
            .attr("y2", yScale(d.boxplot.min))
            .attr("stroke", "black");

        svg.append("line")
            .attr("x1", center - boxWidth / 4)
            .attr("x2", center + boxWidth / 4)
            .attr("y1", yScale(d.boxplot.max))
            .attr("y2", yScale(d.boxplot.max))
            .attr("stroke", "black");

        // Detect and draw outliers
        const iqr = d.boxplot.q3 - d.boxplot.q1;
        const lowerBound = d.boxplot.q1 - 1.5 * iqr;
        const upperBound = d.boxplot.q3 + 1.5 * iqr;

        const outliers = silhouetteScoreResults[i].outliers || [];
        outliers.forEach(outlier => {
            if (outlier < lowerBound || outlier > upperBound) {
                svg.append("circle")
                    .attr("cx", center)
                    .attr("cy", yScale(outlier))
                    .attr("r", 3)
                    .attr("fill", "red");
            }
        });
    });

    // Calculate average similarities
    const omnivoreSlowfastAvg = d3.mean(similarities, d => +d.omnivore_slowfast);
    const omnivoreAvionAvg = d3.mean(similarities, d => +d.omnivore_avion);
    const slowfastAvionAvg = d3.mean(similarities, d => +d.slowfast_avion);

    // Define SVG dimensions
    const svgWidth = 200; // or set this based on your available space
    const svgHeight = 220;

    // Setup the SVG for the graph
    let graphSvg = scatterplotStatisticsSvg.append("g")
        .attr("transform", `translate(${width + 40}, -20)`)
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Define the nodes with positions based on percentages of the SVG dimensions
    const nodes = [
        { id: "Omnivore", x: svgWidth * 0.33, y: svgHeight * 0.33 },
        { id: "Slowfast", x: svgWidth * 0.67, y: svgHeight * 0.33 },
        { id: "Avion", x: svgWidth * 0.5, y: svgHeight * 0.67 }
    ];

    // Scale the edge thickness based on similarity values
    const edgeScale = d3.scaleLinear()
        .domain([0, 1])
        .range([1, 5]);  // Adjust range based on desired thickness

    // Define the edges with average similarities
    const edges = [
        { source: "Omnivore", target: "Slowfast", value: omnivoreSlowfastAvg },
        { source: "Omnivore", target: "Avion", value: omnivoreAvionAvg },
        { source: "Slowfast", target: "Avion", value: slowfastAvionAvg }
    ];

    // Draw the edges (connections) between nodes
    graphSvg.selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("x1", d => nodes.find(n => n.id === d.source).x)
        .attr("y1", d => nodes.find(n => n.id === d.source).y)
        .attr("x2", d => nodes.find(n => n.id === d.target).x)
        .attr("y2", d => nodes.find(n => n.id === d.target).y)
        .attr("stroke-width", d => edgeScale(d.value))
        .attr("stroke", "black");

    // Draw the nodes
    graphSvg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 10)  // Radius of the nodes
        .attr("fill", "steelblue");


    // Add labels to the nodes with conditional positioning
    graphSvg.selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", d => d.x)
        .attr("y", d => d.id === "Avion" ? d.y + 20 : d.y - 15)  // Adjust position based on node
        .attr("text-anchor", "middle")
        .text(d => d.id)
        .style("font-size", "12px")
        .style("fill", "black");


    // Add average similarity values on the edges, positioning labels as required
    graphSvg.selectAll("text.edge-label")
        .data(edges)
        .enter()
        .append("text")
        .attr("class", "edge-label")
        .attr("x", d => {
            const sourceNode = nodes.find(n => n.id === d.source);
            const targetNode = nodes.find(n => n.id === d.target);
            const midX = (sourceNode.x + targetNode.x) / 2;
            const deltaX = targetNode.x - sourceNode.x;
            const deltaY = targetNode.y - sourceNode.y;
            const offset = 10;  // Adjust this value to control the distance from the edge

            // Determine if edge is between top nodes or involves the bottom node
            if (d.source === "Omnivore" && d.target === "Slowfast" || d.source === "Slowfast" && d.target === "Omnivore") {
                return midX;  // Position label above the line
            } else {
                // For edges connecting to the bottom node, determine side
                const isLeftSide = sourceNode.x < targetNode.x;
                return midX + (isLeftSide ? -offset : offset);  // Adjust position based on side
            }
        })
        // .attr("y", d => (nodes.find(n => n.id === d.source).y + nodes.find(n => n.id === d.target).y) / 2)
        .attr("y", d => {
            const sourceNode = nodes.find(n => n.id === d.source);
            const targetNode = nodes.find(n => n.id === d.target);
            const midY = (sourceNode.y + targetNode.y) / 2;

            // Determine if edge is between top nodes or involves the bottom node
            if (d.source === "Omnivore" && d.target === "Slowfast" || d.source === "Slowfast" && d.target === "Omnivore") {
                const offset = -12;  // Adjust this value to control the distance from the edge
                return midY - offset;  // Position label above the line
            } else {
                const offset = 10;  // Adjust this value to control the distance from the edge
                // For edges connecting to the bottom node, use perpendicular offset
                return midY + offset;  // Adjust position based on side
            }
        })
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => d.value !== undefined ? d.value.toFixed(2) : "N/A");  // Handle undefined values gracefully

// // // Add average similarity values on the edges
// graphSvg.selectAll("text.edge-label")
//     .data(edges)
//     .enter()
//     .append("text")
//     .attr("class", "edge-label")
//     .attr("x", d => (nodes.find(n => n.id === d.source).x + nodes.find(n => n.id === d.target).x) / 2)
//     .attr("y", d => (nodes.find(n => n.id === d.source).y + nodes.find(n => n.id === d.target).y) / 2)
//     .attr("text-anchor", "middle")
//     .style("font-size", "10px")
//     .text(d => d.value !== undefined ? d.value.toFixed(2) : "N/A");  // Handle undefined values gracefully
}