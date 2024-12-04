import * as d3 from 'd3';
import lasso from './../lasso.js'; // Adjust the path if necessary
import {updateBoundingBoxes, updateKeyFrames } from './KeyFrame/KeyFramesView.js'
import { get_margins, get_selectedItems, set_selectedItems, get_selectedScatterSource, get_selectedGroupby, get_selectedFilter, getColorScaleScatterplot, get_selectedScatterplotGroupby, set_originalSelectedItems, getSilhouetteScoresForDataset} from './config.js'
import { get_scatterGroup, get_scatterGroup2, get_scatterGroup3, get_scatterSvg, get_scatterSvg2, get_scatterSvg3, get_scatterTooltip, get_scatterTooltip2, get_scatterTooltip3 } from './containersSVG.js';
import { updateEventTimeline } from './EventTimeline.js';
import { resetLegendSkill } from './legendSkills.js';
import { DBSCAN } from 'density-clustering';
import { add_ScatterplotStatistics } from './ScatterPlotStatistics.js';

// export function generateScaleScatter(data, accessor) {
//     let symbolArray = d3.symbolsFill;
//     symbolArray.push(d3.symbolDiamond2, d3.symbolX, d3.symbolPlus)
//     const uniqueValues = Array.from(new Set(data.map(d => d[accessor])));
//     console.log(uniqueValues);
//     return d3.scaleOrdinal()
//         .domain(uniqueValues)
//         .range(d3.schemeAccent);
// }

function silhouetteScore(coordinates, labels) {
    // Calculate the silhouette score for each point
    let silhouetteScores = coordinates.map((coord, i) => {
        let ownCluster = labels[i];
        let a = averageDistance(coord, coordinates, labels, ownCluster, true);  // Same cluster
        let b = Infinity;

        // Calculate the minimum average distance to any other cluster
        let uniqueLabels = [...new Set(labels)];
        uniqueLabels.forEach(cluster => {
            if (cluster !== ownCluster) {
                let clusterDistance = averageDistance(coord, coordinates, labels, cluster, false);
                if (clusterDistance < b) b = clusterDistance;
            }
        });

        return (b - a) / Math.max(a, b);
    });

    // Return the average silhouette score across all points
    // return silhouetteScores.reduce((sum, score) => sum + score, 0) / silhouetteScores.length;
    // Function to calculate quartiles and median
    function calculateBoxplotStats(data) {
        data.sort((a, b) => a - b);
        let min = data[0];
        let max = data[data.length - 1];
        let q1 = data[Math.floor((data.length - 1) / 4)];
        let median = data[Math.floor((data.length - 1) / 2)];
        let q3 = data[Math.floor(3 * (data.length - 1) / 4)];
        return { min, q1, median, q3, max };
    }

    // Calculate average silhouette score
    let averageScore = silhouetteScores.reduce((sum, score) => sum + score, 0) / silhouetteScores.length;

    // Calculate boxplot statistics
    let boxplotStats = calculateBoxplotStats(silhouetteScores);

    // Return structured object
    return {
        averageScore: averageScore,
        boxplot: boxplotStats
    };

}

function averageDistance(point, coordinates, labels, cluster, sameCluster) {
    let filteredPoints = coordinates.filter((_, i) => (sameCluster ? labels[i] === cluster : labels[i] !== cluster));
    if (filteredPoints.length === 0) return 0;

    let totalDistance = filteredPoints.reduce((sum, coord) => sum + euclideanDistance(point, coord), 0);
    return totalDistance / filteredPoints.length;
}

function euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
        sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
}

// function createDBSCANClusters(coordinates, epsilon, minPts) {
//     let dbscan = new DBSCAN(); // Create a new instance of DBSCAN
//     let clusters = dbscan.run(coordinates, epsilon, minPts);
//     console.log('DBSCAN Clustering Result:', clusters);
//     return clusters;
// }
function createDBSCANClusters(coordinates, epsilon, minPts) {
    let dbscan = new DBSCAN();
    let clusters = dbscan.run(coordinates, epsilon, minPts);

    // Initialize labels with -1 (indicating noise)
    let labels = new Array(coordinates.length).fill(-1);

    // Assign cluster labels
    clusters.forEach((cluster, index) => {
        cluster.forEach(pointIndex => {
            labels[pointIndex] = index; // Assign the cluster index as label
        });
    });

    // console.log('DBSCAN Clustering Result:', clusters);
    // console.log('Updated Labels:', labels);
    return labels;
}

function convertToNumericArray(arr) {
    let skillMap = {};
    let numericArray = [];

    arr.forEach((skill, index) => {
        if (!skillMap.hasOwnProperty(skill)) {
            skillMap[skill] = Object.keys(skillMap).length;
        }
        numericArray.push(skillMap[skill]);
    });

    return numericArray;
}

function createKMeansClusters(coordinates, k, callback) {
    // Convert coordinates into the format required for ml5 K-means
    const data = coordinates.map(coord => ({ x: coord[0], y: coord[1] }));

    // Perform K-means clustering using ml5
    ml5.kmeans(data, k, (err, result) => {
        if (err) {
            console.error('K-Means Error:', err);
            callback(err, null);
            return;
        }
        // console.log('K-Means Clustering Result:', result);
        // Assuming the result object contains an array of labels
        const labels = result.labels.map(label => label); // Adjust this based on actual result format
        callback(null, labels);
    });
}

function allLabelsAreSame(labels) {
    const uniqueLabels = new Set(labels);
    return uniqueLabels.size === 1;
}
export function calculateAverageSilhouetteScore(method) {
    let averageSilhouetteScore = {};
    let points = d3.selectAll(".scatterpoints")
        .filter(d => d.method === method)  // Filter points by the specific method
        .filter(function() {
            return !d3.select(this).classed("unselectedscatter");  // Further filter by unselectedscatter class
        })["_groups"][0];  // Access the underlying array of filtered elements
    console.log("points");
    console.log(points);

    if (points.length > 1) {
        let coordinates = points.map(p => [+Number(p.__data__.x), +Number(p.__data__.y)]);
        let labels = convertToNumericArray(points.map(p => p.__data__.skill));
        if (allLabelsAreSame(labels)) {
            console.log('All labels are the same.');
            labels = createDBSCANClusters(coordinates, 0.5, 4 ); // Specify epsilon and minimum points
        }
        // let labels = new Array(coordinates.length).fill(0); // Assigning all points to one cluster for now
        averageSilhouetteScore = silhouetteScore(coordinates, labels);
        console.log(`Average Silhouette Score for ${method}:`, averageSilhouetteScore);
    } else {
        console.log(`Not enough points for ${method} to calculate Silhouette Score.`);
    }
    return averageSilhouetteScore;
}

export function updateScatterplot( dataFiles ){

    console.log("updateScatterplot");  
    const margins = get_margins();
    let selectedItems = get_selectedItems();

    // get selected value from dropdown menus
    // let selectedScatterSource = "imu";
    let selectedGroupby = get_selectedScatterplotGroupby(); // fill points with colors
    let selectedFilter = "all";

    let selectedScatterSource = "M2-72"; //"20230412_130353_HoloLens";


    let filteredDataModel1 = dataFiles[2].filter(d => d.method === "omnivore");
    // get svgs
    let scatterGroup = get_scatterGroup();
    let scatterSvg = get_scatterSvg();
    let scatterTooltip = get_scatterTooltip();

    let scatterplotName = "#scatterplot-container";
    renderScatterPlot(scatterGroup, scatterSvg, scatterTooltip, scatterplotName, filteredDataModel1);

    // let filteredDataModel2 = dataFiles[2].filter(d => d.session === selectedScatterSource && d.method === "slowfast");
    let filteredDataModel2 = dataFiles[2].filter(d => d.method === "slowfast");

    // get svgs
    let scatterGroup2 = get_scatterGroup2();
    let scatterSvg2 = get_scatterSvg2();
    let scatterTooltip2 = get_scatterTooltip2();

    let scatterplotName2 = "#scatterplot2-container";
    renderScatterPlot(scatterGroup2, scatterSvg2, scatterTooltip2, scatterplotName2, filteredDataModel2);
    
    let filteredDataModel3 = dataFiles[2].filter(d => d.method === "avion");
    // get svgs
    let scatterGroup3 = get_scatterGroup3();
    let scatterSvg3 = get_scatterSvg3();
    let scatterTooltip3 = get_scatterTooltip3();

    let scatterplotName3 = "#scatterplot3-container";
    renderScatterPlot(scatterGroup3, scatterSvg3, scatterTooltip3, scatterplotName3, filteredDataModel3);
    

    function renderScatterPlot(scatterGroup, scatterSvg, scatterTooltip, scatterplotName, filteredData){
        scatterGroup.selectAll("*").remove()
        scatterTooltip.selectAll("*").remove()
        // scatterSvg.attr("height", scatterSvg.attr("height") - margins.scatterplot.top - margins.scatterplot.bottom);
        // scatterSvg.style("outline", "thin solid gray")

        // scatterGroup.attr("height", scatterSvg.attr("height") - margins.scatterplot.top); // translate



        scatterSvg.selectAll(".legendgroup").remove();
        scatterSvg.selectAll(".legendrect").remove();
        scatterGroup.append("rect")
            .attr("x",0)
            .attr("y",0)
            .attr("height", scatterGroup.attr("height"))
            .attr("width", scatterGroup.attr("width"))
            .attr("fill-opacity",0)

        scatterSvg.selectAll('.lasso').remove();
        scatterGroup.selectAll('.unselectedscatter').attr("class","scatterpoints");

        let scatterScaleEncoding = getColorScaleScatterplot();

        let scatterplotDiv = d3.select(scatterplotName)
        const xScaleScatter = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => +d.x))
            .range([0, scatterGroup.attr("width")]);
            // .range([0, scatterplotDiv.node().clientWidth - margins.scatterplot.left - margins.scatterplot.right]);

        // Append tooltip
        // let scatterTooltip = scatterplotDiv.append("div")
        //     .attr("class", "tooltip")
        //     // .style("opacity",0.9)
        //     .style("visibility","hidden")
        //     .style("position", "absolute")
        //     //.style("width","150px")
        //     .style("background-color", "white")
        //     .style("padding", "8px")
        //     .style("border-radius", "2px")
        //     .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
        //     .style("text-align", "left"); // Add text-align: left to align text left
        //     ;

        const yScaleScatter = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => +d.y))
            .range([scatterGroup.attr("height")- margins.scatterplot.top, 0]); // translate

        scatterGroup.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => xScaleScatter(+d.x))
            .attr("cy", d => yScaleScatter(+d.y))
            .attr("r", 2)
            .attr("fill", d => {return scatterScaleEncoding(d[selectedGroupby]);})
            .attr("class", "scatterpoints")
            .on("mouseover", function(d) {
                scatterTooltip.transition()
                    .duration(200)
                    .style("visibility", "visible");
                    scatterTooltip.html(`<strong>Skill:</strong> ${d.target.__data__.skill}<br>
                                         <strong>Session:</strong> ${d.target.__data__.session}<br>
                                         <strong>Id:</strong> ${d.target.__data__.session_id}`)
                    .style("left", (d.layerX + 10) + "px")
                    .style("top", (d.layerY - 28) + "px");
            })
            .on("mouseout", function(d) {
                scatterTooltip.transition()
                    .duration(500)
                    .style("visibility", "hidden");
            });

        //add brush
        let lassoBrush=lasso()
            .items(scatterGroup.selectAll('.scatterpoints'))
            .targetArea(scatterGroup)
            .on("end",lasso_end)
            .on("start",()=>{
                resetLegendSkill();
                lassoBrush.items().classed("unselectedscatter",false);
            });

        scatterGroup.call(lassoBrush);

        //on drawing of lasso
        function lasso_end(){
            selectedItems = []
            let itemsBrushed=lassoBrush.selectedItems()["_groups"][0];
            if (itemsBrushed.length>0){
                lassoBrush.notSelectedItems().classed("unselectedscatter", true);
                lassoBrush.selectedItems().classed("unselectedscatter", false); 
                
                itemsBrushed.forEach((item) => { 
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
                    selectedItems.push(item.__data__); // Add selected item data
                });

                synchronizeScatterplots(selectedItems);

                // Calculate and log the Average Silhouette Score for each method
                let silhouetteScoreResults = [];
                silhouetteScoreResults.push(calculateAverageSilhouetteScore("omnivore"));
                silhouetteScoreResults.push(calculateAverageSilhouetteScore("slowfast"));
                silhouetteScoreResults.push(calculateAverageSilhouetteScore("avion"));

                // Optionally, log the results to check the output
                add_ScatterplotStatistics(silhouetteScoreResults, dataFiles, selectedItems);
            }
            //case where no nodes are selected - reset filters and inform parent
            else{
                resetLegendSkill();
                // clean lasso drawn
                d3.selectAll(".loop_close").attr("d",null);
                d3.selectAll(".drawn").attr("d",null);
                lassoBrush.items().classed("unselectedscatter",false);
                d3.selectAll(".scatterpoints").classed("unselectedscatter", false);
                // d3.selectAll(".lasso").remove();
                const resultsForDataset = getSilhouetteScoresForDataset();
                // Optionally, log the results to check the output
                add_ScatterplotStatistics(resultsForDataset, dataFiles, []);
            }
            set_selectedItems(selectedItems);
            set_originalSelectedItems(selectedItems);
            updateKeyFrames( dataFiles);
            updateEventTimeline( dataFiles);
        }
    }
    function synchronizeScatterplots(selectedItems) {
        d3.selectAll(".scatterpoints").classed("unselectedscatter", true);
        selectedItems.forEach((item) => {
            d3.selectAll(".scatterpoints")
                .filter(d => d.skill === item.skill && d.session === item.session && d.session_id === item.session_id)
                .classed("unselectedscatter", false);
        });
    }
}