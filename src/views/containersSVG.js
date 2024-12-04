// Import D3
import * as d3 from 'd3';
import { get_margins } from './config';
let 
    scatterSvg, scatterGroup, scatterTooltip,
    scatterSvg2, scatterGroup2, scatterTooltip2,
    scatterSvg3, scatterGroup3, scatterTooltip3,
    frameSvg, frameGroup, frameTooltip,
    eventTimelineSvg , 
    eventTimelineGroup, 
    predictionSessionsSvg, predictionSessionsGroup,
    timeDistSvg, timeDistGroup,
    scatterplotStatisticsSvg;

//initialise svgs
export function initialise_svgs(){

    let margins = get_margins();

    // Helper function to create a scatterplot
    const createScatterplotContainer = (divId) => {
        let scatterplotDiv = d3.select(divId);
        let svg = scatterplotDiv.append("svg")
            .attr("width", scatterplotDiv.node().clientWidth)
            // .attr("height", 265);
            .attr("height", 265 - margins.scatterplot.top - margins.scatterplot.bottom);
        let group = svg.append("g")
            .attr("transform", `translate(${margins.scatterplot.left}, ${margins.scatterplot.top})`)
            .attr("width", scatterplotDiv.node().clientWidth - margins.scatterplot.left - margins.scatterplot.right)
            .attr("height", svg.attr("height") - margins.scatterplot.top); // translate

            // .attr("height", scatterplotDiv.node().clientHeight - margins.scatterplot.top - margins.scatterplot.bottom);
        
        // Append tooltip
        let tooltip =scatterplotDiv.append("div")
            .attr("class", "tooltip")
            // .style("opacity",0.9)
            .style("visibility","hidden")
            .style("position", "absolute")
            //.style("width","150px")
            .style("background-color", "white")
            .style("padding", "8px")
            .style("border-radius", "2px")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
            .style("text-align", "left"); // Add text-align: left to align text left
            ;
        return { svg, group, tooltip };
    };

    // Create Scatterplots
    ({ svg: scatterSvg, group: scatterGroup, tooltip: scatterTooltip } = createScatterplotContainer("#scatterplot-container"));
    ({ svg: scatterSvg2, group: scatterGroup2, tooltip: scatterTooltip2 } = createScatterplotContainer("#scatterplot2-container"));
    ({ svg: scatterSvg3, group: scatterGroup3, tooltip: scatterTooltip3 } = createScatterplotContainer("#scatterplot3-container"));

    //Frame 
    let frameDiv= d3.select("#key-frame-container")  
    frameSvg = frameDiv
        .append("svg")
        .attr("width", frameDiv.node().clientWidth)
        .attr("height", 200)
        
    frameGroup = frameSvg.append("g")
        .attr("transform", `translate(${margins.frame.left}, ${margins.frame.top})`)
        .attr("width", frameDiv.node().clientWidth -margins.frame.left - margins.frame.right )
        .attr("height", frameDiv.node().clientHeight - margins.frame.top - margins.frame.bottom);

    frameTooltip =frameDiv.append("div")
        .attr("class", "tooltip")
        .style("opacity",0.9)
        .style("visibility","hidden")
        .style("position", "absolute")
        .style("font-size","0.75em")
        //.style("width","150px")
        .style("z-index",1000)
        .style("background-color", "white")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
        .style("text-align", "left"); // Add text-align: left to align text left;

    //eventtimeline
    let eventTimelineDiv= d3.select("#event-timeline-container")  
    eventTimelineSvg = eventTimelineDiv
        .append("svg")
        .attr("width", eventTimelineDiv.node().clientWidth)
        .attr("height", 200)
        
    eventTimelineGroup= eventTimelineSvg.append("g")
        .attr("transform", `translate(${margins.eventTimeline.left}, ${margins.eventTimeline.top})`)
        .attr("width", eventTimelineDiv.node().clientWidth -margins.eventTimeline.left - margins.eventTimeline.right )
        .attr("height", eventTimelineDiv.node().clientHeight - margins.eventTimeline.top - margins.eventTimeline.bottom);    

    //eventtimeline
    scatterplotStatisticsSvg= d3.select("#scatterplot-statistics-svg")  
    scatterplotStatisticsSvg
        .attr("transform", `translate(55, 0)`);

    //predictionsessions
    // let predictionSessionsDiv= d3.select("#prediction-sessions-container")  
    
    // predictionSessionsSvg = predictionSessionsDiv
    //     .append("svg")
    //     .attr("width", predictionSessionsDiv.node().clientWidth)
    //     .attr("height", 200)
        
    // predictionSessionsGroup = predictionSessionsSvg.append("g")
    //     .attr("transform", `translate(${margins.predictionSessions.left}, ${margins.predictionSessions.top})`)
    //     .attr("width", predictionSessionsDiv.node().clientWidth -margins.predictionSessions.left - margins.predictionSessions.right )
    //     .attr("height", predictionSessionsDiv.node().clientHeight - margins.predictionSessions.top - margins.predictionSessions.bottom); 
}

//  scatterplot
export function get_scatterStatisticsSvg(){
    return scatterplotStatisticsSvg;
}

//  scatterplot
export function get_scatterSvg(){
    return scatterSvg;
}
export function get_scatterGroup(){
    return scatterGroup;
}
export function get_scatterTooltip(){
    return scatterTooltip;
}

//  scatterplot
export function get_scatterSvg2(){
    return scatterSvg2;
}
export function get_scatterGroup2(){
    return scatterGroup2;
}
export function get_scatterTooltip2(){
    return scatterTooltip2;
}
//  scatterplot
export function get_scatterSvg3(){
    return scatterSvg3;
}
export function get_scatterGroup3(){
    return scatterGroup3;
}
export function get_scatterTooltip3(){
    return scatterTooltip3;
}

//  key frame 
export function get_frameSvg(){
    return frameSvg;
}
export function get_frameGroup(){
    return frameGroup;
}
export function get_frameTooltip(){
    return frameTooltip;
}

// timeline
export function get_eventTimelineSvg(){
    return eventTimelineSvg;
}
export function get_eventTimelineGroup(){
    return eventTimelineGroup;
}
// prediction session
export function get_predictionSessionsSvg(){
    return predictionSessionsSvg;
}
export function get_predictionSessionsGroup(){
    return predictionSessionsGroup;
}
// time distribution
export function get_timeDistSvg(){
    return timeDistSvg;
}
export function get_timeDistGroup(){
    return timeDistGroup;
}