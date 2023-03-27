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
import Emitter from 'events';
import { getTopLevelFolder } from './utils';

export const globalEvents = new Emitter();

export default function createInteraction( hitVolume ){
  const events = new Emitter();

  let anyHover = false;
  let anyPressing = false;
  let anyActive = false;

  const tVector = new THREE.Vector3();
  const availableInputs = [];

  function update( inputObjects ){

    anyHover = false;
    anyPressing = false;
    anyActive = false;

    inputObjects.forEach( function( input ){

      if( availableInputs.indexOf( input ) < 0 ){
        availableInputs.push( input );
      }

      const { hitObject, hitPoint } = extractHit( input );

      var hover = hitVolume === hitObject;
      anyHover = anyHover || hover;

      
      
      performStateEvents({
        input,
        hover,
        hitObject, hitPoint,
        buttonName: 'pressed',
        buttonClickName: 'clicked', //maybe not stable part of API...
        interactionName: 'press',
        downName: 'onPressed',
        holdName: 'pressing',
        upName: 'onReleased',
         //inventing a 'hovering' event that only applies to 'pressed' button...
         //this should not be considered a stable interface, but I wants it more than I
         //want to make something totally coherent and robust just now.
        hoverName: 'hovering'
      });

      performStateEvents({
        input,
        hover,
        hitObject, hitPoint,
        buttonName: 'gripped',
        interactionName: 'grip',
        downName: 'onGripped',
        holdName: 'gripping',
        upName: 'onReleaseGrip'
      });

      events.emit( 'tick', {
        input,
        hitObject,
        inputObject: input.object
      } );

    });

  }

  function extractHit( input ){
    if( input.intersections.length <= 0 ){
      return {
        hitPoint: tVector.setFromMatrixPosition( input.cursor.matrixWorld ).clone(), //xxx: garbage?
        hitObject: undefined,
      };
    }
    else{
      return {
        hitPoint: input.intersections[ 0 ].point,
        hitObject: input.intersections[ 0 ].object
      };
    }
  }

  function performStateEvents({
    input, hover,
    hitObject, hitPoint,
    buttonName, buttonClickName, interactionName, downName, holdName, upName, hoverName
  } = {} ){

    if( input[ buttonName ] === true && hitObject === undefined ){
      //clicked and didn't hit any GUI object.
      //flag that what we've clicked *isn't* part of a modal editor
      input.hitNonModal = true;
      return;
    }

    // hovering and button NOT down
    if( hoverName && hover && input[ buttonName ] === false ) {
      const payload = {
        input,
        hitObject,
        point: hitPoint,
        inputObject: input.object,
        locked: false
      };
      events.emit( hoverName, payload );
    }

    //  hovering and button down but no interactions active yet
    //---> should be ^ button 'clicked'... ie only if it came down since the last update.
    //so, should we pass 'buttonClickName' as an argument (and use buttonName if not provided)?
    //--->>>> XXX: is this \\\\\\\\\\\\\\//////////// working with Vive controllers? 
    if( hover && input[ buttonClickName || buttonName ] === true && input.interaction[ interactionName ] === undefined ){

      const payload = {
        input,
        hitObject,
        point: hitPoint,
        inputObject: input.object,
        locked: false
      };

      //flag that what we've clicked *isn't* part of a modal editor
      if (!hitObject.userData.partOfModal) input.hitNonModal = true;

      promoteZOrder(hitObject);
      
      //emit global click event as well...
      globalEvents.emit( downName, payload );
      events.emit( downName, payload );

      if( payload.locked ){
        input.interaction[ interactionName ] = interaction;
        input.interaction.hover = interaction;
      }

      anyPressing = true;
      anyActive = true;
    }

    //  button still down and this is the active interaction
    if( input[ buttonName ] && input.interaction[ interactionName ] === interaction ){
      const payload = {
        input,
        hitObject,
        point: hitPoint,
        inputObject: input.object,
        locked: false
      };

      events.emit( holdName, payload );

      anyPressing = true;

      input.events.emit( 'onControllerHeld' );
    }

    //  button not down and this is the active interaction
    if( input[ buttonName ] === false && input.interaction[ interactionName ] === interaction ){
      input.interaction[ interactionName ] = undefined;
      input.interaction.hover = undefined;
      events.emit( upName, {
        input,
        hitObject,
        point: hitPoint,
        inputObject: input.object
      });
    }

  }

  function promoteZOrder(hitObject) {
    const topFolder = getTopLevelFolder(hitObject);
    topFolder.promoteZOrder();
  }

  function isMainHover(){

    let noMainHover = true;
    for( let i=0; i<availableInputs.length; i++ ){
      if( availableInputs[ i ].interaction.hover !== undefined ){
        noMainHover = false;
        break;
      }
    }

    if( noMainHover ){
      return anyHover;
    }

    if( availableInputs.filter( function( input ){
      return input.interaction.hover === interaction;
    }).length > 0 ){
      return true;
    }

    return false;
  }


  const interaction = {
    hovering: isMainHover,
    pressing: ()=>anyPressing,
    update,
    events,
    hitVolume
  };

  return interaction;
}

