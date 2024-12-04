import * as d3 from 'd3';
import { get_selectedFnirs, get_allTimestamps, get_selectedImu, get_selectedGaze } from './config';
import { get_eventTimelineGroup, get_hl2Group } from './containersSVG';
import { addTimeUpdateListener, get_videoPlayer, reset_videoPlayer } from './videoPlayerUtils';
import { get_brushedSkill, get_brushedSession, get_brushesAdded, get_vidEnd, get_vidStart } from './configVideoPlayer';
import { get_xEventTimelineScale } from './EventTimeline';
export function cleanUpdateHl2Details( brushedSkill ){
    // get svgs
    let hl2Group = get_hl2Group();

    hl2Group.selectAll('*').remove();
    d3.select("#gaze-header")
        .style("visibility","hidden")
    
    d3.select("#imu-header")
        .style("visibility","hidden")

    d3.select("#fnirs-title-header")
        .style("visibility","hidden")
    console.log("start initialization");
    
    if (brushedSkill == null){
        reset_videoPlayer()
        console.log("start return initialization");
        return
    }
}
export function updateHl2Details( dataFiles){

    console.log("updateHl2Details");

    // get svgs
    let eventTimelineGroup = get_eventTimelineGroup();
    let hl2Group = get_hl2Group();
    let brushedSkill = get_brushedSkill();
    let brushedSession = get_brushedSession();
    let brushesAdded = get_brushesAdded();
    let xEventTimelineScale= get_xEventTimelineScale();
    let vidStart = get_vidStart();
    let vidEnd = get_vidEnd();

    cleanUpdateHl2Details( brushedSkill );

    if (brushedSkill == null){
        return
    }

    // get selected value from dropdown menus
    let selectedImu = get_selectedImu();
    let selectedGaze = get_selectedGaze();

    console.log("end initialization");
    d3.select("#gaze-header")
        .style("visibility","visible")

    d3.select("#imu-header")
        .style("visibility","visible")

    d3.select("#fnirs-title-header")
        .style("visibility","visible")

    let allTimestamps = get_allTimestamps();

    let duration = allTimestamps['t'+brushedSession+"-s"+brushedSkill]

    let xScaleHL2 = d3.scaleLinear()
        .domain([0, duration])
        .range([0,hl2Group.attr("width")])

    hl2Group.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, -5)`)
        .call(d3.axisTop(xScaleHL2)
            .tickValues([0, duration/2, duration])
            .tickFormat(d => Math.round(d/60) + "min"));

    hl2Group.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, 185)`)
        .call(d3.axisTop(xScaleHL2)
            .tickValues([0, duration/2, duration])
            .tickFormat(d => Math.round(d/60) + "min"));
    
    hl2Group.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, 375)`)
        .call(d3.axisTop(xScaleHL2)
        .tickValues([0, duration/2, duration])
        .tickFormat(d => Math.round(d/60) + "min"));



    let xScaleHL2reverse =  d3.scaleLinear()
        .domain([0,hl2Group.attr("width")])
        .range([0, duration])

    let yScaleGaze = d3.scaleLinear()
        .domain([1, -1])
        .range([0, 120])
    
    let maxImu = dataFiles[7].reduce((tempMax, obj) => Math.max(tempMax, obj[selectedImu]), dataFiles[7][0][selectedImu])
    let minImu = dataFiles[7].reduce((tempMin, obj) => Math.min(tempMin, obj[selectedImu]), dataFiles[7][0][selectedImu])

    let yScaleImu = d3.scaleLinear()
        .domain([minImu - ((maxImu-minImu)*0.1) ,maxImu + ((maxImu-minImu)*0.1)])
        .range([120,0])
    
    hl2Group.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(-10, 0)`)
        .call(d3.axisLeft(yScaleImu)
            .tickValues([ yScaleImu.domain()[1], (maxImu+minImu)/2, yScaleImu.domain()[0]])
            .tickFormat(d=>Math.round(d)));

    hl2Group.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(-10, 190)`)
        .call(d3.axisLeft(yScaleGaze)
            .tickValues([-1,0,1])
            .tickFormat(d=>Math.trunc(d)));

    hl2Group.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("rx",5)
        .attr("ry", 7)
        .attr("width", xScaleHL2.range()[1])
        .attr("height", 120)
        .style("stroke", "black")
        .style("stroke-width", "0.5px")
        .style("stroke-opacity", 0.7)
        .style("fill", "none")
        .style("fill-opacity", 0)

    hl2Group.append("rect")
        .attr("x", 0)
        .attr("y", 190)
        .attr("rx",5)
        .attr("ry", 7)
        .attr("width", xScaleHL2.range()[1])
        .attr("height", 120)
        .style("stroke", "black")
        .style("stroke-width", "0.5px")
        .style("stroke-opacity", 0.7)
        .style("fill", "none")
        .style("fill-opacity", 0)

    // Draw a dashed vertical line
    hl2Group.append("line")
        .attr("class","seekline")
        .attr("x1", xScaleHL2(get_videoPlayer().currentTime)) 
        .attr("y1", 0) 
        .attr("x2",  xScaleHL2(get_videoPlayer().currentTime)) 
        .attr("y2", 120) 
        .style("stroke", "black")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "5,5");

    hl2Group.append("line")
        .attr("class","seekline")
        .attr("x1", xScaleHL2(get_videoPlayer().currentTime))
        .attr("y1", 190) 
        .attr("x2",  xScaleHL2(get_videoPlayer().currentTime))
        .attr("y2", 310) 
        .style("stroke", "black")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "5,5");

    let imubrush = d3.brushX()
        .extent([[0, 0], [ xScaleHL2.range()[1] , 120]])
        .on("end", hl2brushend);

    let gazebrush = d3.brushX()
        .extent([[0, 190], [ xScaleHL2.range()[1] , 310]])
        .on("end", hl2brushend);
    
    let fnirsbrush = d3.brushX()
        .extent([[0, 380], [ xScaleHL2.range()[1] , 415]])
        .on("end", hl2brushend);

    hl2Group.append("path")
        .datum(dataFiles[7].filter(obj => obj.skill_id == brushedSkill && obj.session_id == brushedSession && obj.seconds <= duration))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)    
        .attr("stroke-opacity", 0.8)
        .attr("d", d3.line()
        .x(function(d) { return xScaleHL2(d.seconds) })
        .y(function(d) { return yScaleImu(d[selectedImu]) }))

    hl2Group.append("path")
        .datum(dataFiles[6].filter(obj => obj.skill_id == brushedSkill && obj.session_id == brushedSession && obj.seconds <= duration))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)    
        .attr("stroke-opacity", 0.8)
        .attr("d", d3.line()
        .x(function(d) { return xScaleHL2(d.seconds) })
        .y(function(d) { return 190 + yScaleGaze(d[selectedGaze]) }))
    
    let filteredFnirs = dataFiles[3].filter(obj => obj.skill_id == brushedSkill && obj.session_id == brushedSession)
    
    if (filteredFnirs.length==1){

        let fnirsToDisplay = filteredFnirs[0]
        
        fnirsToDisplay.consolidatedFNIRS[get_selectedFnirs()].forEach(data => {
            hl2Group.append("rect")
                .attr("x", xScaleHL2(data.startTimestamp))
                .attr("y", 380)
                .attr("width", xScaleHL2(data.endTimestamp) - xScaleHL2(data.startTimestamp)) 
                .attr("height", 35)
                .style("fill", () => {return data.value == "Underload" ? "#ffb0b0" : data.value == "Overload" ? "#99070d" : "#eb5a4d";});
        });
    }
    
    let gazeBrushGroup = hl2Group.append("g")
        .attr("class", "brush gazebrush")
        .call(gazebrush, [ xScaleHL2.range()[0],xScaleHL2.range()[1]]);

    let imuBrushGroup = hl2Group.append("g")
        .attr("class", "brush imubrush")
        .call(imubrush);

    let fnirsBrushGroup = hl2Group.append("g")
        .attr("class", "brush fnirsbrush")
        .call(fnirsbrush);

    gazeBrushGroup.call(gazebrush.move, [ xScaleHL2(vidStart),xScaleHL2(vidEnd)]);
    imuBrushGroup.call(imubrush.move, [ xScaleHL2(vidStart),xScaleHL2(vidEnd)]);
    fnirsBrushGroup.call(fnirsbrush.move, [ xScaleHL2(vidStart),xScaleHL2(vidEnd)]);
    
    addTimeUpdateListener(vidStart, vidEnd, xScaleHL2);

    function hl2brushend(e){
        if (typeof e.sourceEvent != 'undefined') {          
            let newt1 = xScaleHL2reverse(e.selection[0])  
            let newt2 = xScaleHL2reverse(e.selection[1])
            let allBrushes = eventTimelineGroup.selectAll(".timelinebrush").nodes()
            allBrushes.forEach((eachBrush)=>{
                let className = "brush-t"+brushedSession+"-s"+brushedSkill
                if (d3.select(eachBrush).classed(className)){
                    let curBrush = d3.select(eachBrush)
                    curBrush.call(brushesAdded[0].move, [xEventTimelineScale(newt1), xEventTimelineScale(newt2)]); 
                }
            })    
        }

    }
}

