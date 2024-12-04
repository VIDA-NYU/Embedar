// Compute unique sources, trials and subjects

let brushedSession = null;
let brushedSkill = null;
let brushesAdded=[];
let brushIndices=[];
let vidStart = 0;
let vidEnd = 5;

export function set_brushedSession(value){
    brushedSession = value;
}
export function get_brushedSession(){
    return brushedSession;
}

export function set_brushedSkill(value){
    brushedSkill = value;
}
export function get_brushedSkill(){
    return brushedSkill;
}

export function set_brushesAdded(value){
    brushesAdded = value;
}
export function get_brushesAdded(){
    return brushesAdded;
}

export function set_brushIndices(value){
    brushIndices = value;
}
export function get_brushIndices(){
    return brushIndices;
}

export function set_vidStart(value){
    vidStart = value;
}
export function get_vidStart(){
    return vidStart;
}

export function set_vidEnd(value){
    vidEnd = value;
}
export function get_vidEnd(){
    return vidEnd;
}

