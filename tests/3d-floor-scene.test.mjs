import test from 'node:test';
import assert from 'node:assert/strict';
import {floorSceneData,schematicPolyline} from '../lib/3d-floor-scene.mjs';
import {places,shortestPath} from '../src/data/hospital.mjs';
import {floorPlanPoint} from '../src/data/floor-plan.mjs';
test('3D rooms use exactly the 2D schematic positions',()=>{for(const floor of [0,1,2])for(const room of floorSceneData(floor).rooms){const p=places.find(p=>p.id===room.id);assert.deepEqual({x:room.x,y:room.y},floorPlanPoint(p))}});
test('3D highlighted paths are destination-specific and stay on the selected floor',()=>{const opd=floorSceneData(1,shortestPath('entrance','opd-1').path,'opd-1');const other=floorSceneData(1,shortestPath('entrance','opd-2').path,'opd-2');assert.notDeepEqual(opd.highlighted,other.highlighted);assert.equal(opd.rooms.filter(p=>p.selected).length,1);assert.equal(opd.rooms.find(p=>p.selected).id,'opd-1');assert.equal(floorSceneData(2,shortestPath('entrance','pharmacy').path,'pharmacy').highlighted.length,0)});
test('orthogonal floor paths parse without inventing diagonal geometry',()=>{assert.deepEqual(schematicPolyline('M47 64 V35 H15 V22'),[{x:47,y:64},{x:47,y:35},{x:15,y:35},{x:15,y:22}]);assert.throws(()=>floorSceneData(3),/Invalid floor/)});
