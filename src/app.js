// Import D3
import * as d3 from 'd3';
import { updateScatterplot } from './views/ScatterPlot.js';
import { updateBoundingBoxes, updateKeyFrames } from './views/KeyFrame/KeyFramesView.js';
import { compute_unique_data, getSilhouetteScoresForDataset, setColorScaleScatterplot, setSilhouetteScoresForDataset, set_selectedGroupby, set_selectedItems, set_selectedScatterplotGroupby, set_source, set_stepColorScale } from './views/config.js'
import { initialise_svgs } from './views/containersSVG.js';
import { consolidate_data } from './views/utils.js';
import { add_legendSkills } from './views/legendSkills.js';
import { add_legendSTimeline } from './views/legendTimeline.js';
import { add_ScatterplotStatistics } from './views/ScatterPlotStatistics.js';

let dataFiles; 
let selectedSource = null;
let selectedProjection = null;

document.getElementById("fab").addEventListener("mouseover", function() {
    document.getElementById("tooltip-window").style.visibility = "visible";
    document.getElementById("tooltip-window").style.opacity = "1";
});

document.getElementById("fab").addEventListener("mouseout", function() {
    document.getElementById("tooltip-window").style.visibility = "hidden";
    document.getElementById("tooltip-window").style.opacity = "0";
});

document.getElementById("fab-projection").addEventListener("mouseover", function() {
    document.getElementById("tooltip-projection").style.visibility = "visible";
    document.getElementById("tooltip-projection").style.opacity = "1";
});

document.getElementById("fab-projection").addEventListener("mouseout", function() {
    document.getElementById("tooltip-projection").style.visibility = "hidden";
    document.getElementById("tooltip-projection").style.opacity = "0";
});

document.addEventListener("DOMContentLoaded", function () {
    const fabButton = document.getElementById("fab");
    const fabMenu = document.getElementById("fab-menu");
    const fabProjectionButton = document.getElementById("fab-projection");
    const fabProjectionMenu = document.getElementById("fab-menu-projection");
    
    // Get the default active buttons
    const defaultWSizeButton = document.querySelector('#fab-menu .fab-menu-item.active');
    const defaultPMethodButton = document.querySelector('#fab-menu-projection .fab-menu-item.active');
    
    // Example: Logging the default button selections
    console.log("Default Window Size Button:", defaultWSizeButton.dataset.source);
    console.log("Default Projection Method Button:", defaultPMethodButton.dataset.method);

    selectedSource = defaultWSizeButton.dataset.source;
    selectedProjection = defaultPMethodButton.dataset.method;

    startVisualizations(selectedSource, selectedProjection, true);

    fabButton.addEventListener("click", function () {
        if (fabMenu.style.display === "none" || fabMenu.style.display === "") {
            fabMenu.style.display = "flex";
        } else {
            fabMenu.style.display = "none";
        }
    });

    fabProjectionButton.addEventListener("click", function () {
        if (fabProjectionMenu.style.display === "none" || fabProjectionMenu.style.display === "") {
            fabProjectionMenu.style.display = "flex";
        } else {
            fabProjectionMenu.style.display = "none";
        }
    });

    const menuItems = document.querySelectorAll("#fab-menu .fab-menu-item");

    menuItems.forEach(function (item) {
        item.addEventListener("click", function () {

            // Remove active class from all buttons
            menuItems.forEach(btn => btn.classList.remove('active'));
            console.log("CLICK source:", selectedSource);

            // Add active class to the clicked button
            this.classList.add('active');
            selectedSource = item.getAttribute("data-source");
            console.log("Selected source:", selectedSource);
            startVisualizations(selectedSource, selectedProjection, false);

            // Hide the menu after selection
            fabMenu.style.display = "none";
        });
    });

    const projectionMenuItems = document.querySelectorAll("#fab-menu-projection .fab-menu-item");

    projectionMenuItems.forEach(function (item) {
        item.addEventListener("click", function () {
            console.log("CLICK projection:", selectedSource);

            projectionMenuItems.forEach(btn => btn.classList.remove('active'));

            this.classList.add('active');
            selectedProjection = item.getAttribute("data-method");
            console.log("Selected projection:", selectedProjection);
            // Add your logic here to handle the projection change
            startVisualizations(selectedSource, selectedProjection, false);


            fabProjectionMenu.style.display = "none";
        });
    });
});


// document.getElementById("fab").addEventListener("mouseover", function() {
//     document.getElementById("tooltip-window").style.visibility = "visible";
//     document.getElementById("tooltip-window").style.opacity = "1";
// });

// document.getElementById("fab").addEventListener("mouseout", function() {
//     document.getElementById("tooltip-window").style.visibility = "hidden";
//     document.getElementById("tooltip-window").style.opacity = "0";
// });

// document.addEventListener("DOMContentLoaded", function () {
//     const fabButton = document.getElementById("fab");
//     const fabMenu = document.getElementById("fab-menu");
//     const defaultButton = document.querySelector('.fab-menu-item.active');
//     startVisualizations(defaultButton.dataset.source, true);

//     fabButton.addEventListener("click", function () {
//         if (fabMenu.style.display === "none" || fabMenu.style.display === "") {
//             fabMenu.style.display = "flex";
//         } else {
//             fabMenu.style.display = "none";
//         }
//     });

//     const menuItems = document.querySelectorAll(".fab-menu-item");

//     menuItems.forEach(function (item) {
//         item.addEventListener("click", function () {
//                     // Remove active class from all buttons
//         menuItems.forEach(btn => btn.classList.remove('active'));
        
//         // Add active class to the clicked button
//         this.classList.add('active');
//             const selectedSource = item.getAttribute("data-source");
//             console.log("Selected source:", selectedSource);
//             startVisualizations(selectedSource, false);
//             // Hide the menu after selection
//             fabMenu.style.display = "none";

//             // Here you can add the logic to update your application based on the selected source
//             // For example, updating the scatter plots or fetching new data
//         });
//     });
// });

function startVisualizations(source, projection, flag){
    console.log(source);
    console.log(projection);

    // Construct the base path using the source variable
    const basePath = `data/features/${source}/`;
    const projectionDataPath = `all_sessions_${projection}_results_10p.csv`;
    const silhouttePath = `silhouette_scores_dbscan_${projection}.json`;
    set_source(source);
    // Use the basePath to construct the full paths for each data file
    Promise.all([
        d3.json(`${basePath}sessions_window_frame_data.json`), // 0 need
        d3.json(`${basePath}sessions_metadata.json`), // 1
        d3.csv(`${basePath}${projectionDataPath}`), // 2 all_sessions_umap_results all_sessions_tsne_results_10
        d3.json(`${basePath}${silhouttePath}`), // 3
        d3.csv(`${basePath}combined_jaccard_original_space_index.csv`) // 4  combined_jaccard_index
    ])
        .then(function(files) {
            dataFiles = consolidate_data(files);
            initializeContainers(flag);
            updateScatterplot( dataFiles );
            updateKeyFrames( dataFiles);
        })
        .catch(function(err) {
        console.log(err)
        console.log("Data Files not loaded!")
    })
}

function initializeContainers(flag){
    // console.log("initializing")
    
    // set_stepColorScale();
    // Extract unique sources from the data
    compute_unique_data(dataFiles);
    // const sources = get_unique_sources();

    // // Populate dropdown with options
    // const sourceDropdown = d3.select("#source-dropdown");
    // sourceDropdown.selectAll("option")
    //     .data(sources)
    //     .enter()
    //     .append("option")
    //     .text(d => d)
    //     .attr("value", d => d)
    //     .attr("selected", (d, i) => i === 0 ? "selected" : null);
    
    // Add onchange event to get dropdown source and update scatterplot
    // sourceDropdown.on("change", function() {
    //     set_selectedScatterSource(sourceDropdown.property("value"));
    //     updateScatterplot( dataFiles )
    //     // selectedItems = [];
    //     updateFnirsAgg( dataFiles)
    //     updateTimeDistribution( dataFiles );
    //     updateEventTimeline( dataFiles )
    //     updateMatrix( dataFiles )
    //     updateFnirsSessions( dataFiles)
    //     cleanUpdateHl2Details( null );
    // });

    const groupbyDropdown = d3.select("#groupby-dropdown");
        
    // Add onchange event to get groupBy and update scatterplot
    groupbyDropdown.on("change", function() {
        set_selectedGroupby(groupbyDropdown.property("value"));
        updateKeyFrames( dataFiles);
    });

    set_selectedItems([]);

    //initialise svgs
    if(flag){
        initialise_svgs();
    }

    //initialise select variables
    set_selectedGroupby(groupbyDropdown.property("value"));

    // Set color coding for scatterplot
    set_selectedScatterplotGroupby("skill");
    setColorScaleScatterplot(dataFiles[2]);

    add_legendSkills(dataFiles);
    add_legendSTimeline();

    setSilhouetteScoresForDataset(dataFiles[3]);
    const resultsForDataset = getSilhouetteScoresForDataset();
    add_ScatterplotStatistics(resultsForDataset, dataFiles, []);

    // Initial checkbox state
    let showBoundingBoxes = d3.select("#show-object-boxes").property("checked", false);

    // Listen for changes to the checkbox state and update bounding boxes accordingly
    d3.select("#show-object-boxes").on("change", function() {
        updateBoundingBoxes(dataFiles); // Update bounding boxes for all images
    });
}
