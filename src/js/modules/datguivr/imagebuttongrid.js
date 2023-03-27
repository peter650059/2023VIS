/** 
 * Grid of buttons with images on (which might come from a file or existing texture,
 * the texture might be from a RenderTarget...).
 * 
 * I'd put this more separate from the datgui modules but need to think a little
 * bit about how to structure that etc.  Very un-DRY, but I'm starting by just
 * copying existing imagebutton.js in its entirety.
 * 
 * TODO: not just simple 'bang' function but callbacks for hover / etc.
 * 
 * 
 * Copyright  Data Arts Team, Google inc. 2016 / Peter Todd, 2017
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

import {createTextLabel, createToolTip} from './textlabel';
import createInteraction from './interaction';
import * as Colors from './colors';
import * as Layout from './layout';
import * as SharedMaterials from './sharedmaterials';
import * as Grab from './grab';
import {setVisibility} from './utils';

export default function createImageButtonGrid( {
  textCreator,
  objects, // array of {func, image | text, tip(optional), release(optional)}
  width = Layout.PANEL_WIDTH,
  rowHeight,
  depth = Layout.PANEL_DEPTH,
  columns = 4
} = {} ){
  
  function applyImageToMaterial(image, targetMaterial) {
      if (typeof image === "string") {
        //TODO cache.  Does TextureLoader already cache?
        new THREE.TextureLoader().load(image, (texture) => {
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            targetMaterial.map = texture;
            targetMaterial.needsUpdate = true;
        });
      } else if (image.isTexture) {
          targetMaterial.map = image;
      } else if (image.isWebGLRenderTarget) {
          targetMaterial.map = image.texture;
      } else throw "not sure how to interpret image " + image;
      targetMaterial.needsUpdate = true;
  }

  const margin = Layout.PANEL_MARGIN * 3;
  const BUTTON_WIDTH = (width - margin) * (1/columns);
  //TODO: add setRowHeight method
  let BUTTON_HEIGHT = rowHeight > 0 ? rowHeight : BUTTON_WIDTH;
  const BUTTON_DEPTH = Layout.BUTTON_DEPTH;

  const group = new THREE.Group();
  group.guiType = "imagebuttongrid";
  group.toString = () => `[${group.guiType}: ${objects}]`;
  
  const rows = Math.ceil(objects.length / columns);
  let height = Layout.PANEL_MARGIN + BUTTON_HEIGHT * rows;
  group.spacing = height;

  group.setRowHeight = h => {
    rowHeight = BUTTON_HEIGHT = h;
    height = Layout.PANEL_MARGIN + BUTTON_HEIGHT * rows;
    group.spacing = height;
    layoutButtons();
    return group;
  };

  let highlightLastPressed = false;
  let lastPressed = null;
  let lastPressedCol;
  group.highlightLastPressed = (col = 0x3355EE) => {
      highlightLastPressed = col !== false;
      lastPressedCol = col;
      return group;
  }
  
  let panel, grabInteraction, buttons = [];

  layoutButtons();
  
  function initPanel() {
    if (panel) group.remove(panel);
    panel = Layout.createPanel( width, height, depth );
    group.add( panel );
    
    const controllerID = Layout.createControllerIDBox( height, Colors.CONTROLLER_ID_BUTTON );
    controllerID.position.z = depth;
    panel.add(controllerID);
    
    grabInteraction = Grab.create( { group, panel } );
    
    buttons.forEach(b=>group.remove(b));
    buttons = [];
    group.guiChildren = buttons;
  }
  
  function layoutButtons() {
    initPanel();
    //TODO: padding
    const buttonWPadded = BUTTON_WIDTH * 0.99, buttonHPadded = BUTTON_HEIGHT * 0.99;
    const rect = new THREE.PlaneGeometry( buttonWPadded, buttonHPadded, 1, 1 );
    rect.translate( buttonWPadded / 2, -buttonHPadded / 2, BUTTON_DEPTH );

    var i = 0;
    
    //TODO: toggles rather than triggers...
    objects.forEach((obj, i) => {
        if (!obj.image && !obj.text) {
            return;
        }
        let subgroup = new THREE.Group(); //note: reducing nesting could improve performance.
        subgroup.guiType = "imageButtonGridElement";
        group.add(subgroup);
        buttons.push(subgroup);

        const col = i % columns;
        const row = Math.floor(i / columns);

        subgroup.position.x = (2*Layout.PANEL_MARGIN) + BUTTON_WIDTH * col;
        subgroup.position.y = (height/2) -BUTTON_HEIGHT * row;
        subgroup.position.z = BUTTON_DEPTH;

        //  hitscan volume.
        // This material could probably be reused.
        const hitscanMaterial = new THREE.MeshBasicMaterial();
        hitscanMaterial.visible = false;

        const hitscanVolume = new THREE.Mesh( rect.clone(), hitscanMaterial );

        const material = new THREE.MeshBasicMaterial();
        material.transparent = true;
        if (obj.image) applyImageToMaterial(obj.image, material);
        if (obj.text) {
            const text = textCreator.create(obj.text);
            const margin = 2*Layout.GRID_BUTTON_MARGIN;
            let h = Layout.TEXT_SCALE * text.layout.height;
            let w = text.computeWidth();
            if (w > BUTTON_WIDTH - margin) {
                text.constrainBounds(BUTTON_WIDTH - margin, BUTTON_HEIGHT - margin); //<--
                h = Layout.TEXT_SCALE * text.layout.height;
                w = text.computeWidth();
            }
            subgroup.add(text);
            subgroup.text = text;
            text.position.x = obj.textX || 0.5 * (BUTTON_WIDTH - w);
            text.position.y = obj.textY || -0.5 * BUTTON_HEIGHT - h;
            text.position.z = BUTTON_DEPTH * 1.2;
        }
        const filledVolume = new THREE.Mesh( rect.clone(), material );
        hitscanVolume.add( filledVolume );

        //button label & descriptor label removed.
        //Tooltip text option added.  Might want to be able to pass in richer things...
        //maybe an arbitrary THREE object would work well...
        if (obj.tip) {
            const tipText = createToolTip(textCreator, obj.tip, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_DEPTH);
            
            //subgroup.add(tipText);
            subgroup.tipText = tipText;
        }
        
        //panel.add( descriptorLabel, hitscanVolume, controllerID );
        subgroup.add( hitscanVolume );
        panel.add(subgroup);

        const interaction = createInteraction( hitscanVolume );
        interaction.events.on( 'onPressed', handleOnPress );
        interaction.events.on( 'onReleased', handleOnRelease );


        function handleOnPress( p ){
            if( subgroup.visible === false ){
                return;
            }

            p.locked = true;
            //TODO: standardise handling of exceptions in callbacks
            try {
                obj.func();
            } catch (e) {
                obj.error = e || 'undefined exception';
                return;
            }
            lastPressed = obj;
            subgroup.position.z = BUTTON_DEPTH * 0.4;
        }

        function handleOnRelease(){
            subgroup.position.z = BUTTON_DEPTH;
            if (obj.release) obj.release();
        }
        //quick color hack...
        const hoverCol = obj.text ? 0x888 : 0xFFFFFF;
        const noHoverCol = obj.text ? 0x111 : 0xCCCCCC;
        subgroup.updateView = () => {
            if (highlightLastPressed && lastPressed === obj) {
                material.color.setHex( lastPressedCol );
            }
            else material.color.setHex( interaction.hovering() ? hoverCol : noHoverCol );
            if (subgroup.tipText) setVisibility(subgroup, subgroup.tipText, interaction.hovering());
            if (obj.error) material.color.setHex( 0xAA3333);
        }
        
        subgroup.updateView();

        subgroup.interaction = interaction;
        subgroup.hitscan = hitscanVolume; //XXX: making this single element rather than array,
        //that means these 'subgroup' buttons aren't acting exactly as normal dat.GUIVR controllers
    });

    group.hitscan = buttons.map(b=>b.hitscan);//.push(panel);
    group.hitscan.push(panel);
  }


  function updateView() {
      buttons.forEach(b=>b.updateView());
  }
  
  group.updateControl = function( inputObjects ){
    buttons.forEach(b=>{
        b.interaction.update( inputObjects );
    });
    //interaction.update( inputObjects );
    grabInteraction.update( inputObjects );
    updateView();
  };

  group.name = function( str ){
    descriptorLabel.updateLabel( str );
    return group;
  };


  return group;
}