import * as d3 from 'd3';
import { get_allTimestamps, get_maxTimestamp, get_stepColorScale, get_margins, get_unique_skills, get_unique_sessions, get_videoPath, get_selectedItems, set_selectedItems, get_selectedGroupby, process_timestamps, get_maxTimestamp_filtered, get_allTimestamps_filtered, process_timestamps_filtered, get_selectedUniqueSessions, get_originalSelectedItems, updateScatterplotUsingOriginalSelectedItems} from './config.js'
import { updateHl2Details } from './Hl2Details.js'
import { get_eventTimelineGroup, get_eventTimelineSvg } from './containersSVG.js';
import { playVideoWithStartTime } from './videoPlayerUtils.js';
import { get_brushedSkill, get_brushedSession, get_vidEnd, get_vidStart, set_brushedSkill, set_brushedSession, set_brushesAdded, set_vidEnd, set_vidStart } from './configVideoPlayer.js';
import { updateKeyFrames } from './KeyFrame/KeyFramesView.js';
import { updateScatterplot } from './ScatterPlot.js';

export function get_xEventTimelineScale(){
    let maxTimestamp = get_maxTimestamp_filtered();
    let margins = get_margins();
    let xEventTimelineScale= d3.scaleLinear()
    .domain([0.0, maxTimestamp])
    .range([0, d3.select("#event-timeline-container").node().clientWidth -margins.eventTimeline.left - margins.eventTimeline.right ])  
    return xEventTimelineScale;
}

function getIndividualFrameInfo(data, sessionId, session, skill, request) {
    // Find the entry matching the given session_id, session, and skill
    const entry = data.find(row => 
        row.session_id === sessionId.toString() &&
        row.session === session &&
        row.skill === skill
    );

    // Return the request info (such as objects_class) if found, otherwise return null
    return entry ? entry[request] : null;
}

export function updateEventTimeline( dataFiles ){   

    console.log("updateEventTimeline");
    // Extract unique sources from the data
    let uniqueSessions = get_unique_sessions();
    let uniqueSkills = get_unique_skills();
    let selectedItems = get_selectedItems();

    // console.log("uniqueSessions");
    // console.log(uniqueSessions);
    // console.log("uniqueSkills");
    // console.log(uniqueSkills);
    // console.log("selectedItems------");
    // console.log(selectedItems);

    // get selected value from dropdown menus
    let groupby = "skill";

    // get svgs
    let eventTimelineGroup = get_eventTimelineGroup();
    let eventTimelineSvg = get_eventTimelineSvg();


    // Define the SVG pattern (add this at the beginning of your script)
    // const svg = d3.select("svg"); // Make sure to select the appropriate SVG container

    // Define the pattern
    eventTimelineSvg.append("defs").append("pattern")
        .attr("id", "pattern-id")
        .attr("width", 10)
        .attr("height", 10)
        .attr("patternUnits", "userSpaceOnUse")
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "#ededed"); // Background color of the pattern

        eventTimelineSvg.select("defs").select("pattern")
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 10)
        .attr("y2", 10)
        .style("stroke", "#333")
        .style("stroke-width", 0.4);
    // let matrixGroup = get_matrixGroup();

    let brushedSession = get_brushedSession();
    let brushedSkill = get_brushedSkill();
    let brushesAdded=[];
    let brushIndices=[];
    let xEventTimelineScale;
    let reverseTimelineScale;
    let vidStart = get_vidStart();
    let vidEnd = get_vidEnd();

    // let stepColorScale = get_stepColorScale(); // Add by Sonia 
    const margins = get_margins();

    set_brushedSession(null);
    set_brushedSkill(null);
    brushesAdded.splice(0, brushesAdded.length)
    brushIndices.splice(0, brushIndices.length)
    let brushCount = 0  
    eventTimelineGroup.selectAll('*').remove();

    if (selectedItems.length == 0){
        return;
    }

    let filteredMissionData=[];
    let currentY = margins.eventTimeline.top;
    let groupArray = uniqueSkills

    // Identify unique selected sessions (selectedItems contains windows frames that may bellow to the same session)
    let uniqueSelectedSessions = get_selectedUniqueSessions();

    uniqueSelectedSessions.forEach((item)=>{
        //filter Mission File
        let tempObject = dataFiles[0].filter(obj => obj.skill_id == item.skill && obj.session_id == item.session);
        if (tempObject.length==0){
            console.log("ERROR:NO MATCH FOUND FOR SKILL AND SESSION ID")
            tempObject= [{skill_id: item.subject, session_id: item.trial, missing:true}]
        }
        else
            tempObject[0]["missing"]=false
        filteredMissionData.push(tempObject[0])
    })

    // Compute time based on selected items
    process_timestamps_filtered(uniqueSelectedSessions, dataFiles[1] )
    let maxTimestamp = get_maxTimestamp_filtered();
    let allTimestamps = get_allTimestamps_filtered();

    ///


    let yScaleLine =  d3.scaleLinear()
    .domain([1.0,0])
    .range([1,25])
     
    xEventTimelineScale= get_xEventTimelineScale();
    reverseTimelineScale = d3.scaleLinear()
    .domain([0, d3.select("#event-timeline-container").node().clientWidth -margins.eventTimeline.left - margins.eventTimeline.right ])
    .range([0.0, maxTimestamp])



    groupArray.forEach((id)=>{
        let groupedObj = filteredMissionData.filter(obj => obj.skill_id == id)
        if (groupedObj.length>0 && groupby=="skill")
            eventTimelineGroup.append("text").attr("x", xEventTimelineScale.range()[1]/2 - margins.eventTimeline.left/2).attr("y", currentY-24).text("Skill: "+ id).style("font-size", "16px").attr("text-anchor","middle").style("fill","black")
        else
            return

        currentY+=5
        eventTimelineGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${currentY})`)
            .call(d3.axisTop(xEventTimelineScale)
                .tickValues([0, maxTimestamp/2, maxTimestamp])
                .tickFormat(d => Math.round(d/60) + "min"));
        
        currentY+=15

        groupedObj.forEach((sessionMission)=>{
            ////////////////////////////////////////
            // Session Title
            // - Recording Name
            let sessionTitle
            // Sonia Trial instead of S .text(" "+ sessionMission.session_id)
            sessionTitle=eventTimelineGroup.append("text").attr("x", xEventTimelineScale.range()[0]-margins.eventTimeline.left + 56).attr("y", currentY+3 + 5).text(" "+ sessionMission.session_id).style("font-size", "10px").attr("text-anchor","start").style("fill","black").attr("data-session", sessionMission.session_id).attr("data-skill", sessionMission.skill_id)
            .on("click",(event, d) =>{

                let sessionToRemove;
                let skillToRemove;
                if (typeof event.target != 'undefined') {
                    sessionToRemove = event.srcElement.getAttribute("data-session")
                    skillToRemove = event.srcElement.getAttribute("data-skill")
                }
                else{    
                    return
                }
                selectedItems = selectedItems.filter(function(item) {
                    return !(item.trial == sessionToRemove && item.subject == skillToRemove);
                });
                set_selectedItems(selectedItems);
                updateEventTimeline( dataFiles )
                // updateMatrix( dataFiles )
                // updatepredictionSessions( dataFiles)
                // updateHl2Details( dataFiles);
                
            })
            currentY+=14

            // - Box to hold recording Name
            let bbox = sessionTitle.node().getBBox();
            eventTimelineGroup.append("rect")
                .attr("x", bbox.x - 2)
                .attr("y", bbox.y - 2)
                .attr("width", bbox.width + 4)
                .attr("rx",5)
                .attr("ry",5)
                .attr("data-session", sessionMission.session_id)
                .attr("data-skill", sessionMission.skill_id)
                .attr("height", bbox.height + 4)
                .attr("stroke", "black")
                .style("fill", "none")
                .on("click", (event, d) => {
                    let sessionToRemove;
                    let skillToRemove;
                    if (typeof event.target != 'undefined') {
                        sessionToRemove = event.srcElement.getAttribute("data-session")
                        skillToRemove = event.srcElement.getAttribute("data-skill")
                    }

                    else{
                        return
                    }
                    selectedItems = selectedItems.filter(function(item) {
                        return !(item.session == sessionToRemove && item.skill == skillToRemove);
                    });
                    set_selectedItems(selectedItems);
                    updateEventTimeline( dataFiles )
                    // updateMatrix( dataFiles )
                    // updatepredictionSessions( dataFiles)
                    // updateHl2Details( dataFiles);

                });

            ////////////////////////////////////////
            // Data for Bar Charts
            let stepData = sessionMission.consolidatedStepData.step;
            // let stepData = sessionMission.consolidatedStepData.hlsLightnessAVG;
            // let errorData = sessionMission.consolidatedStepData.error;
            let predictionData = sessionMission.consolidatedStepData.prediction;
            let currentSession =  sessionMission.session_id;
            let currentSkill = sessionMission.skill_id;
            ////////////////////////////////////////
            // Bar Names
            // Create a tooltip element
            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("padding", "3px")
                .style("background-color", "white")
                .style("border", "1px solid #ccc")
                .style("border-radius", "3px")
                .style("box-shadow", "0px 0px 10px rgba(0, 0, 0, 0.1)")
                .style("font-size", "12px")  // Larger font size for the tooltip
                .style("visibility", "hidden");
            eventTimelineGroup.append("text").attr("x", xEventTimelineScale.range()[0] - 3).attr("y", currentY+18).text("Steps").style("font-size", "9px").attr("text-anchor","end").style("fill","black")
            .on("mouseover", function(event) {
                tooltip.style("visibility", "visible")
                    .text("Steps (Ground Truth)")
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });
            eventTimelineGroup.append("text").attr("x", xEventTimelineScale.range()[0]-3).attr("y", currentY+36).text("").style("font-size", "9px").attr("text-anchor","end").style("fill","black")
            eventTimelineGroup.append("text").attr("x", xEventTimelineScale.range()[0]-3).attr("y", currentY+55).text("Conf AVG").style("font-size", "9px").attr("text-anchor","end").style("fill","black")
            .on("mouseover", function(event) {
                tooltip.style("visibility", "visible")
                    .text("Average Confidence of Detected Objects")
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });
            
            ////////////////////////////////////////
            // Ground Truth Bar Chart
            // stepData.forEach(data => {
            //     // console.log(data);
            //     // console.log(stepColorScale(data.value));
            //     eventTimelineGroup.append("rect")
            //         .attr("x", xEventTimelineScale(data.startTimestamp))
            //         .attr("y", currentY)
            //         .attr("width", xEventTimelineScale(data.endTimestamp) - xEventTimelineScale(data.startTimestamp)) 
            //         .attr("height", 25)
            //         .style("fill", stepColorScale(data.value));
            // });
            // Extract session_ids from selectedItems for quick lookup
            // Convert session_ids from selectedItems to integers
            const selectedSessionIds = selectedItems.filter(obj => obj.skill == currentSkill && obj.session == currentSession).map(item => parseInt(item.session_id, 10));
            let stepColorScale = get_stepColorScale(dataFiles, currentSkill, currentSession); // Based on the labels contained in a session
            stepData.forEach(data => {
                // Determine if any session_id in selectedSessionIds matches data.session_ids
                const isHighlighted = data.session_ids.some(session_id => selectedSessionIds.includes(session_id));
                eventTimelineGroup.append("rect")
                    .attr("x", xEventTimelineScale(data.startTimestamp))
                    .attr("y", currentY)
                    .attr("width", xEventTimelineScale(data.endTimestamp) - xEventTimelineScale(data.startTimestamp)) 
                    .attr("height", 25)
                    .style("fill", isHighlighted && data.step_desc == "No step" ? "#8c0101" : isHighlighted ? stepColorScale(data.value) : "url(#pattern-id)" ); //d9d9d9
                    // .style("opacity", isHighlighted ? 1 : 1); // Highlight matched segments with full opacity, others with lower opacity
            });


            ////////////////////////////////////////
            // Ground Truth Bar Chart
            // stepData.forEach(data => {
            //     eventTimelineGroup.append("rect")
            //         .attr("x", xEventTimelineScale(data.startTimestamp))
            //         .attr("y", currentY)
            //         .attr("width", xEventTimelineScale(data.endTimestamp) - xEventTimelineScale(data.startTimestamp)) 
            //         .attr("height", 25)
            //         .style("fill", stepColorScale(data.value));
            // });

            
            currentY+=25;
            ////////////////////////////////////////
            // Error Bar Chart
            // errorData.forEach(data => {
            //     eventTimelineGroup.append("rect")
            //         .attr("x", xEventTimelineScale(data.startTimestamp))
            //         .attr("y", currentY+1)
            //         .attr("width", xEventTimelineScale(data.endTimestamp) - xEventTimelineScale(data.startTimestamp)) 
            //         .attr("height", 14)
            //         .style("fill", () => data.value == "error" || data.value == "Error" ? "black" : "#AEAEAE");
            // });

            currentY+=15;
            ////////////////////////////////////////
            // Prediction Bar Chart
            // predictionData.forEach(data => {
            //     eventTimelineGroup.append("rect")
            //         .attr("x", xEventTimelineScale(data.startTimestamp))
            //         .attr("y", currentY+1)
            //         .attr("width", xEventTimelineScale(data.endTimestamp) - xEventTimelineScale(data.startTimestamp)) 
            //         .attr("height", 24)
            //         .style("fill", stepColorScale(data.value));
            // });
            // let variableName= "Confidence" 
            let variableName= "objects_conf_avg" 
            let duration= allTimestamps['t'+sessionMission.session_id+"-s"+sessionMission.skill_id]

            // Create the y-axis with specific tick values
            let yAxis = d3.axisLeft(yScaleLine)
                .tickValues([1, 0]) // Use specific tick values
                .tickFormat(d3.format("d")); // Format ticks as integers
            // Append the y-axis to the SVG
            eventTimelineGroup.append("g")
                .attr("class", "y-axis") // Class for styling
                .attr('transform', `translate(1, ${currentY})`) // Position the axis 
                .call(yAxis) // Apply the axis to the group
                .selectAll("path, line") // Select axis path and lines
                .style("stroke", "lightgrey") // Change color of axis lines
                .style("fill", "none"); // Ensure no fill is applied

            // Add the confidence line
            eventTimelineGroup.append("path")
                .datum(sessionMission.data.filter(function(d) { return d.seconds >= 0 && d.seconds<=duration }))
                .attr("fill", "none")
                .attr("stroke", "black") // "#add8e6")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.8)
                .attr("d", d3.line()
                .x(function(d) { return xEventTimelineScale(d.seconds) })
                .y(function(d) { return currentY + yScaleLine(d[variableName] == -1 ? 0 : d[variableName]) }))
            
            currentY+=25;
            ////////////////////////////////////////
            // Phase Fligth removed
            
            currentY+=15
            ////////////////////////////////////////
            // Rectangle to hold individual summaries
            eventTimelineGroup.append("rect")
                .attr("x", 0)
                .attr("y", currentY-80)
                .attr("rx", 7)
                .attr("ry", 7)
                .attr("width", xEventTimelineScale.range()[1])
                .attr("height", 80)
                .style("stroke", "black")
                .style("stroke-width", "0.5px")
                .style("stroke-opacity", 0.7)
                .style("fill", "none")
                .style("fill-opacity", 0)
                //.style("stroke-dasharray", "10,10");

            ////////////////////////////////////////
            // BRUSH
            let brush = d3.brushX()
                .extent([[0, currentY-80], [xEventTimelineScale.range()[1] , currentY]])
                .on("start", brushstart)
                .on("end", brushended);
            
            brushesAdded.push(brush)
            brushIndices.push[{session:sessionMission.session_id, skill:sessionMission.skill_id, brushAt:brushCount}]
            brushCount+=1

            eventTimelineGroup.append("g")
                .attr("class", "brush timelinebrush brush-t"+sessionMission.session_id+"-s"+sessionMission.skill_id)
                .attr("data-session",sessionMission.session_id)
                .attr("data-skill",sessionMission.skill_id)
                .datum({brush:brush})
                .call(brush);
            //clear all other brushes when brushing starts
            function brushstart(){
                let allBrushes = eventTimelineGroup.selectAll(".timelinebrush").nodes()
                allBrushes.forEach((eachBrush)=>{
                    if (eachBrush !=this)
                        d3.select(eachBrush).call(d3.brush().move, null); 
                })
            }   

            // Brushing end 
            function brushended (e){
                console.log("brush ended")

                // matrixGroup.selectAll(".highlight-arcs")
                //     .classed("highlight-arcs", false)

                // matrixGroup.selectAll(".arc>path")
                //     .style("fill-opacity",1)

                // matrixGroup.selectAll(".circle")
                //     .style("fill-opacity",1)


                if (e.selection == null){ // No selection using brushing (Clean brushing).
                    set_brushedSession(null);
                    set_brushedSkill(null);
                    set_selectedItems(get_originalSelectedItems());
                    updateKeyFrames( dataFiles);
                    d3.selectAll(".hide-bar")
                        .classed("hide-bar",false);
                        // updateHl2Details( dataFiles);
                    // Update scatterplot using original SelectedItems.
                    updateScatterplotUsingOriginalSelectedItems();
                    return
                }

                if (typeof e.sourceEvent != 'undefined') {
                    brushedSession = e.sourceEvent.srcElement.parentElement.getAttribute("data-session")
                    brushedSkill = e.sourceEvent.srcElement.parentElement.getAttribute("data-skill")
                    set_brushedSession(brushedSession);
                    set_brushedSkill(brushedSkill);
                }
                brushedSkill = get_brushedSkill();
                brushedSession = get_brushedSession();  
                vidStart = reverseTimelineScale(e.selection[0])
                vidEnd = reverseTimelineScale(e.selection[1])
                set_vidStart(vidStart);
                set_vidEnd(vidEnd);
                let videoPath = get_videoPath(brushedSkill, brushedSession);
                // playVideoWithStartTime(videoPath, vidStart);

                d3.selectAll(".error-session-bar")
                    .classed("hide-bar",true);
                d3.selectAll(".prediction-session-bar")
                    .classed("hide-bar",true);
                d3.selectAll(".t"+brushedSession+"-s"+brushedSkill)
                    .classed("hide-bar",false)

                let sessionObject = dataFiles[0].filter(obj => obj.skill_id == brushedSkill && obj.session_id == brushedSession)[0]
                let stepIndexes = [];
                let stepSessionIDs = [];
                let stepFrameIDs = [];

                sessionObject['consolidatedStepData'].step.forEach((step) => {
                // sessionObject['consolidatedStepData'].hlsLightnessAVG.forEach((step) => {
                    if (step.startTimestamp > vidStart && step.startTimestamp < vidEnd) {
                        let innerArray = step.session_ids;
                        let innerFrameIDs = step.frame_id;
                        innerArray.forEach(value => stepSessionIDs.push(value));
                        innerFrameIDs.forEach(value => stepFrameIDs.push(value));
                        
                    } else if (step.endTimestamp > vidStart && step.startTimestamp < vidEnd) {
                        let innerArray = step.session_ids;
                        let innerFrameIDs = step.frame_id;

                        innerArray.forEach(value => stepSessionIDs.push(value));
                        innerFrameIDs.forEach(value => stepFrameIDs.push(value));

                    }
                });
                // Generate the list of image paths
                let path_frames = stepSessionIDs.map((item, idx )=> {
                    return {
                        skill: brushedSkill,
                        session: brushedSession,
                        session_id: String(item),
                        frame_id: String(stepFrameIDs[idx]),
                        objects_class: getIndividualFrameInfo(dataFiles[2], String(item), brushedSession, brushedSkill, "objects_class"),
                        objects_conf: getIndividualFrameInfo(dataFiles[2], String(item), brushedSession, brushedSkill, "objects_conf"),
                        step_label: getIndividualFrameInfo(dataFiles[2], String(item), brushedSession, brushedSkill, "step_label"),
                        step_label_desc: getIndividualFrameInfo(dataFiles[2], String(item), brushedSession, brushedSkill, "step_label_desc")
                    };
                });
                set_selectedItems(path_frames);
                // updateScatterplot(dataFiles);
                updateKeyFrames( dataFiles);
                d3.selectAll(".scatterpoints").classed("unselectedscatter", true);

                path_frames.forEach((item) => {
                    d3.selectAll(".scatterpoints")
                        .filter(d => d.skill === item.skill && d.session === item.session && d.session_id === item.session_id)
                        .classed("unselectedscatter", false);
                });
            }

            currentY+=10

            if (eventTimelineSvg.attr("height")<=currentY+200){
                eventTimelineGroup.attr("height",currentY+200)
                eventTimelineSvg.attr("height",currentY+250+margins.eventTimeline.top+margins.eventTimeline.bottom)     
            }
        })
        currentY+=50
        if (eventTimelineSvg.attr("height")<=currentY+200){
            eventTimelineGroup.attr("height",currentY+200)
            eventTimelineSvg.attr("height",currentY+250+margins.eventTimeline.top+margins.eventTimeline.bottom)     
        }
    })
    set_brushesAdded(brushesAdded);
}