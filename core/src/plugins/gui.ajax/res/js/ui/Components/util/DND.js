const FuncUtils = require("pydio/util/func")
const ResourcesManager = require("pydio/http/resources-manager")

/******************************/
/* REACT DND GENERIC COMPONENTS
 /******************************/
const Types = {
    NODE_PROVIDER: 'node',
    SORTABLE_LIST_ITEM:'sortable-list-item'
};

/**
 * Specifies which props to inject into your component.
 */
function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    };
}

function collectDrop(connect, monitor){
    return {
        connectDropTarget: connect.dropTarget(),
        canDrop: monitor.canDrop(),
        isOver:monitor.isOver(),
        isOverCurrent:monitor.isOver({shallow:true})
    };
}

class DNDActionParameter{
    constructor(source, target, step){
        this._source = source;
        this._target = target;
        this._step = step;
    }
    getSource(){
        return this._source;
    }
    getTarget(){
        return this._target;
    }
    getStep(){
        return this._step;
    }
}

DNDActionParameter.STEP_BEGIN_DRAG = 'beginDrag';
DNDActionParameter.STEP_END_DRAG = 'endDrag';
DNDActionParameter.STEP_CAN_DROP = 'canDrop';
DNDActionParameter.STEP_HOVER_DROP = 'hover';

let applyDNDAction = function(source, target, step){
    const {Controller} = window.pydio;
    const dnd = Controller.defaultActions.get("dragndrop");
    if(dnd){
        const dndAction = Controller.getActionByName(dnd);
        dndAction.enable();
        const params = new DNDActionParameter(source, target, step);
        const checkModule = dndAction.options.dragndropCheckModule;
        if(step === DNDActionParameter.STEP_CAN_DROP && checkModule){
            if(!FuncUtils.getFunctionByName(checkModule, window)) {
                ResourcesManager.detectModuleToLoadAndApply(checkModule, ()=>{});
                throw new Error('Cannot find test module, trying to load it');
            }
            FuncUtils.executeFunctionByName(dndAction.options.dragndropCheckModule, window, Controller, params);
        }else{
            dndAction.apply(params);
        }
    }else{
        throw new Error('No DND Actions available');
    }
};

/****************************/
/* REACT DND DRAG/DROP NODES
 /***************************/

const nodeDragSource = {
    beginDrag: function (props) {
        // Return the data describing the dragged item
        return { node: props.node };
    },

    endDrag: function (props, monitor, component) {
        if (!monitor.didDrop()) {
            return;
        }
        const item = monitor.getItem();
        const dropResult = monitor.getDropResult();
        try{
            applyDNDAction(item.node, dropResult.node, DNDActionParameter.STEP_END_DRAG);
        }catch(e){

        }
    }
};

const nodeDropTarget = {

    hover: function(props, monitor){
    },

    canDrop: function(props, monitor){

        const source = monitor.getItem().node;
        const target = props.node;

        try{
            applyDNDAction(source, target, DNDActionParameter.STEP_CAN_DROP);
        }catch(e){
            return false;
        }
        return true;
    },

    drop: function(props, monitor){
        const hasDroppedOnChild = monitor.didDrop();
        if (hasDroppedOnChild) {
            return;
        }
        return { node: props.node }
    }

};



export {Types, collect, collectDrop, nodeDragSource, nodeDropTarget, DNDActionParameter}