/**
* dat-guiVR Javascript Controller Library for VR
* https://github.com/dataarts/dat.guiVR
*
* Copyright 2016 Data Arts Team, Google Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import { createToolTip } from './textlabel';
import createInteraction from './interaction';
import * as Colors from './colors';
import * as Layout from './layout';
import * as Graphic from './graphic';
import * as SharedMaterials from './sharedmaterials';
import * as Grab from './grab';
import * as Palette from './palette';
import { getTopLevelFolder, setBoxFromObject, setVisibility } from './utils';
import { FOLDER_WIDTH } from './layout';

//If you're looking for main createFolder function, it's further below...

/**
 * Not entirely sure about starting to add this kind of global state manaagement here...
 * This is for z-order in 2d orthographic mode, and maybe some other things one day.
 */
const topFolderStack = [];

const scratchFolderBox = new THREE.Box3(), scratchCamBox = new THREE.Box3(), scratchSize = new THREE.Vector3();

function orthographicFolderLayout() {
  const cam = topFolderStack[0].userData.isOrthographic;
  if (!cam || topFolderStack.length <= 1) return;
  //camBoxSetup(cam);
  const tfs = topFolderStack.filter(x => x.visible);
  const near = cam.near, far = cam.far, n = tfs.length;
  const zs = tfs.map(f => f.position.z).sort((a,b)=>a-b);
  zs[-1] = -9999; // I suppose this is to deal with accessing zs[i-1] below ¯\_(ツ)_/¯
  zs.forEach( (z,i) => zs[i] = Math.max(zs[i], zs[i-1] + 10*Layout.PANEL_DEPTH)); // in case of equals
  
  tfs.forEach((f, i) => {
    //let z = -0.9*far + i*10*Layout.PANEL_DEPTH;
    const z = zs[i];
    if (z !== f.position.z) {
      f.position.z = z;
      f.updateMatrix();
      f.fixFolderPosition();
    }
  });
  if (tfs[n-1].position.z >= near - Layout.PANEL_DEPTH) {
    console.log("GUIVR Warning: likely problem with z-order in orthographicFolderLayout");
  }
  //console.log(`[${topFolderStack.map(f=>f.folderName + '\t: ' + f.position.z).join('\n')}]`);
}

function camBoxSetup(cam) {
  if (!cam.isOrthographicCamera) return;
  const near = cam.near, far = cam.far, n = topFolderStack.length;
  const l = cam.left, r = cam.right, t = cam.top, b = cam.bottom;
  const z = cam.position.z; //not strictly right...
  scratchCamBox.min.set(l, b, -far + z);
  scratchCamBox.max.set(r, t, -near + z);
  return scratchCamBox;
}

export default function createFolder({
  textCreator,
  name,
  guiAdd,
  guiRemove,
  addControllerFuncs,
  globalControllers
} = {} ){

  const MAX_FOLDER_ITEMS_IN_COLUMN = 25;

  const width = Layout.FOLDER_WIDTH;
  const depth = Layout.PANEL_DEPTH;

  const state = {
    collapsed: false,
    previousParent: undefined
  };

  const group = new THREE.Group();
  group.guiType = "folder";
  group.toString = () => `[${group.guiType}: ${name}]`;

  const collapseGroup = new THREE.Group();
  group.add( collapseGroup );

  var isAccordion = false;
  /** When true, will keep only one child folder of this folder open at a time.
   * Siblings automatically close.
   */
  Object.defineProperty( group, 'accordion', {
    get: () => {
      return isAccordion;
    },
    set: ( newValue ) => {
      if ( newValue && !isAccordion ) group.guiChildren.filter( c=>c.isFolder ).map( c=>c.close() );
      isAccordion = newValue;
      group.requestLayout();
    }
  });

  //flag the need for performing layout of the folder hierarchy in which this is contained.
  group.requestLayout = () => {
    const topFolder = getTopLevelFolder(group);
    if (topFolder.userData.layoutInProgress) {
      console.log(`requested layout of folder ${group.folderName} while layout already in progress...`);
    }
    else {
      //topFolder.requestLayout();
      topFolder.userData.layoutPending = true;
    }
  }
  //should only be called from index.js update(?) for each topFolder, then from within performLayout() for each child folder
  group.performLayout = performLayout;

  const straightRotation = new THREE.Quaternion();
  //provide arguments for how constrained to be, and re-use same function both on detach and elsewhere?
  group.fixFolderPosition = function(thresh=0.01) {
    const f = this;
    if (!f.userData.isOrthographic) return;
    //always force rotation straight forward...
    f.setRotationFromQuaternion(straightRotation);

    //we need to avoid NaN because of TextGeometry position having itemSize == 2 which upsets Vector3.fromBufferAttribute
    //https://github.com/mrdoob/three.js/issues/14352
    //maybe I could use a Box2 anyway since 3d might just confuse things.
    const box = setBoxFromObject(scratchFolderBox, f);
    const boxW = box.max.x - box.min.x, boxH = box.max.y-box.max.y;
    
    const cam = f.userData.isOrthographic;
    const camBox = camBoxSetup(cam); //bit wasteful to call this here, but insignificant.
    //really, I want to know if it's 'mostly' invisible.
    //Using two boxes, rather than frustum.setFromMatrix( mat.multiplyMatrices( cam.projectionMatrix, cam.matrixWorldInverse ) );
    //(frustum is unnecessary *cough*if we assume orthographic perspective, no camera transform & are generally lax about z*)
    const intersection = box.intersect(camBox); //careful of order; intersect() mutates
    //(XXX: strictly speaking, ideally I would take camera matrixWorld into account if I want to be proper)
    //(might just make log a warning if it's set how I don't expect it, but prefer not to leave traps.)
    
    //look at dimensions of intersection and force inwards if necessary...
    const intersectionSize = intersection.getSize(scratchSize);
    const screenW = cam.right - cam.left, screenH = cam.top - cam.bottom;
    //work in units as fraction of box width (although that's not a great idea with multi-column folders)
    intersectionSize.x /= boxW; intersectionSize.y /= boxW;
    let needsUpdate = false;
    //console.log(`${f.folderName}: ${JSON.stringify(intersectionSize)}, thresh: ${thresh}`);
    if (intersectionSize.x < thresh) { //TODO: paramaterise / non-magic-number
      //TODO work out which side we're on, move by object width...
      f.position.x = cam.left + screenW/2;
      needsUpdate = true;
    }
    if (intersectionSize.y < thresh) {
      f.position.y = cam.bottom + screenH/2;
      needsUpdate = true;
    }
    if (needsUpdate) f.updateMatrix();
  }

  group.isCollapsed = () => { return state.collapsed }
  
  //useful to have access to this as well. Using in remove implementation
  Object.defineProperty(group, 'guiChildren', {
    //perhaps modalEditor should also count as a member of this...
    //currently can't see anything in implementation that would require that
    //-- adding headerItems though, so they'll get picked up by remove()
    // - maybe same should apply to modalEditor
    get: () => { return [ ...collapseGroup.children, ...headerItems.children ] }
  });
  // returns true if all of the supplied args are members of this folder
  group.hasChild = function ( ...args ){
    return !args.includes((obj) => { return group.guiChildren.indexOf(obj) === -1});
  }

  group.folderName = name; //for debugging
  
  //  Yeah. Gross.
  const addOriginal = THREE.Group.prototype.add;
  //as long as no-one expects this to behave like a regular THREE.Group, the changed definition of remove shouldn't hurt
  const removeOriginal = THREE.Group.prototype.remove; 

  function addImpl( o ){
    // I could change this function as part of a refactor to place everything at topFolder level...
    // is that a good idea, or a bad idea?
    addOriginal.call( group, o );
  }
  function removeImpl( o ){
    removeOriginal.call( group, o );
  }

  //addImpl( collapseGroup ); //redundant.

  const panel = Layout.createPanel( width, Layout.FOLDER_HEIGHT, depth, true );
  addImpl( panel );

  const descriptorLabel = textCreator.create( name );
  descriptorLabel.position.x = Layout.PANEL_LABEL_TEXT_MARGIN * 1.5;
  descriptorLabel.position.y = -0.03;
  descriptorLabel.position.z = depth;
  panel.add( descriptorLabel );

  const downArrow = Layout.createDownArrow();
  Colors.colorizeGeometry( downArrow.geometry, 0xffffff );
  downArrow.position.set( 0.05, 0, depth  * 1.01 );
  panel.add( downArrow );

  const grabber = Layout.createPanel( width, Layout.FOLDER_GRAB_HEIGHT, depth, true );
  grabber.position.y = Layout.FOLDER_HEIGHT * 0.86; //XXX: magic number
  grabber.name = 'grabber';
  addImpl( grabber );

  const grabBar = Graphic.grabBar();
  grabBar.position.set( width * 0.5, 0, depth * 1.001 );
  grabber.add( grabBar );
  group.isFolder = true;
  group.hideGrabber = function() { grabber.visible = false };
  group.showGrabber = function() { grabber.visible = true };
  group.hideHeader = function() { 
    group.hideGrabber();
    //descriptorLabel.visible = downArrow.visible = panel.visible = false;
    panel.visible = false;
  };
  group.showHeader = () => {
    //grabber.visible = descriptorLabel.visible = downArrow.visible = panel.visible = true;
    panel.visible = true;
  };

  //TODO: interface for adding things to this... NOT 'showInFolderHeader' method / property on linear items...
  const headerItems = new THREE.Group();
  panel.add(headerItems);
  //this function will attempt to make obj behave as controller layed out in headerItems,
  //based on some assumptions about obj that may be true at time of writing...
  //but are pending more rigorous specification / refactoring etc.
  group.addHeaderItem = function(obj){
    headerItems.add(obj);
    obj.folder = group;
    obj.isHeaderObject = true;

    //also need to add to global controllers list etc. NB:: make sure that they will get removed as well
    //--- this generic interaction.update doesn't make listen() work properly.
    if (!obj.updateControl) obj.updateControl = inputObjects => obj.interaction.update(inputObjects);
    obj.hitscan = [ obj ]; //hacky hacky
    globalControllers.push(obj);
  }



  const detachButtonMaterial = new THREE.MeshBasicMaterial({color: 0x888888, transparent: true});
  const h = Layout.FOLDER_HEIGHT * 0.8;
  const detachButtonRect = new THREE.BoxGeometry( h, h, Layout.BUTTON_DEPTH*2 );
  //somewhat backwards way of getting textures... TODO maybe change (along with other style consistency type stuff)
  const dockTexture = Graphic.dock().material.map;
  const undockTexture = Graphic.undock().material.map;
  detachButtonMaterial.map = undockTexture;
  const detachButton = new THREE.Mesh(  detachButtonRect, detachButtonMaterial );
  detachButton.visible = false;
  detachButton.position.x = Layout.FOLDER_WIDTH - Layout.FOLDER_HEIGHT;
  const detachButtonInteraction = createInteraction(detachButton);
  detachButton.interaction = detachButtonInteraction;
  detachButtonInteraction.events.on( 'onPressed', function( p ){
    if (group.detachedParent) {
      group.reattach();
    } else group.detach();
    p.locked = true;
  });
  //headerItems.add(detachButton);
  group.addHeaderItem(detachButton);

  let isDetachable = false;
  Object.defineProperty( group, 'detachable', {
    get: () => {
      return isDetachable;
    },
    set: ( newValue ) => {
      if (newValue === isDetachable) return;
      detachButton.visible = newValue;
      isDetachable = newValue;
    }
  });


  group.add = function( ...args ){
    const newController = guiAdd( ...args );

    if( newController ){
      group.addController( newController );
      return newController;
    }
    else{
      return new THREE.Group();
    }
  };

  /*
    Some controllers may bring up sub-GUIs which have the potential
    to overlap / clash.  This ensures only one is present at a time.
  */
  group.setModalEditor = function(e){
    //This could go wrong if folder hierarchy changes significantly.
    //Should be good enough for rock'n'roll (famous last words).
    //I could make it so that only one of these things was ever visible
    //across the entire system.  That should be easier to make robust, anyway...
    //and saves headaches down the line.
    const folder = getTopLevelFolder(group);
    if (folder.modalEditor) folder.modalEditor.visible = false;
    folder.modalEditor = e;
    if (!e) return;
    e.visible = true;
    if (e.performLayout) e.performLayout();
    folder.modalWasSetInCurrentFrame = true;
    //add a flag to all children recursively so that interaction system can identify them as belonging to a modal editor
    //TODO: skip if already done...
    function decorateChildren(parent) {
      parent.children.forEach(c => {
        c.userData.partOfModal = e;
        decorateChildren(c);
      });
    }
    decorateChildren(e);
  };

  /**
   * Removes the current modal editor from this folder
   * **but not if it was added during the current controller update,
   * as indicated by a flag set in setModalController and reset in index.js update**
   */
  group.clearModalEditor = function() {
    const folder = getTopLevelFolder(group);
    if (!folder.modalWasSetInCurrentFrame) {
      //folder.setModalEditor(null);
      if (folder.modalEditor) {
        folder.modalEditor.visible = false;
        folder.modalEditor = null;
      }
    }
  };


  /* 
  Removes the given controllers from the GUI.  >>>Once removed, the controllers will effectively be invalid for use<<<
  >>> so dispose of them as well? Need to be careful about textures / anything shared... <<<
  as they will also be removed from the global list of all dat.GUIVR controllers.  Use 'detach' instead if it is
  desired to reuse GUI elements elsewhere.

  If the arguments are invalid, it will attempt to detect this before making any changes, 
  aborting the process and returning false from this method.

  Note: as with add, this overwrites an existing property of THREE.Group.
  As long as no-one expects folders to behave like regular THREE.Groups, that shouldn't matter.
  */
  group.remove = function( ...args ){
    //guiRemove is passed in from index.js and is responsible for sanity checking & removing from global controllers list
    const ok = guiRemove( ...args ); // any invalid arguments should cause this to return false with no side-effects
    if (!ok) return false;
    args.forEach( function( obj ){
      console.assert(group.hasChild(obj), "internal problem with housekeeping logic of dat.GUIVR folder not caught by sanity check");
      if (obj.isFolder) {
        obj.remove( ...obj.guiChildren );
      }
      collapseGroup.remove(obj);
    });
    //TODO: defer actual layout performance; set a flag and make sure it gets done before any rendering or hit-testing happens.
    group.requestLayout();
    return true;
  };

  //rather than method, detachedParent be a property that does this stuff in setter...
  //anyway, both are really meant for internal use, as hinted by _ in name.
  group._setDetachedFrom = (parent) => {
    group.detachedParent = parent;
    if (parent === null) {
      detachButton.material.map = undockTexture;
    } else {
      detachButtonMaterial.map = dockTexture;
      group.showHeader();
      group.showGrabber();
      group.folder = group;
    }
  }
  
  /**
   * Detach a child folder from this folder hierarchy, such that it can be used elsewhere in scene hierarchy.
   * 
   * (will not be visible until explicitly added elsewhere; 
   * calling detach() instead will do this automatically, and is more intended for use in application code
   * while this method is more of an internal implementation detail.)
   */
  group.detachChild = (child) => {
    if (!child.isFolder || child.folder !== group) return false;
    child._setDetachedFrom(group);
    collapseGroup.remove(child);
    //THREE.Object3D.prototype.remove.call(group, child);
    removeImpl(child);
    group.requestLayout();
    return group; //or child?
  };

  /*
    Detach this object from its parent, and reattach to scenegraph as a sibling of the 'top level' folder in
    the hierarchy this previously was a member of.
  */
  group.detach = () => {
    if (group.folder === group) return false;
    //automatically add to THREE parent of top level folder and try to set appropriate scale / transform...
    //if that folder beingMoved at the present time, then it will have an oldParent to which we should attach instead.
    //...although it may be that we want the detached folder to move with the controller until button is released...
    const topFolder = getTopLevelFolder(group);
    group.folder.detachChild(group);
    
    //adding to topFolder.parent IF AVAILABLE, not oldParent, pending working out transform later if beingMoved...
    const par = topFolder.parent || group.parent; 
    if (!par) return; //SJPT change from CSynth, not carefully reviewed but probably right.
    par.add(group);
    const m = topFolder.matrix.clone();

    group.applyMatrix4(m);
    m.setPosition(new THREE.Vector3());
    const t = new THREE.Vector3(Layout.FOLDER_WIDTH, 0, 0).applyMatrix4(m);
    group.position.add(t);
    
    if (topFolder.beingMoved) {
      //detach this object from topFolder.parent then attach to topFolder.oldParent while maintaining matrixWorld
      //...actually, (maybe) we want to do this sceneShift business when beingMoved finishes...
      // put things into semiDetached, so that when beingMoved is set to false, they can be shifted.
      //or maybe what we really want is to have an option to 'pin' panels together and unpin them, rather than assume
      //attachment changes when button released.  For now, this is not quite working right, so...
      const deferSceneShiftWhileMoving = false;

      //we could just detach, leaving the object as direct descendent of scene, but there may be real reasons to situate
      //the GUI within hierarchy somehow (like as children of a controller)
      
      if (deferSceneShiftWhileMoving) {
        topFolder.userData.semiDetached.push(group);
        topFolder.userData.oldParent = topFolder.oldParent;//XXX: hack because topFolder.oldParent was being undefined before beingMoved = false
      } else {
        const child = group;
        const oldParent = topFolder.parent; //oldParent to detach from is the current parent while beingMoved
        const newParent = topFolder.oldParent; //newParent to attach to is oldParent of the folder before it was beingMoved
  
        sceneShift(child, oldParent, newParent);
      }

    } 
    group.userData.isOrthographic = topFolder.userData.isOrthographic; //TODO: revise how to pass this info
    group.fixFolderPosition(0.5);
    group.open();
    return group;
  };

  //ala https://threejs.org/docs/#examples/utils/SceneUtils
  function sceneDetach(child, parent, scene) {
    parent.updateMatrixWorld();
    child.applyMatrix4(parent.matrixWorld);
    parent.remove(child);
    scene.add(child)
  }
  function sceneAttach(child, scene, parent) {
    parent.updateMatrixWorld();
    child.applyMatrix4( new THREE.Matrix4().getInverse(parent.matrixWorld) );
		scene.remove(child);
		parent.add(child);   
  }
  function sceneShift(child, oldParent, newParent) {
    let node = oldParent;
    while (node.parent) node = node.parent;
    const scene = node;
    
    sceneDetach(child, oldParent, scene);
    sceneAttach(child, scene, newParent);
  }

  group.detachFromParent = group.detach;
  
  group.reattach = () => {
    if (!group.detachedParent) return false;
    //TODO: check layout with various combinations of wrapping etc.
    group.detachedParent.addFolder(group); // this will also deal with cosmetics (hideGrabber etc)
    const topFolder = getTopLevelFolder(group.detachedParent);
    if (topFolder.beingMoved) {
      //maybe we could do this kind of stuff in _setDetachedFrom
      //in any case, it's irrelevant if 
      let semis = topFolder.userData.semiDetached;
      const index = semis.indexOf(group);
      if (index > -1) topFolder.userData.semiDetached.splice(index, 1);
    }
    //group.detachedParent = null;
    group._setDetachedFrom(null);
    return true;
  }

  group.addController = function( ...args ){
    args.forEach( function( obj ){
      if (obj.isFolder) {
        group.addFolder(obj);
      } else {
        collapseGroup.add( obj );
        obj.folder = group;
      }
      //XXX: hacking in some universal tooltip support
      if (obj.setToolTip) return; //but not if a more specific implementation already exists (see dropdown...)
      obj.setToolTip = tip => {
        obj.userData.tip = tip;
        //TODO: pay more attention to layout config / make createToolTip have simpler arguments
        const tipObj = createToolTip(textCreator, tip, Layout.FOLDER_WIDTH, obj.spacing, Layout.BUTTON_DEPTH);
        obj.userData.tipObj = tipObj;
        //associate event with hover on appropriate hitscan...

        if (obj.interaction) {
          //TODO: events.off() if replacing old tooltip (or not repeating on()).
          obj.interaction.events.on('tick', () => {
            //don't just set visibility; add/remove as these are killing framerate in large VR guis.
            //REVIEW... considering making tooltips work when hovering on label as well,
            // but of course this would mean changing more about the interaction setup,
            // and having more objects to test in scene hierarchy.
            // Leaving for now, if working more on the library, hopefully fix hover event etc.
            if (obj.visible) setVisibility(obj, tipObj, obj.interaction.hovering());
          });
        } else {
          console.error(`can't create tooltip for ${obj.guiType} because there's no obj.interaction property...`);
        }
      }

      obj.getToolTip = () => obj.userData.tip;
    });

    group.requestLayout();
  };

  group.addFolder = function( ...args ){
    args.forEach( function (obj) {
      //TODO if obj is string, make a new gui and add / return it... but what about varargs?
      collapseGroup.add( obj );
      obj.folder = group;
      obj.matrix.identity();
      obj.scale.set(1,1,1);
      obj.position.set(0,0,0);
      obj.rotation.set(0,0,0);
      
      obj.hideGrabber();
      obj.close();
    });

    group.requestLayout();
  };

  group.promoteZOrder = () => {
    if (getTopLevelFolder(group) !== group || !topFolderStack.includes(group)) {
      //maybe this shouldn't be a 'public method' (but maybe there should be a well-defined public interface).
      console.error(`Warning: inconsistency in folder housekeeping`);
    }
    topFolderStack.splice(topFolderStack.indexOf(group), 1);
    topFolderStack.push(group);
    // console.log(`promoting ${group.folderName}`);
    // console.log(`[${topFolderStack.map(f=>f.folderName).join(', ')}]`);
    //this will result in the object z being different from when mouseIntersection hit it earlier in update.
    //mouseIntersection will then later be used in handleTick of grab interaction, to further mutate position
    //seems ok though (as of 04/12/18)
    if (group.userData.isOrthographic) orthographicFolderLayout();
  };

  //group.userData.orthographicFolderLayout =  orthographicFolderLayout;

  function performLayout(){
    performHeaderLayout();
    
    const wrapNested = false;
    
    const topFolder = getTopLevelFolder(group);
    //starting whole new layout of topFolder?
    if (topFolder === group) {
      if (topFolder.modalEditor && topFolder.modalEditor.performLayout) topFolder.modalEditor.performLayout();
      
      topFolder.userData.layoutInProgress = true;
      topFolder.userData.columnHeight = 0;
      topFolder.userData.columnIndex = 0;
      topFolder.userData.columnYOff = -topFolder.position.y;
      //I could undefine these at the end, but there's no point.

      if (!topFolderStack.includes(group)) {
        topFolderStack.push(group);
        if (group.userData.isOrthographic) orthographicFolderLayout();
        // console.log(`adding ${group.folderName}`);
        // console.log(`[${topFolderStack.map(f=>f.folderName).join(', ')}]`);
      }
    } else {
      //keep counting columnHeight (current y) & index from parent folder.
      group.userData.columnHeight = group.folder.userData.columnHeight;
      group.userData.columnIndex = group.folder.userData.columnIndex; //TODO: make sure to test with deep nesting.
      
      if (topFolderStack.includes(group)) {
        topFolderStack.splice(topFolderStack.indexOf(group), 1);
        if (group.userData.isOrthographic) orthographicFolderLayout();
        // console.log(`removing ${group.folderName}`);
        // console.log(`[${topFolderStack.map(f=>f.folderName).join(', ')}]`);
      }
    }
    
    
    const spacingPerController = Layout.PANEL_HEIGHT + Layout.PANEL_SPACING;
    const emptyFolderSpace = Layout.FOLDER_HEIGHT + Layout.PANEL_SPACING;
    var totalSpacing = emptyFolderSpace;

    collapseGroup.children.forEach( (c) => { c.visible = !state.collapsed } );
    //children should be ordered by guiIndex.
    //if they don't already have one, it can be added here:
    //this should be the only place that we need to consider that property
    //it allows for detaching elements and reattaching in similar place, even if some siblings are also detached.
    let lastGuiIndex = 0;
    //try to allow for the possibility that client program may attempt to restore items 
    //remembering detachedParent but not guiIndex? Noise...
    //const detachedChildren = topFolderStack.filter(f => f.detachedParent === this);
    //collapseGroup.children.concat(detachedChildren).forEach( (c, i) => {
    collapseGroup.children.forEach( (c, i) => {
        if (c.guiIndex === undefined) {
        c.guiIndex = lastGuiIndex+=1;
      } else lastGuiIndex = c.guiIndex;
    });
    collapseGroup.children.sort((a, b) => { return a.guiIndex - b.guiIndex });

    if ( state.collapsed ) {
      downArrow.rotation.z = Math.PI * 0.5;
    } else {
      downArrow.rotation.z = 0;

      var y = 0, lastHeight = emptyFolderSpace;

      collapseGroup.children.forEach( function( child, index ){
        if (child.isFolder) {
          child.userData.columnYOff = group.userData.columnYOff - y; //except 'y' will be wrong...
          child.performLayout();
        }
        if ( !wrapNested ) {
          //Original layout algorithm
          var h = child.spacing ? child.spacing : spacingPerController;
          // how far to get from the middle of previous to middle of this child?
          // half of the height of previous plus half height of this.
          // if we've wrapped to a new column recently, how is this affected?
          // spacing property should then be spacing *within current column*, so the way we track totalSpacing should reflect that.
          var spacing = 0.5 * (lastHeight + h);
  
          if (child.isFolder) {
            // For folders, the origin isn't in the middle of the entire height of the folder,
            // but just the middle of the top panel.
            var offset = 0.5 * (lastHeight + emptyFolderSpace);
            child.position.y = y - offset;
          } else {
            child.position.y = y - spacing;
          }
          // in any case, for use by the next object along we remember 'y' as the middle of the whole panel
          y -= spacing;
          lastHeight = h;
          

          if (index < MAX_FOLDER_ITEMS_IN_COLUMN)
            totalSpacing += h;
          child.position.x = 0.026;
  
          if ((index+1) % MAX_FOLDER_ITEMS_IN_COLUMN === 0) y = 0;
  
          child.position.x += width * Math.floor(index / MAX_FOLDER_ITEMS_IN_COLUMN);


        } else {
          //new layout algorithm WIP, should allow for nested folders to wrap to the top of a new column, with all folders
          //in hierarchy using same column layout
          const maxColHeight = MAX_FOLDER_ITEMS_IN_COLUMN * spacingPerController; //MAX_FOLDER_ITEMS is slight misnomer
          const h = child.spacing ? child.spacing : spacingPerController;
          const childDidWrap = child.isFolder && child.userData.columnIndex > group.userData.columnIndex;
          
          //move to a new column?
          if (group.userData.columnHeight > maxColHeight) {
            //TODO: maybe add an extra header thing to allow folding nested folder?
            group.userData.columnIndex++; 
            group.userData.columnHeight = h;
            totalSpacing = 0; //h will be added later
            lastHeight = 0; //???? what should this be?  Original algorithm it's 'emptyFolderSpace'
            //check logic of this WRT deeper nesting (should be position relative to topFolder rather than immediate parent)
            //what I should do is use accummulation of all folder levels + one parent above.
            //y = -group.position.y;
            y = group.userData.columnYOff;
          } else {
            group.userData.columnHeight += h;
          }

          //var spacing = 0.5 * (lastHeight + h);
          let spacing = 0.5 * (lastHeight + h);


          if (child.isFolder) {
            // For folders, the origin isn't in the middle of the entire height of the folder,
            // but just the middle of the top panel....
            var offset = 0.5 * (lastHeight + emptyFolderSpace);
            child.position.y = y - offset;
          } else {
            child.position.y = y - spacing;
          }
          // in any case, for use by the next object along we remember 'y' as the middle of the whole panel
          //XXX: this logic doesn't work for column wrapping, (because of how spacing is computed above?)
          y -= spacing;
          lastHeight = h;

          totalSpacing += h;
          child.position.x = 0.026;
          child.position.x += width * group.userData.columnIndex; //nb for nested, consider difference between group & parent
          
          if (child.isFolder) {
            //if (child.userData.columnIndex > group.userData.columnIndex) lastHeight = 0;
            group.userData.columnHeight = child.userData.columnHeight;
            group.userData.columnIndex = child.userData.columnIndex;
          }
        }
        child.updateMatrix();
      });
    }
    
    group.spacing = totalSpacing;
    
    // if we're a subfolder, use a smaller panel
    let panelWidth = Layout.FOLDER_WIDTH;
    if (group.folder !== group) {
      panelWidth = Layout.SUBFOLDER_WIDTH;
    }
    
    Layout.resizePanel(panel, panelWidth, Layout.FOLDER_HEIGHT, depth);

    if (topFolder === group) {
      group.userData.layoutInProgress = false;
      group.userData.layoutPending = false;
      group.fixFolderPosition();
    }
  }


  function performHeaderLayout() {
    let dx = Layout.FOLDER_HEIGHT;
    let x = Layout.FOLDER_WIDTH;
    headerItems.children.forEach((c) => {
      if (!c.visible) return;
      x -= dx * 0.8;
      c.position.x = x;
      x -= dx * 0.3; //TODO: dehackify
    });
  }
  
  function updateView(){
    if( interaction.hovering() ){
      panel.material.color.setHex( Colors.HIGHLIGHT_BACK );
    }
    else{
      panel.material.color.setHex( Colors.DEFAULT_FOLDER_BACK );
    }

    if( grabInteraction.hovering() ){
      grabber.material.color.setHex( Colors.HIGHLIGHT_BACK );
    }
    else{
      grabber.material.color.setHex( Colors.DEFAULT_FOLDER_BACK );
    }

    //TODO: more consistent hover styling
    if ( detachButtonInteraction.hovering() ) {
      detachButtonMaterial.color.setHex( 0xFFFFFF );
    } else {
      detachButtonMaterial.color.setHex( 0x888888 );
    }
  }

  const interaction = createInteraction( panel );
  interaction.events.on( 'onPressed', function( p ){
    if (state.collapsed) group.open();
    else group.close();
    p.locked = true;
  });

  group.open = function() {
    if (!state.collapsed) return;
    if (group.folder !== group && group.folder.accordion) {
      group.folder.guiChildren.filter(c=>c.isFolder && c !== group).forEach(c=>c.close());
    }
    state.collapsed = false;
    addImpl(collapseGroup);
    group.requestLayout();
  };

  group.close = function() {
    if (state.collapsed) return;
    state.collapsed = true;
    removeImpl(collapseGroup);
    group.requestLayout();
  };

  group.folder = group;

  const grabInteraction = Grab.create( { group, panel: grabber } );
  const paletteInteraction = Palette.create( { group, panel } );
  group.updateControl = function( inputObjects ){
    //nb: if the control is not visible / active, then it won't interfere...    
    //but "if (!isDetachable)" here causes problems.
    
    //headerItems should now have their own updateControl and be in globalControllers list
    //headerItems.children.forEach(o => o.interaction.update(inputObjects));
    interaction.update( inputObjects );
    grabInteraction.update( inputObjects );
    paletteInteraction.update( inputObjects );

    updateView();
  };

  //'grabReleased' is emitted on input.events... used for ortho mouse fixFolderPosition
  
  group.name = function( str ){
    descriptorLabel.updateLabel( str );
    return group;
  };

  let _beingMoved = false;
  //group.hitscan = [ panel, grabber, detachButton ];
  
  /////EXPERIMENTAL FEATURE, CURRENTLY HARDCODED NOT TO HAPPEN
  //sub-folders that are detached while moving remain attached to parent object (the controller that's moving them)
  //& kept in semiDetached until beingMoved is set to false, at which point they shift attachment to oldParent
  group.userData.semiDetached = [];

  Object.defineProperties(group, {
    hitscan: {
      get: () => {
        //don't need to filter visible here, this'll be done in index.js getVisibleHitscanObjects()
        //(implementation note 31/7/19; ...headerItems.children here being removed as each headerItem
        //should now be closer to 'fully fledged' controller)
        let hits = [ panel, grabber ];
        if (group.modalEditor) hits = hits.concat(...group.modalEditor.hitscan);
        return hits;
      }
    },
    beingMoved: {
      get: () => {
        return _beingMoved;
      },
      set: (value) => {
        _beingMoved = value;
        if (!_beingMoved) {
          const oldParent = group.parent; //oldParent to detach from is the current parent while beingMoved
          const newParent = group.userData.oldParent; //newParent to attach to is oldParent of the folder before it was beingMoved
          //assertion... this should never happen (and doesn't AFAICT).
          if (getTopLevelFolder(group) !== group) {
            console.log("Housekeeping problem in dat.GUIVR...");
          }
          
          group.userData.semiDetached.forEach(child => {
            //as well as this currently ending up with wrong transform, I also have wrong transform if I drag folder while semiDeatched...
            //**although in that case, it shifts back to where it should be when button is released**
            sceneShift(child, oldParent, newParent);
          });
          group.userData.semiDetached = [];
        }
      }
    }
  });


  for (let k in addControllerFuncs) {
    group[k] = (...args) => {
      const controller = addControllerFuncs[k](...args);
      if ( controller ){
        group.addController( controller );
        return controller;
      }
      else {
        return new THREE.Group();
      }
    }
  }

  return group;
}
